import { usarAlmacen } from '../datos/almacen';
import type { Persona } from '../datos/tipos';
import { iniciales } from '../dominio/personas';
import { AVATARES } from '../dominio/paletas';

export function Avatar({ p }: { p: Persona }) {
  const d = usarAlmacen((s) => s.datos);
  const i = Math.max(0, d.equipo.findIndex((x) => x.id === p.id));
  return <span className="avatar" style={{ background: AVATARES[i % AVATARES.length] }}>{iniciales(d, p.nombre)}</span>;
}
