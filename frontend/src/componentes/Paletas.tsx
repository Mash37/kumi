import { ORDEN_PALETAS, PALETAS, type ClavePaleta } from '../dominio/paletas';

export function Paletas({ sel, elegir }: { sel: ClavePaleta; elegir: (p: ClavePaleta) => void }) {
  return (
    <div className="paletas" role="radiogroup" aria-label="Tema de color">
      {ORDEN_PALETAS.map((k) => {
        const p = PALETAS[k];
        return (
          <button key={k} role="radio" aria-checked={k === sel} className={k === sel ? 'sel' : ''} onClick={() => elegir(k)}>
            <span className="muestra" style={{ background: p.profundo }}><i style={{ background: p.boton }} /><i style={{ background: p.acento }} /></span>
            {p.nombre}
          </button>
        );
      })}
    </div>
  );
}
