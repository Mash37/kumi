import type { Datos } from '../datos/tipos';

// Dos letras; si dos personas empiezan igual (ANA, ANDRÉS), se usa la primera y la última.
export function iniciales(d: Datos, nombre: string): string {
  const n = nombre.trim().toUpperCase() || '?';
  const base = (p: string) => p.trim().toUpperCase().slice(0, 2);
  const repetida = d.equipo.filter((p) => base(p.nombre) === base(n)).length > 1;
  return repetida ? n[0] + n[n.length - 1] : base(n);
}
