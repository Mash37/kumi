// Pedido al proveedor en PDF: se dibuja en hojas A4 y se abre «Compartir» del móvil (WhatsApp, correo…).
import type { Datos } from '../datos/tipos';
import { MESES } from '../dominio/fechas';
import { cantidadTxt, euros, pedidoSugerido, type FilaPedido } from '../dominio/stock';
import { compartirArchivo, descargar, fuentesListas } from './archivos';
import { pdfDeImagenes, type PaginaJpeg } from './pdf';

const ANCHO = 1240, ALTO = 1754, IZQ = 90, DER = 1150, FILA = 50, POR_PAGINA = 20;
const TINTA = '#1b252c', GRIS = '#5f6b70', LINEA = '#e4e2da';
// Borde derecho de cada columna numérica.
const COL = { quedan: 640, minimo: 800, pedir: 960, importe: DER };

interface Colores { titulo: string; cabecera: string }

function recortar(g: CanvasRenderingContext2D, s: string, max: number): string {
  if (g.measureText(s).width <= max) return s;
  while (s.length > 1 && g.measureText(s + '…').width > max) s = s.slice(0, -1);
  return s + '…';
}

function hoja(nombre: string, fecha: string, filas: FilaPedido[], cuantos: number, num: number, de: number, total: number | null, col: Colores): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = ANCHO; c.height = ALTO;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, ANCHO, ALTO);
  g.textBaseline = 'alphabetic';

  g.fillStyle = col.titulo; g.font = '600 22px Jost, Arial, sans-serif';
  g.fillText('KUMI · ' + nombre.toUpperCase(), IZQ, 120);
  g.font = 'italic 700 58px "Playfair Display", Georgia, serif';
  g.fillText('Pedido · ' + fecha, IZQ, 200);
  g.fillStyle = GRIS; g.font = '400 26px Jost, Arial, sans-serif';
  g.fillText(cuantos + (cuantos === 1 ? ' producto' : ' productos') + ' por debajo del mínimo' + (de > 1 ? ' · Hoja ' + num + ' de ' + de : ''), IZQ, 250);

  g.fillStyle = col.cabecera; g.fillRect(IZQ, 300, DER - IZQ, 56);
  g.fillStyle = TINTA; g.font = '600 24px Jost, Arial, sans-serif';
  g.textAlign = 'left'; g.fillText('Producto', IZQ + 16, 337);
  g.textAlign = 'right';
  g.fillText('Quedan', COL.quedan, 337); g.fillText('Mínimo', COL.minimo, 337); g.fillText('Pedir', COL.pedir, 337); g.fillText('Importe aprox.', COL.importe - 12, 337);

  let y = 356;
  filas.forEach((f) => {
    g.textAlign = 'left'; g.fillStyle = TINTA; g.font = '400 26px Jost, Arial, sans-serif';
    g.fillText(recortar(g, f.p.nombre, COL.quedan - 150 - IZQ), IZQ + 16, y + 34);
    g.textAlign = 'right';
    g.fillText(cantidadTxt(f.quedan, f.p), COL.quedan, y + 34);
    g.fillText(cantidadTxt(f.p.minimo ?? 0, f.p), COL.minimo, y + 34);
    g.font = '600 26px Jost, Arial, sans-serif';
    g.fillText(cantidadTxt(f.pedir, f.p), COL.pedir, y + 34);
    g.font = '400 26px Jost, Arial, sans-serif';
    g.fillText(f.importe != null ? euros.format(f.importe) : '—', COL.importe - 12, y + 34);
    y += FILA;
    g.strokeStyle = LINEA; g.lineWidth = 1.5; g.beginPath(); g.moveTo(IZQ, y); g.lineTo(DER, y); g.stroke();
  });

  if (num === de) {
    y += 20;
    if (total != null) {
      g.strokeStyle = TINTA; g.lineWidth = 3; g.beginPath(); g.moveTo(IZQ, y); g.lineTo(DER, y); g.stroke();
      g.fillStyle = TINTA; g.font = '600 28px Jost, Arial, sans-serif';
      g.textAlign = 'left'; g.fillText('Total aproximado', IZQ + 16, y + 44);
      g.textAlign = 'right'; g.fillText(euros.format(total), COL.importe - 12, y + 44);
      y += 60;
    }
    g.textAlign = 'left'; g.fillStyle = GRIS; g.font = '400 21px Jost, Arial, sans-serif';
    g.fillText('«Pedir» es lo que falta para llegar al doble del mínimo.', IZQ, y + 50);
    g.fillText('El importe usa el precio guardado de cada producto y es orientativo.', IZQ, y + 80);
    const firmas = Math.min(y + 220, ALTO - 90);
    g.strokeStyle = TINTA; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(IZQ, firmas); g.lineTo(560, firmas); g.moveTo(680, firmas); g.lineTo(DER, firmas); g.stroke();
    g.fillStyle = TINTA; g.font = '400 24px Jost, Arial, sans-serif';
    g.fillText('Pedido por', IZQ, firmas + 34); g.fillText('Recibido', 680, firmas + 34);
  }
  return c;
}

async function aJpeg(c: HTMLCanvasElement): Promise<PaginaJpeg> {
  const blob = await new Promise<Blob>((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('Sin imagen'))), 'image/jpeg', 0.92));
  return { jpeg: new Uint8Array(await blob.arrayBuffer()), ancho: c.width, alto: c.height };
}

/** Crea el PDF del pedido de hoy. null si no hay nada que pedir. */
export async function pdfPedido(d: Datos, cocina: string, hoy = new Date()): Promise<File | null> {
  const { filas, total } = pedidoSugerido(d);
  if (!filas.length) return null;
  await fuentesListas();
  const raiz = getComputedStyle(document.documentElement);
  const col: Colores = { titulo: raiz.getPropertyValue('--pdf-titulo').trim() || TINTA, cabecera: raiz.getPropertyValue('--pdf-cabecera').trim() || '#fbe7b0' };
  const fecha = hoy.getDate() + ' de ' + MESES[hoy.getMonth()] + ' de ' + hoy.getFullYear();
  const nombre = d.restaurante?.nombre || cocina;
  const trozos: FilaPedido[][] = [];
  for (let i = 0; i < filas.length; i += POR_PAGINA) trozos.push(filas.slice(i, i + POR_PAGINA));
  const paginas = await Promise.all(trozos.map((t, i) => aJpeg(hoja(nombre, fecha, t, filas.length, i + 1, trozos.length, total, col))));
  const pdf = pdfDeImagenes(paginas);
  const dia = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  return new File([pdf.buffer as ArrayBuffer], 'pedido-' + dia + '.pdf', { type: 'application/pdf' });
}

// Abre «Compartir» con el PDF; si el móvil o el navegador no saben compartir archivos, lo descarga.
export async function enviarPedidoPdf(d: Datos, cocina: string): Promise<void> {
  const archivo = await pdfPedido(d, cocina);
  if (!archivo) return;
  if (!(await compartirArchivo(archivo, 'Pedido ' + (d.restaurante?.nombre || cocina)))) descargar(archivo);
}
