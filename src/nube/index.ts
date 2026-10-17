// Firebase pesa más que el resto de la app junta: solo se descarga la primera vez que hace falta
// (entrar con Google, unirse, avisos, o un móvil que ya está conectado a un restaurante).
import type { nube as NubeReal } from './firebase';

type Nube = typeof NubeReal;
let promesa: Promise<Nube> | null = null;
export function cargarNube(): Promise<Nube> {
  if (!promesa) promesa = import('./firebase').then((m) => m.nube);
  return promesa;
}

type Diferida = { [K in keyof Nube]-?: NonNullable<Nube[K]> extends (...a: infer A) => infer R ? (...a: A) => Promise<Awaited<R>> : never };
/** Mismas operaciones que nube, pero cada una espera a que Firebase esté cargado. */
export const nube = new Proxy({} as Diferida, {
  get: (_, clave: string) => (...args: unknown[]) => cargarNube().then((n) => (n[clave as keyof Nube] as (...a: unknown[]) => unknown)(...args)),
});
