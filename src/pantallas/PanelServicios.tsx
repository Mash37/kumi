import { useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { nuevoId } from '../datos/acciones';
import type { Franja } from '../datos/tipos';
import { DIAS_CORTOS } from '../dominio/fechas';
import { aCasilla, normalizarHora, tramo } from '../dominio/horas';
import { franjas } from '../dominio/horario';
import { usarUi } from '../estado/ui';

export function PanelServicios() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { avisar, cerrarPanel } = usarUi.getState();
  const [lista, setLista] = useState<Franja[]>(() => structuredClone(franjas(d)));
  const editar = (i: number, c: Partial<Franja>) => setLista((l) => l.map((f, j) => (j === i ? { ...f, ...c } : f)));
  const guardar = () => {
    const mal = lista.find((f) => !tramo(f.desde, f.hasta));
    if (mal) { avisar('Revisa las horas de «' + (mal.nombre || 'Servicio') + '»'); return; }
    cambiar((x) => { x.franjas = lista.map((f) => ({ ...f, nombre: f.nombre.trim() || 'Servicio' })); });
    cerrarPanel();
    avisar('Servicios guardados');
  };
  return (
    <>
      <h3>Servicios y mínimos</h3>
      <p className="sub">Cuánta gente tiene que haber, como mínimo, en cada servicio. Con 0 no se revisa.</p>
      {lista.map((f, i) => (
        <div className="servicio" key={f.id}>
          <div className="campos-2">
            <label className="campo"><span>Servicio</span><input value={f.nombre} onChange={(e) => editar(i, { nombre: e.target.value })} /></label>
            <div className="campo"><span>Mínimo de personas</span>
              <div className="contador">
                <button aria-label="Menos" onClick={() => editar(i, { minimo: Math.max(0, f.minimo - 1) })}>−</button><b>{f.minimo}</b>
                <button aria-label="Más" onClick={() => editar(i, { minimo: Math.min(30, f.minimo + 1) })}>+</button>
              </div>
            </div>
          </div>
          <div className="campos-2">
            <label className="campo"><span>Desde</span><input type="time" step={60} value={aCasilla(f.desde)} onChange={(e) => editar(i, { desde: normalizarHora(e.target.value || '') || '' })} /></label>
            <label className="campo"><span>Hasta</span><input type="time" step={60} value={aCasilla(f.hasta)} onChange={(e) => editar(i, { hasta: normalizarHora(e.target.value || '') || '' })} /></label>
          </div>
          <div className="grupo-stock">Días con este servicio</div>
          <div className="chips-inc">
            {DIAS_CORTOS.map((l, dia) => (
              <button key={dia} className={f.dias.includes(dia) ? 'sel' : ''}
                onClick={() => editar(i, { dias: f.dias.includes(dia) ? f.dias.filter((x) => x !== dia) : f.dias.concat(dia).sort() })}>{l}</button>
            ))}
          </div>
          <button className="btn texto" onClick={() => setLista((l) => l.filter((_, j) => j !== i))}>Quitar este servicio</button>
        </div>
      ))}
      <div className="acciones">
        <button className="btn secundario" onClick={() => setLista((l) => [...l, { id: nuevoId(), nombre: 'Servicio', icono: '🍽️', desde: '13:00', hasta: '16:00', minimo: 2, dias: [0, 1, 2, 3, 4, 5, 6] }])}>+ Añadir servicio</button>
        <button className="btn principal" onClick={guardar}>Guardar</button>
        <button className="btn secundario" onClick={() => cerrarPanel()}>Cancelar</button>
      </div>
    </>
  );
}
