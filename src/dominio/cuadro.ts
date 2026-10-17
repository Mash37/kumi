// El cuadro del horario como imagen, con el mismo formato que el Excel de la cocina.
import type { Datos } from '../datos/tipos';
import { DIAS, MESES_CORTOS, claveSemana, rango, sumarDias } from './fechas';
import { esLibre } from './horario';
import type { Colores } from './temas';

export function dibujarCuadro(c: HTMLCanvasElement, d: Datos, lunes: Date, colores: Colores): HTMLCanvasElement {
  const ctx = c.getContext('2d')!;
  const sem = d.semanas[claveSemana(lunes)] || {};
  const equipo = d.equipo;
  const ESC = 2, M = 24, TIT = 74, NOM = 190, COL = 82, CAB = 44, FIL = 38;
  const ancho = M * 2 + NOM + COL * 14;
  const alto = M * 2 + TIT + CAB + Math.max(equipo.length, 1) * FIL * 2;
  c.width = ancho * ESC; c.height = alto * ESC;
  ctx.setTransform(ESC, 0, 0, ESC, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, ancho, alto);

  const fuente = 'Jost, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colores.frambuesa; ctx.textAlign = 'left';
  ctx.font = 'italic 700 30px "Playfair Display", Georgia, serif';
  ctx.fillText('Horario · semana del ' + rango(lunes, true) + ' ' + sumarDias(lunes, 6).getFullYear(), M, M + TIT / 2 - 8);

  const x0 = M, y0 = M + TIT, xd = x0 + NOM, yp = y0 + CAB;
  const finX = xd + COL * 14, finY = yp + equipo.length * FIL * 2;
  ctx.fillStyle = colores.pdfCabecera;
  ctx.fillRect(xd, y0, COL * 14, CAB);
  ctx.fillRect(x0, yp, NOM, finY - yp);

  ctx.fillStyle = '#1f1418';
  for (let i = 0; i < 7; i++) {
    const x = xd + i * COL * 2;
    ctx.font = '600 19px ' + fuente;
    ctx.textAlign = 'left'; ctx.fillText(DIAS[i], x + 8, y0 + CAB / 2 + 1);
    ctx.textAlign = 'right'; ctx.fillText(String(sumarDias(lunes, i).getDate()), x + COL * 2 - 8, y0 + CAB / 2 + 1);
  }
  const libres: [number, number][] = [];
  equipo.forEach((p, i) => {
    const y = yp + i * FIL * 2;
    ctx.font = '600 18px ' + fuente; ctx.textAlign = 'center';
    ctx.fillText(p.nombre.toUpperCase(), x0 + NOM / 2, y + FIL + 1, NOM - 12);
    for (let j = 0; j < 7; j++) if (esLibre(d, sumarDias(lunes, j), p.id)) libres.push([xd + j * COL * 2, y]);
    const dias = sem[p.id];
    if (!dias) return;
    ctx.font = '500 20px ' + fuente; ctx.textAlign = 'right';
    for (let j = 0; j < 7; j++) {
      dias[j].forEach((h, k) => {
        if (!h) return;
        const col = k % 2, fila = Math.floor(k / 2);
        ctx.fillText(h, xd + (j * 2 + col + 1) * COL - 8, y + fila * FIL + FIL / 2 + 1);
      });
    }
  });
  const linea = (ax: number, ay: number, bx: number, by: number, grosor: number, color: string) => {
    ctx.strokeStyle = color; ctx.lineWidth = grosor;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  };
  for (let k = 1; k < 14; k += 2) linea(xd + k * COL, y0 + CAB, xd + k * COL, finY, 1, '#a8999f');
  equipo.forEach((_, i) => linea(xd, yp + i * FIL * 2 + FIL, finX, yp + i * FIL * 2 + FIL, 1, '#a8999f'));
  // Los días libres van encima de las rayas finas: un solo bloque con «Libre».
  libres.forEach(([x, y]) => {
    ctx.fillStyle = '#eef9f3'; ctx.fillRect(x + 1, y + 1, COL * 2 - 2, FIL * 2 - 2);
    ctx.fillStyle = '#1f7a4d'; ctx.font = 'italic 600 19px ' + fuente; ctx.textAlign = 'center';
    ctx.fillText('Libre', x + COL, y + FIL + 1);
  });
  for (let i = 0; i <= 7; i++) linea(xd + i * COL * 2, y0, xd + i * COL * 2, finY, 2.5, '#1f1418');
  for (let i = 0; i <= equipo.length; i++) linea(x0, yp + i * FIL * 2, finX, yp + i * FIL * 2, 2.5, '#1f1418');
  linea(xd, y0, finX, y0, 2.5, '#1f1418');
  linea(x0, yp, x0, finY, 2.5, '#1f1418');
  return c;
}
export function nombreArchivo(lunes: Date, ext: string): string {
  const domingo = sumarDias(lunes, 6);
  return 'horario-' + lunes.getDate() + '-' + MESES_CORTOS[lunes.getMonth()] + '-al-' + domingo.getDate() + '-' + MESES_CORTOS[domingo.getMonth()] + '.' + ext;
}
