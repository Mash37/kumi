// Sesión en línea: quién ha entrado y qué se está escuchando en directo (semanas publicadas y tablón).
import type { User } from 'firebase/auth';
import { create } from 'zustand';
import { usarAlmacen } from '../datos/almacen';
import { usarUi } from '../estado/ui';
import type { Aviso } from './firebase';
import { cargarNube } from '.';
import { semanaDesdeNube } from './conversion';

interface Sesion { usuario: User | null; avisos: Aviso[]; lista: boolean }
/** «lista»: ya se sabe si hay alguien con la sesión abierta (hasta entonces no se enseña «Entrar con Google»). */
export const usarSesion = create<Sesion>(() => ({ usuario: null, avisos: [], lista: false }));

const datos = () => usarAlmacen.getState().datos;
const cambiar = (r: Parameters<ReturnType<typeof usarAlmacen.getState>['cambiar']>[0]) => usarAlmacen.getState().cambiar(r);
export const cuenta = () => datos().cuenta;
export const esEquipo = () => cuenta()?.rol === 'equipo';
export function esJefeEnLinea(): boolean {
  const c = cuenta(), u = usarSesion.getState().usuario;
  return !!u && c?.rol === 'jefe' && !!c.rid && c.uid === u.uid;
}
export function sinLeer(): Aviso[] {
  const vistos = cuenta()?.leidos || [];
  return esEquipo() ? usarSesion.getState().avisos.filter((a) => !vistos.includes(a.id)) : [];
}

let dejarDeEscuchar: (() => void) | null = null;
let dejarDeEscucharAvisos: (() => void) | null = null;

export async function escucharAvisos() {
  const c = cuenta();
  if (dejarDeEscucharAvisos || !usarSesion.getState().usuario || !c?.rid) return;
  const nube = await cargarNube();
  if (dejarDeEscucharAvisos) return;
  dejarDeEscucharAvisos = nube.escucharAvisos(c.rid, (avisos) => usarSesion.setState({ avisos }), () => { dejarDeEscucharAvisos = null; });
}
export function pararAvisos() {
  if (dejarDeEscucharAvisos) { dejarDeEscucharAvisos(); dejarDeEscucharAvisos = null; }
  usarSesion.setState({ avisos: [] });
}
export function pararTodo() {
  if (dejarDeEscuchar) { dejarDeEscuchar(); dejarDeEscuchar = null; }
  pararAvisos();
}

// Equipo: el restaurante, su ficha y cada semana que publica el jefe llegan solos a este móvil.
export async function escucharMiRestaurante() {
  const c = cuenta();
  if (dejarDeEscuchar || !usarSesion.getState().usuario || !c?.rid) return;
  const nube = await cargarNube();
  if (dejarDeEscuchar) return;
  escucharAvisos();
  nube.leerRestaurante(c.rid).then((r) => { if (r) cambiar((x) => { x.restaurante = { ...(x.restaurante || {}), nombre: r.nombre, tipo: r.tipo }; }); }).catch(() => {});
  nube.leerMiFicha(c.rid).then((f) => { if (f && f.personaId !== c.personaId) cambiar((x) => { x.cuenta!.personaId = f.personaId; }); }).catch(() => {});
  dejarDeEscuchar = nube.escucharSemanas(c.rid, (semanas) => {
    if (!semanas.length) return;
    const ultima = semanas.reduce((a, b) => (b.publicado > a.publicado ? b : a));
    cambiar((x) => {
      semanas.forEach((s) => semanaDesdeNube(x, s));
      x.equipo = (ultima.equipo || []).map((p) => ({ id: p.id, nombre: p.nombre, contrato: p.contrato || null }));
      x.cuenta!.ultimaPublicacion = ultima.publicado;
    });
  }, () => { dejarDeEscuchar = null; usarUi.getState().avisar('No se pudo leer el horario. ¿Te han quitado del restaurante?'); });
}

export async function marcarLeidos(ids: string[]) {
  const c = cuenta();
  if (!ids.length || !usarSesion.getState().usuario || !c) return;
  const nube = await cargarNube();
  ids.forEach((id) => nube.marcarLeido(c.rid, id, c.personaId).then(() => {
    cambiar((x) => { x.cuenta!.leidos = [id].concat((x.cuenta!.leidos || []).filter((y) => y !== id)).slice(0, 100); });
  }).catch(() => {}));
}

// Empieza a seguir la sesión de Google. Se llama al abrir la app si este móvil ya está conectado a un restaurante,
// o la primera vez que alguien toca algo en línea. Llamarla más veces no hace nada.
let arrancada: Promise<void> | null = null;
export function arrancarSesion(): Promise<void> {
  if (!arrancada) {
    arrancada = cargarNube().then((nube) => new Promise<void>((listo) => {
      nube.alCambiarSesion((u) => {
        usarSesion.setState({ usuario: u, lista: true });
        if (u && esEquipo()) escucharMiRestaurante();
        if (u && esJefeEnLinea()) escucharAvisos();
        if (!u) pararTodo();
        listo();
      });
    }));
  }
  return arrancada;
}
