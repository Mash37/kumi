import type { Restaurante } from '../datos/tipos';

// Los tres temas de color de la app. No dependen del tipo de cocina: el negocio elige el que quiera.
export type ClavePaleta = 'kitchen' | 'vegano' | 'mar';
export interface Paleta { nombre: string; profundo: string; boton: string; acento: string }

export const PALETAS: Record<ClavePaleta, Paleta> = {
  kitchen: { nombre: 'Kitchen', profundo: '#22303A', boton: '#2C3E48', acento: '#F2A900' },
  vegano: { nombre: 'Vegano', profundo: '#17432C', boton: '#1F7A45', acento: '#8BD450' },
  mar: { nombre: 'Marisquería', profundo: '#0F2A4A', boton: '#1D5FA8', acento: '#3EC6E0' },
};
/** Iniciales de cada persona: tonos apagados, todos con texto blanco legible (más de 4,5:1). */
export const AVATARES = ['#2C3E48', '#1F7A45', '#1D5FA8', '#8A5D00', '#9C3D54', '#2F6B73', '#6B4FA0', '#7A4E2D'];
export const ORDEN_PALETAS: ClavePaleta[] = ['kitchen', 'vegano', 'mar'];

/** Tema elegido; si nunca se eligió, el que más se parece a su tipo de cocina. */
export function paletaDe(r?: Pick<Restaurante, 'tema' | 'tipo'> | null): ClavePaleta {
  if (r?.tema && r.tema in PALETAS) return r.tema;
  return r?.tipo === 'vegano' ? 'vegano' : r?.tipo === 'marisqueria' ? 'mar' : 'kitchen';
}
