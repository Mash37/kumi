import { usarAlmacen } from '../datos/almacen';
import type { Persona } from '../datos/tipos';
import { iniciales } from '../dominio/personas';
import { tema } from '../tema';

export function Avatar({ p }: { p: Persona }) {
  const d = usarAlmacen((s) => s.datos);
  const colores = tema(d.restaurante?.tipo).avatares;
  const i = Math.max(0, d.equipo.findIndex((x) => x.id === p.id));
  return <span className="avatar" style={{ background: colores[i % colores.length] }}>{iniciales(d, p.nombre)}</span>;
}
