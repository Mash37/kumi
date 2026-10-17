import { ORDEN_TEMAS, TEMAS } from '../dominio/temas';

export function Tipos({ sel, elegir }: { sel: string; elegir: (t: string) => void }) {
  return (
    <div className="tipos">
      {ORDEN_TEMAS.map((k) => (
        <button key={k} className={k === sel ? 'sel' : ''} style={{ background: TEMAS[k].colores.degIntenso }} onClick={() => elegir(k)}>
          <i>{TEMAS[k].emoji}</i>{TEMAS[k].nombre}
        </button>
      ))}
    </div>
  );
}
