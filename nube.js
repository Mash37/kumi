// Kumi en la nube (Firebase): cuentas con Google, restaurante compartido y horarios publicados.
// El jefe sigue trabajando en su móvil; solo sube lo que publica. El equipo lo lee.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, onAuthStateChanged, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, connectFirestoreEmulator, doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc,
  onSnapshot, writeBatch, serverTimestamp, query, orderBy, limit,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// Identificadores públicos de la app web: la seguridad la ponen las reglas de firestore.rules.
const app = initializeApp({
  apiKey: 'AIzaSyCOraaVwyfhSU_TEUv6w78FGxmOMuTYaoc',
  authDomain: 'kumi-22211.firebaseapp.com',
  projectId: 'kumi-22211',
  storageBucket: 'kumi-22211.firebasestorage.app',
  messagingSenderId: '466200114630',
  appId: '1:466200114630:web:1106bb08c19d8eb4102ec7',
});
const auth = getAuth(app);
const db = initializeFirestore(app, { localCache: persistentLocalCache() });
// Solo para pruebas en el ordenador: http://localhost:…/?emulador usa el simulador local, nunca el proyecto real.
const enEmulador = location.hostname === 'localhost' && new URLSearchParams(location.search).has('emulador');
if (enEmulador) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function nuevoCodigo() {
  const r = crypto.getRandomValues(new Uint32Array(6));
  return Array.from(r, (n) => LETRAS[n % LETRAS.length]).join('');
}
function yo() {
  const u = auth.currentUser;
  if (!u) throw new Error('Sin sesión');
  return u;
}

window.nube = {
  enEmulador,
  usuario: () => auth.currentUser,
  alCambiarSesion: (cb) => onAuthStateChanged(auth, cb),
  entrar: () => signInWithPopup(auth, new GoogleAuthProvider()),
  salir: () => signOut(auth),
  // Solo con el simulador: entrar como una persona de prueba sin la ventana de Google.
  entrarPrueba: enEmulador
    ? (nombre, correo) => signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: correo, email: correo, email_verified: true, name: nombre })))
    : undefined,

  // --- Jefe ---
  async crearRestaurante({ nombre, tipo, equipo }) {
    const u = yo();
    let codigo = nuevoCodigo();
    for (let i = 0; i < 5 && (await getDoc(doc(db, 'codigos', codigo))).exists(); i++) codigo = nuevoCodigo();
    const ref = doc(collection(db, 'restaurantes'));
    const lote = writeBatch(db);
    lote.set(ref, { nombre, tipo, dueno: u.uid, codigo, creado: serverTimestamp() });
    lote.set(doc(db, 'codigos', codigo), { rid: ref.id, dueno: u.uid, nombre, tipo, equipo });
    await lote.commit();
    return { rid: ref.id, codigo };
  },
  async publicarSemana(rid, codigo, clave, semana, cabecera) {
    yo();
    const lote = writeBatch(db);
    lote.set(doc(db, 'restaurantes', rid, 'semanas', clave), { ...semana, publicado: serverTimestamp() });
    lote.update(doc(db, 'restaurantes', rid), { nombre: cabecera.nombre, tipo: cabecera.tipo });
    lote.update(doc(db, 'codigos', codigo), { nombre: cabecera.nombre, tipo: cabecera.tipo, equipo: semana.equipo });
    await lote.commit();
  },
  async miembros(rid) {
    const r = await getDocs(collection(db, 'restaurantes', rid, 'miembros'));
    return r.docs.map((d) => ({ uid: d.id, ...d.data() }));
  },
  vincular: (rid, uid, personaId) => updateDoc(doc(db, 'restaurantes', rid, 'miembros', uid), { personaId }),
  quitarMiembro: (rid, uid) => deleteDoc(doc(db, 'restaurantes', rid, 'miembros', uid)),

  // --- Equipo ---
  async leerCodigo(codigo) {
    yo();
    const d = await getDoc(doc(db, 'codigos', codigo));
    return d.exists() ? d.data() : null;
  },
  async unirse(codigo, rid, personaId) {
    const u = yo();
    await setDoc(doc(db, 'restaurantes', rid, 'miembros', u.uid), {
      rol: 'equipo', codigo, personaId, nombre: u.displayName || '', correo: u.email || '', unido: serverTimestamp(),
    });
  },
  async leerRestaurante(rid) {
    const d = await getDoc(doc(db, 'restaurantes', rid));
    return d.exists() ? d.data() : null;
  },
  async leerMiFicha(rid) {
    const d = await getDoc(doc(db, 'restaurantes', rid, 'miembros', yo().uid));
    return d.exists() ? d.data() : null;
  },
  salirDelRestaurante: (rid) => deleteDoc(doc(db, 'restaurantes', rid, 'miembros', yo().uid)),
  // --- Tablón de avisos ---
  publicarAviso: (rid, texto) => addDoc(collection(db, 'restaurantes', rid, 'avisos'), { texto, creado: serverTimestamp() }),
  // Borrar un documento no borra lo que cuelga de él: primero las lecturas, luego el aviso.
  async borrarAviso(rid, aid) {
    const leidos = await getDocs(collection(db, 'restaurantes', rid, 'avisos', aid, 'leidos'));
    const lote = writeBatch(db);
    leidos.docs.forEach((d) => lote.delete(d.ref));
    lote.delete(doc(db, 'restaurantes', rid, 'avisos', aid));
    await lote.commit();
  },
  async leidosDe(rid, aid) {
    const r = await getDocs(collection(db, 'restaurantes', rid, 'avisos', aid, 'leidos'));
    return r.docs.map((d) => ({ uid: d.id, ...d.data() }));
  },
  marcarLeido(rid, aid, personaId) {
    const u = yo();
    return setDoc(doc(db, 'restaurantes', rid, 'avisos', aid, 'leidos', u.uid), { personaId: personaId || null, nombre: u.displayName || '', cuando: serverTimestamp() });
  },
  escucharAvisos(rid, cb, alFallar) {
    return onSnapshot(query(collection(db, 'restaurantes', rid, 'avisos'), orderBy('creado', 'desc'), limit(30)),
      (r) => cb(r.docs.map((d) => {
        const a = d.data({ serverTimestamps: 'estimate' });
        return { id: d.id, texto: a.texto, creado: a.creado ? a.creado.toMillis() : Date.now() };
      })),
      alFallar);
  },
  // Avisa cada vez que el jefe publica o cambia una semana.
  escucharSemanas(rid, cb, alFallar) {
    return onSnapshot(collection(db, 'restaurantes', rid, 'semanas'),
      (r) => cb(r.docs.map((d) => ({ clave: d.id, ...d.data(), publicado: d.data().publicado ? d.data().publicado.toMillis() : Date.now() }))),
      alFallar);
  },
};
window.dispatchEvent(new Event('nube-lista'));
