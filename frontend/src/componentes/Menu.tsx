import iconos from './menuIconos.json';
import { Icono, type NombreIcono } from './Icono';

import type { Vista } from '../estado/ui';

interface Props { vista: Vista; ir: (v: Vista) => void; abrirMas: () => void; sinLeer: number }

// En el móvil, lo de «Más» va en una ventana; en tablet y ordenador hay sitio y va en el menú lateral (clase solo-ancho).
const EXTRA_JEFE: [Vista, NombreIcono, string][] = [['horas', 'reloj', 'Horas del mes'], ['fichajes', 'fichaje', 'Fichajes'], ['avisos', 'avisos', 'Avisos'], ['equipo', 'equipo', 'Tu equipo'], ['ajustes', 'ajustes', 'Ajustes']];

// Mismos botones e iconos que la versión 2; el jefe y el equipo ven cada uno los suyos (clases solo-jefe / solo-equipo).
export function Menu({ vista, ir, abrirMas, sinLeer }: Props) {
  return (
    <nav aria-label="Menú principal">
      <span className="marca-lateral" aria-hidden="true">kumi</span>
      {iconos.map((b) => b.mas ? (
        <button key="mas" className={b.clase + (['horas', 'equipo', 'ajustes', 'avisos', 'fichajes'].includes(vista) ? ' activo' : '')} aria-label="Más opciones" onClick={abrirMas}>
          <span className="circulo" dangerouslySetInnerHTML={{ __html: b.svg }} />{b.texto}
        </button>
      ) : (
        <button key={b.ir} className={(b.clase + (vista === b.ir ? ' activo' : '')).trim()} aria-current={vista === b.ir ? 'page' : undefined} onClick={() => ir(b.ir as Vista)}>
          <span dangerouslySetInnerHTML={{ __html: b.svg }} />{b.texto}
          {b.burbuja && sinLeer > 0 && <span className="burbuja">{sinLeer > 9 ? '9+' : sinLeer}</span>}
        </button>
      ))}
      <span className="separador-lateral solo-jefe" aria-hidden="true">Más herramientas</span>
      {EXTRA_JEFE.map(([v, ic, texto]) => (
        <button key={v} className={'solo-jefe solo-ancho' + (vista === v ? ' activo' : '')} aria-current={vista === v ? 'page' : undefined} onClick={() => ir(v)}>
          <Icono n={ic} tam={24} />{texto}
        </button>
      ))}
    </nav>
  );
}
