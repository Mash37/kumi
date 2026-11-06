import { useEffect } from 'react';
import { TEMAS, type Tema } from './dominio/temas';
import { PALETAS, type ClavePaleta } from './dominio/paletas';

/** Un color mezclado con blanco, en hexadecimal: el lienzo del PDF no entiende color-mix(). */
function mezclarConBlanco(hex: string, peso: number): string {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(c * peso + 255 * (1 - peso)).toString(16).padStart(2, '0')).join('');
}

/** Contenido del tipo de cocina (productos de ejemplo, dato del día). Los colores salen de la paleta. */
export function tema(tipo?: string): Tema { return TEMAS[tipo ?? ''] ?? TEMAS.kumi; }

// Las pantallas aún usan los nombres de variables de la versión 2 (--rosa, --frambuesa, --deg…):
// aquí se llenan con los colores planos del tema elegido hasta que cada pantalla pase a los nombres nuevos.
export function usarTema(clave: ClavePaleta, modo: 'auto' | 'claro' | 'oscuro' = 'auto') {
  useEffect(() => {
    const p = PALETAS[clave];
    let el = document.getElementById('estiloTema');
    if (!el) { el = document.createElement('style'); el.id = 'estiloTema'; document.head.appendChild(el); }
    const comunes: Record<string, string> = {
      profundo: p.profundo, boton: p.boton, acento: p.acento,
      deg: p.boton, 'deg-intenso': p.profundo, 'deg-oscuro': p.profundo, 'deg-noche': p.profundo, 'deg-barra': p.boton,
      'frambuesa-oscuro': p.profundo, coral: p.acento, brillo1: 'transparent', brillo2: 'transparent', sombra: 'transparent',
      'texto-sobre-deg': '#fff', 'pdf-titulo': p.profundo, 'pdf-cabecera': mezclarConBlanco(p.acento, 0.22),
    };
    const claro: Record<string, string> = {
      rosa: p.boton, frambuesa: p.profundo, 'rosa-suave': 'color-mix(in srgb, ' + p.boton + ' 9%, #fff)',
      'rosa-medio': 'color-mix(in srgb, ' + p.boton + ' 30%, #fff)', foco: 'color-mix(in srgb, ' + p.boton + ' 20%, transparent)',
      'sombra-suave': 'rgba(29, 41, 45, .06)',
    };
    const oscuro: Record<string, string> = {
      rosa: p.acento, frambuesa: '#F3F6F5', deg: p.acento, 'texto-sobre-deg': p.profundo, 'rosa-suave': 'color-mix(in srgb, ' + p.acento + ' 14%, #202D32)',
      'rosa-medio': 'color-mix(in srgb, ' + p.acento + ' 35%, #202D32)', foco: 'color-mix(in srgb, ' + p.acento + ' 25%, transparent)',
      'sombra-suave': 'rgba(0, 0, 0, .3)',
    };
    const css = (v: Record<string, string>) => Object.entries(v).map(([k, x]) => '--' + k + ':' + x).join(';');
    el.textContent = ':root{' + css(comunes) + ';' + css(claro) + '}:root[data-modo="oscuro"]{' + css(oscuro) + '}';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.profundo);
  }, [clave]);

  useEffect(() => {
    const movil = window.matchMedia('(prefers-color-scheme: dark)');
    const poner = () => { document.documentElement.dataset.modo = modo === 'oscuro' || (modo === 'auto' && movil.matches) ? 'oscuro' : 'claro'; };
    poner();
    movil.addEventListener('change', poner);
    return () => movil.removeEventListener('change', poner);
  }, [modo]);
}
