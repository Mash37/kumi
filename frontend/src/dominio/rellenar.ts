import type { Franja, Turnos } from '../datos/tipos';
import { normalizarHora } from './horas';

/** «12:00» → «12», «12:30» → «12:30»: así caben los turnos en una celda del cuadro. */
export function horaCorta(h: string): string { return h.endsWith(':00') ? h.slice(0, -3) : h; }
export function turnoCorto(a: string, b: string): string { return a || b ? horaCorta(a || '?') + '–' + horaCorta(b || '?') : ''; }

const igual = (a: string, b: string) => normalizarHora(a) === normalizarHora(b);

/** Hueco (0 o 1) donde está puesto ese servicio, o -1 si no está. */
export function huecoDeServicio(t: Turnos, f: Franja): number {
  for (let i = 0; i < 2; i++) if (t[i * 2] && igual(t[i * 2], f.desde) && igual(t[i * 2 + 1], f.hasta)) return i;
  return -1;
}

/** Tocar un servicio: si ya está, se quita; si no, va al primer turno libre. «lleno» si los dos turnos están ocupados. */
export function alternarServicio(t: Turnos, f: Franja): Turnos | 'lleno' {
  const nuevo = [...t] as Turnos;
  const i = huecoDeServicio(t, f);
  if (i >= 0) { nuevo[i * 2] = ''; nuevo[i * 2 + 1] = ''; return ordenar(nuevo); }
  const libre = !t[0] && !t[1] ? 0 : !t[2] && !t[3] ? 1 : -1;
  if (libre < 0) return 'lleno';
  nuevo[libre * 2] = normalizarHora(f.desde) || f.desde;
  nuevo[libre * 2 + 1] = normalizarHora(f.hasta) || f.hasta;
  return ordenar(nuevo);
}

// El turno que empieza antes va primero, para que «Turno 1» sea siempre el de antes.
function ordenar(t: Turnos): Turnos {
  if (!t[0] && !t[1] && (t[2] || t[3])) return [t[2], t[3], '', ''];
  if (t[0] && t[2] && minutos(t[2]) < minutos(t[0])) return [t[2], t[3], t[0], t[1]];
  return t;
}
const minutos = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
