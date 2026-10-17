import { readFileSync } from 'node:fs';

// Carga funciones de la versión 2 (legado/index.html) para comprobar que la 3 da exactamente lo mismo.
const fuente = readFileSync(new URL('../legado/index.html', import.meta.url), 'utf8');

function bloque(desde: number): string {
  let nivel = 0;
  for (let i = fuente.indexOf('{', desde); i < fuente.length; i++) {
    if (fuente[i] === '{') nivel++;
    if (fuente[i] === '}' && --nivel === 0) return fuente.slice(desde, i + 1);
  }
  throw new Error('Bloque sin cerrar');
}
function funcion(nombre: string): string {
  const i = fuente.indexOf('\nfunction ' + nombre + '(');
  if (i < 0) throw new Error('No existe la función ' + nombre + ' en legado');
  return bloque(i + 1);
}
// Desde «const X =» hasta el primer «;» fuera de corchetes y llaves (vale para las de varias líneas).
function constante(nombre: string): string {
  const i = fuente.indexOf('\nconst ' + nombre + ' = ');
  if (i < 0) throw new Error('No existe la constante ' + nombre + ' en legado');
  let nivel = 0;
  for (let j = i + 1; j < fuente.length; j++) {
    const c = fuente[j];
    if ('[{('.includes(c)) nivel++;
    if (']})'.includes(c)) nivel--;
    if (c === ';' && nivel === 0) return fuente.slice(i + 1, j + 1);
  }
  throw new Error('Constante sin cerrar: ' + nombre);
}

// Las funciones de la v2 leen la variable global «datos»: ponerDatos() la rellena antes de llamarlas.
export function cargarLegado<T>(funciones: string[], constantes: string[] = []): T & { ponerDatos: (d: unknown) => void } {
  const codigo = 'let datos;\n' + constantes.map(constante).join('\n') + '\n' + funciones.map(funcion).join('\n') +
    '\nreturn {' + funciones.join(',') + ', ponerDatos: (d) => { datos = d; } };';
  return new Function(codigo)();
}
