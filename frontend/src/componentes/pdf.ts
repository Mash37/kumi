// PDF mínimo hecho a mano: una imagen JPEG por página, a tamaño A4. Sin librerías: basta para documentos
// que se dibujan en un lienzo (pedido al proveedor) y se comparten como archivo.
const A4: [number, number] = [595.28, 841.89];
const bytes = (s: string) => new TextEncoder().encode(s);

export interface PaginaJpeg { jpeg: Uint8Array; ancho: number; alto: number }

export function pdfDeImagenes(paginas: PaginaJpeg[]): Uint8Array {
  const partes: Uint8Array[] = [];
  const posiciones: number[] = [];
  let largo = 0;
  const poner = (b: Uint8Array) => { partes.push(b); largo += b.length; };
  const objeto = (n: number, ...cuerpo: Uint8Array[]) => {
    posiciones[n] = largo;
    poner(bytes(n + ' 0 obj\n'));
    cuerpo.forEach(poner);
    poner(bytes('\nendobj\n'));
  };
  // La segunda línea con caracteres no ASCII avisa a los programas de que el archivo es binario.
  poner(bytes('%PDF-1.4\n%âãÏÓ\n'));
  objeto(1, bytes('<< /Type /Catalog /Pages 2 0 R >>'));
  objeto(2, bytes('<< /Type /Pages /Kids [' + paginas.map((_, i) => (3 + i * 3) + ' 0 R').join(' ') + '] /Count ' + paginas.length + ' >>'));
  paginas.forEach((pg, i) => {
    const n = 3 + i * 3;
    objeto(n, bytes('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + A4[0] + ' ' + A4[1] + '] /Resources << /XObject << /Im' + i + ' ' + (n + 1) + ' 0 R >> >> /Contents ' + (n + 2) + ' 0 R >>'));
    objeto(n + 1, bytes('<< /Type /XObject /Subtype /Image /Width ' + pg.ancho + ' /Height ' + pg.alto + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + pg.jpeg.length + ' >>\nstream\n'), pg.jpeg, bytes('\nendstream'));
    const dibujo = 'q ' + A4[0] + ' 0 0 ' + A4[1] + ' 0 0 cm /Im' + i + ' Do Q';
    objeto(n + 2, bytes('<< /Length ' + dibujo.length + ' >>\nstream\n' + dibujo + '\nendstream'));
  });
  const total = 3 + paginas.length * 3;
  const xref = largo;
  poner(bytes('xref\n0 ' + total + '\n0000000000 65535 f \n' +
    posiciones.slice(1).map((p) => String(p).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n'));
  const salida = new Uint8Array(largo);
  let i = 0;
  partes.forEach((b) => { salida.set(b, i); i += b.length; });
  return salida;
}
