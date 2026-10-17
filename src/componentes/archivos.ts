// Guardar, compartir e imprimir. En la web usa lo del navegador; en la app de la tienda, las piezas nativas
// (la hoja «Compartir» del sistema, que incluye «Guardar en Archivos», y el diálogo nativo de imprimir / PDF).
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Printer } from '@capgo/capacitor-printer';
import cssInforme from '../estilos/informe.css?raw';
import { esNativa } from '../nativo';

async function aBase64(archivo: File): Promise<string> {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function compartirNativo(archivo: File, titulo: string) {
  const { uri } = await Filesystem.writeFile({ path: archivo.name, data: await aBase64(archivo), directory: Directory.Cache });
  await Share.share({ title: titulo, files: [uri] });
}

// La imagen usa las tipografías de la app: hay que esperar a que estén cargadas antes de dibujar.
export function fuentesListas(): Promise<unknown> {
  if (!document.fonts) return Promise.resolve();
  return Promise.all([
    document.fonts.load('italic 700 30px "Playfair Display"'),
    document.fonts.load('600 19px Jost'),
    document.fonts.load('500 20px Jost'),
  ]).catch(() => {});
}
export function descargar(archivo: File) {
  if (esNativa) { compartirNativo(archivo, archivo.name).catch(() => {}); return; }
  const url = URL.createObjectURL(archivo);
  const a = document.createElement('a');
  a.href = url; a.download = archivo.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
/** true si se compartió o se canceló; false si este móvil no sabe compartir archivos. */
export async function compartirArchivo(archivo: File, titulo: string): Promise<boolean> {
  if (esNativa) {
    try { await compartirNativo(archivo, titulo); } catch (e) { if (!/cancel/i.test(String((e as Error).message))) throw e; }
    return true;
  }
  if (!(navigator.canShare && navigator.canShare({ files: [archivo] }))) return false;
  try { await navigator.share({ files: [archivo], title: titulo }); }
  catch (e) { if ((e as Error).name !== 'AbortError') throw e; }
  return true;
}
export function lienzoAArchivo(c: HTMLCanvasElement, nombre: string): Promise<File> {
  return new Promise((ok) => c.toBlob((blob) => ok(new File([blob!], nombre, { type: 'image/png' })), 'image/png'));
}
// El título de la página es el nombre que el móvil propone para el PDF.
// «informe»: hoja A4 vertical (informes); sin él, apaisada (el cuadro).
export function imprimir(titulo: string, html: string, informe: boolean) {
  if (esNativa) {
    // Documento aparte con los colores del restaurante: la app nativa no imprime la página que se ve.
    const raiz = getComputedStyle(document.documentElement);
    const colores = ':root{--pdf-titulo:' + raiz.getPropertyValue('--pdf-titulo') + ';--pdf-cabecera:' + raiz.getPropertyValue('--pdf-cabecera') + '}';
    const pagina = informe ? '@page{size:A4 portrait;margin:14mm 12mm}' : '@page{size:landscape;margin:8mm}img{width:100%}';
    Printer.printHtml({ name: titulo, html: '<!doctype html><html><head><meta charset="utf-8"><style>' + colores + pagina + cssInforme + '</style></head><body>' + html + '</body></html>' }).catch(() => {});
    return;
  }
  const zona = document.getElementById('zonaImprimir')!;
  zona.className = informe ? 'informe' : '';
  zona.innerHTML = html;
  const anterior = document.title;
  const lanzar = () => {
    document.title = titulo;
    window.addEventListener('afterprint', () => { document.title = anterior; }, { once: true });
    window.print();
  };
  const img = zona.querySelector('img');
  if (img && !img.complete) img.onload = lanzar; else lanzar();
}
