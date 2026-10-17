import iconos from './menuIconos.json';

import type { Vista } from '../estado/ui';

interface Props { vista: Vista; ir: (v: Vista) => void; abrirMas: () => void; sinLeer: number }

// Mismos botones e iconos que la versión 2; el jefe y el equipo ven cada uno los suyos (clases solo-jefe / solo-equipo).
export function Menu({ vista, ir, abrirMas, sinLeer }: Props) {
  return (
    <nav>
      {iconos.map((b) => b.mas ? (
        <button key="mas" className={b.clase + (['horas', 'equipo', 'ajustes', 'avisos'].includes(vista) ? ' activo' : '')} aria-label="Más opciones" onClick={abrirMas}>
          <span className="circulo" dangerouslySetInnerHTML={{ __html: b.svg }} />{b.texto}
        </button>
      ) : (
        <button key={b.ir} className={(b.clase + (vista === b.ir ? ' activo' : '')).trim()} onClick={() => ir(b.ir as Vista)}>
          <span dangerouslySetInnerHTML={{ __html: b.svg }} />{b.texto}
          {b.burbuja && sinLeer > 0 && <span className="burbuja">{sinLeer > 9 ? '9+' : sinLeer}</span>}
        </button>
      ))}
    </nav>
  );
}
