import { useEffect } from 'react';
import { TEMAS, type Tema } from './dominio/temas';

export function tema(tipo?: string): Tema { return TEMAS[tipo ?? ''] ?? TEMAS.kumi; }

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + a + ')';
}

// Los colores de cada cocina van en variables CSS: todas las pantallas los leen de ahí.
export function usarTema(tipo: string | undefined, modo: 'auto' | 'claro' | 'oscuro' = 'auto') {
  useEffect(() => {
    const c = tema(tipo).colores;
    let el = document.getElementById('estiloTema');
    if (!el) { el = document.createElement('style'); el.id = 'estiloTema'; document.head.appendChild(el); }
    const v: Record<string, string> = {
      rosa: c.rosa, coral: c.coral, frambuesa: c.frambuesa, 'frambuesa-oscuro': c.frambuesaOscuro, 'rosa-medio': c.medio, 'rosa-suave': c.suave,
      borde: c.borde, fondo: c.fondo, 'fondo-deg': c.fondoDeg, deg: c.deg, 'deg-intenso': c.degIntenso, 'deg-oscuro': c.degOscuro, brillo1: c.brillo1, brillo2: c.brillo2,
      sombra: c.sombra, 'sombra-suave': hexA(c.frambuesa, 0.08), foco: hexA(c.rosa, 0.18), 'deg-noche': c.degNoche, 'deg-barra': c.degBarra,
      'pdf-titulo': c.frambuesa, 'pdf-cabecera': c.pdfCabecera, 'texto-sobre-deg': c.textoSobreDeg ?? '#fff',
    };
    el.textContent = ':root{' + Object.entries(v).map(([k, x]) => '--' + k + ':' + x).join(';') + '}' +
      ':root[data-modo="oscuro"]{--frambuesa:' + c.tituloOscuro + ';--sombra-suave:rgba(0,0,0,.35)' + (c.rosaOscuro ? ';--rosa:' + c.rosaOscuro : '') + '}';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.barra);
  }, [tipo]);

  useEffect(() => {
    const movil = window.matchMedia('(prefers-color-scheme: dark)');
    const poner = () => { document.documentElement.dataset.modo = modo === 'oscuro' || (modo === 'auto' && movil.matches) ? 'oscuro' : 'claro'; };
    poner();
    movil.addEventListener('change', poner);
    return () => movil.removeEventListener('change', poner);
  }, [modo]);
}
