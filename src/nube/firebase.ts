// Kumi en la nube (Firebase): cuentas con Google, restaurante compartido, horarios publicados y tablón.
// El jefe sigue trabajando en su móvil; solo sube lo que publica. El equipo lo lee.
// Mismas colecciones y reglas que la versión 2 (firestore.rules): las dos versiones conviven sin problema.
import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, connectAuthEmulator, getAuth, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  addDoc, collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, initializeFirestore, limit, onSnapshot,
  orderBy, persistentLocalCache, query, serverTimestamp, setDoc, updateDoc, writeBatch,
} from 'firebase/firestore';

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
export const enEmulador = location.hostname === 'localhost' && new URLSearchParams(location.search).has('emulador');
if (enEmulador) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function nuevoCodigo() {
  const r = crypto.getRandomValues(new Uint32Array(6));
  return Array.from(r, (n) => LETRAS[n % LETRAS.length]).join('');
}
function yo(): User {
  const u = auth.currentUser;
  if (!u) throw new Error('Sin sesión');
  return u;
}

export interface PersonaNube { id: string; nombre: string; contrato: number | null }
export interface SemanaNube { equipo: PersonaNube[]; turnos: Record<string, string[]>; libres: Record<string, number[]> }
export interface Codigo { rid: string; dueno: string; nombre: string; tipo: string; equipo: PersonaNube[] }
export interface Miembro { uid: string; rol: string; codigo: string; personaId: string | null; nombre: string; correo: string }
export interface Aviso { id: string; texto: string; creado: number }
export interface Leido { uid: string; personaId: string | null; nombre: string }

export const nube = {
  usuario: () => auth.currentUser,
  alCambiarSesion: (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb),
  entrar: () => (Capacitor.isNativePlatform()
    ? Promise.reject(Object.assign(new Error('Entrar con Google en la app nativa aún no está configurado'), { code: 'kumi/nativo-sin-configurar' }))
    : signInWithPopup(auth, new GoogleAuthProvider())),
  salir: () => signOut(auth),
  // Solo con el simulador: entrar como una persona de prueba sin la ventana de Google.
  entrarPrueba: enEmulador
    ? (nombre: string, correo: string) => signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: correo, email: correo, email_verified: true, name: nombre })))
    : undefined,

  // --- Jefe ---
  async crearRestaurante({ nombre, tipo, equipo }: { nombre: string; tipo: string; equipo: PersonaNube[] }) {
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
  async publicarSemana(rid: string, codigo: string, clave: string, semana: SemanaNube, cabecera: { nombre: string; tipo: string }) {
    yo();
    const lote = writeBatch(db);
    lote.set(doc(db, 'restaurantes', rid, 'semanas', clave), { ...semana, publicado: serverTimestamp() });
    lote.update(doc(db, 'restaurantes', rid), { nombre: cabecera.nombre, tipo: cabecera.tipo });
    lote.update(doc(db, 'codigos', codigo), { nombre: cabecera.nombre, tipo: cabecera.tipo, equipo: semana.equipo });
    await lote.commit();
  },
  async miembros(rid: string): Promise<Miembro[]> {
    const r = await getDocs(collection(db, 'restaurantes', rid, 'miembros'));
    return r.docs.map((d) => ({ uid: d.id, ...d.data() }) as Miembro);
  },
  vincular: (rid: string, uid: string, personaId: string | null) => updateDoc(doc(db, 'restaurantes', rid, 'miembros', uid), { personaId }),
  quitarMiembro: (rid: string, uid: string) => deleteDoc(doc(db, 'restaurantes', rid, 'miembros', uid)),

  // --- Equipo ---
  async leerCodigo(codigo: string): Promise<Codigo | null> {
    yo();
    const d = await getDoc(doc(db, 'codigos', codigo));
    return d.exists() ? (d.data() as Codigo) : null;
  },
  async unirse(codigo: string, rid: string, personaId: string) {
    const u = yo();
    await setDoc(doc(db, 'restaurantes', rid, 'miembros', u.uid), {
      rol: 'equipo', codigo, personaId, nombre: u.displayName || '', correo: u.email || '', unido: serverTimestamp(),
    });
  },
  async leerRestaurante(rid: string): Promise<{ nombre: string; tipo: string } | null> {
    const d = await getDoc(doc(db, 'restaurantes', rid));
    return d.exists() ? (d.data() as { nombre: string; tipo: string }) : null;
  },
  async leerMiFicha(rid: string): Promise<{ personaId: string | null } | null> {
    const d = await getDoc(doc(db, 'restaurantes', rid, 'miembros', yo().uid));
    return d.exists() ? (d.data() as { personaId: string | null }) : null;
  },
  salirDelRestaurante: (rid: string) => deleteDoc(doc(db, 'restaurantes', rid, 'miembros', yo().uid)),
  // Avisa cada vez que el jefe publica o cambia una semana.
  escucharSemanas(rid: string, cb: (s: (SemanaNube & { clave: string; publicado: number })[]) => void, alFallar: () => void) {
    return onSnapshot(collection(db, 'restaurantes', rid, 'semanas'),
      (r) => cb(r.docs.map((d) => { const x = d.data(); return { clave: d.id, ...(x as SemanaNube), publicado: x.publicado ? x.publicado.toMillis() : Date.now() }; })),
      alFallar);
  },

  // --- Tablón de avisos ---
  publicarAviso: (rid: string, texto: string) => addDoc(collection(db, 'restaurantes', rid, 'avisos'), { texto, creado: serverTimestamp() }),
  // Borrar un documento no borra lo que cuelga de él: primero las lecturas, luego el aviso.
  async borrarAviso(rid: string, aid: string) {
    const leidos = await getDocs(collection(db, 'restaurantes', rid, 'avisos', aid, 'leidos'));
    const lote = writeBatch(db);
    leidos.docs.forEach((d) => lote.delete(d.ref));
    lote.delete(doc(db, 'restaurantes', rid, 'avisos', aid));
    await lote.commit();
  },
  async leidosDe(rid: string, aid: string): Promise<Leido[]> {
    const r = await getDocs(collection(db, 'restaurantes', rid, 'avisos', aid, 'leidos'));
    return r.docs.map((d) => ({ uid: d.id, ...d.data() }) as Leido);
  },
  marcarLeido(rid: string, aid: string, personaId: string | null | undefined) {
    const u = yo();
    return setDoc(doc(db, 'restaurantes', rid, 'avisos', aid, 'leidos', u.uid), { personaId: personaId || null, nombre: u.displayName || '', cuando: serverTimestamp() });
  },
  escucharAvisos(rid: string, cb: (a: Aviso[]) => void, alFallar: () => void) {
    return onSnapshot(query(collection(db, 'restaurantes', rid, 'avisos'), orderBy('creado', 'desc'), limit(30)),
      (r) => cb(r.docs.map((d) => {
        const a = d.data({ serverTimestamps: 'estimate' });
        return { id: d.id, texto: a.texto, creado: a.creado ? a.creado.toMillis() : Date.now() };
      })),
      alFallar);
  },
};

// Con el simulador, las pruebas automáticas entran con nube.entrarPrueba() desde la consola del navegador.
if (enEmulador) (window as unknown as { kumiNube: typeof nube }).kumiNube = nube;
