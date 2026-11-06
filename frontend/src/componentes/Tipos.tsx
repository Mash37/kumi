import { ORDEN_TEMAS, TEMAS } from '../dominio/temas';

// Tipo de cocina: solo decide los productos de ejemplo y el dato del día; los colores van aparte (Paletas).
export function Tipos({ sel, elegir }: { sel: string; elegir: (t: string) => void }) {
  return (
    <div className="chips-inc tipos-cocina">
      {ORDEN_TEMAS.map((k) => (
        <button key={k} className={k === sel ? 'sel' : ''} aria-pressed={k === sel} onClick={() => elegir(k)}>{TEMAS[k].nombre}</button>
      ))}
    </div>
  );
}
