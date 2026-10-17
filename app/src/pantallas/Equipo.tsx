import { useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { nuevoId } from '../datos/acciones';
import type { Persona } from '../datos/tipos';
import { leerNumero } from '../dominio/stock';
import { Avatar } from '../componentes/Avatar';
import { usarUi } from '../estado/ui';

export function Equipo() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const [nuevo, setNuevo] = useState<string | null>(null);
  return (
    <main>
      <section className="vista activa" id="vistaEquipo">
        <button className="volver" onClick={() => usarUi.getState().ir('inicio')}><span>‹</span> Inicio</button>
        <h2 className="titulo-equipo"><span className="jp-equipo">仲間</span> Tu equipo</h2>
        <p className="sub-equipo">{d.restaurante?.nombre ? 'El equipo de ' + d.restaurante.nombre : 'Tu equipo de cocina'}</p>
        <div id="equipo">
          {d.equipo.map((p, i) => <FilaEquipo key={p.id} p={p} i={i} total={d.equipo.length} enfocar={p.id === nuevo} />)}
        </div>
        <div className="acciones">
          <button className="btn secundario" onClick={() => { const id = nuevoId(); cambiar((x) => { x.equipo.push({ id, nombre: '' }); }); setNuevo(id); }}>+ Añadir persona</button>
        </div>
        <p className="nota">Las horas de contrato sirven para avisarte si alguien se pasa o no llega a su jornada. Los cambios se guardan solos.</p>
      </section>
    </main>
  );
}

// El texto se guarda mientras se escribe; la casilla conserva los espacios hasta que se sale de ella.
function FilaEquipo({ p, i, total, enfocar }: { p: Persona; i: number; total: number; enfocar: boolean }) {
  const cambiar = usarAlmacen((s) => s.cambiar);
  const [nombre, setNombre] = useState(p.nombre);
  const [contrato, setContrato] = useState(p.contrato ? String(p.contrato).replace('.', ',') : '');
  const [malo, setMalo] = useState(false);
  const mover = (a: number, b: number) => cambiar((x) => { [x.equipo[a], x.equipo[b]] = [x.equipo[b], x.equipo[a]]; });
  return (
    <div className="fila-equipo">
      <Avatar p={p} />
      <input value={nombre} aria-label="Nombre" autoFocus={enfocar}
        onChange={(e) => { setNombre(e.target.value); const v = e.target.value.trim(); cambiar((x) => { x.equipo[i].nombre = v; }); }}
        onBlur={() => setNombre(p.nombre)} />
      <button aria-label="Quitar" onClick={() => {
        if (!confirm('¿Quitar a ' + (p.nombre || 'esta persona') + ' del equipo?')) return;
        // Se guarda su nombre: sus horas de este mes siguen saliendo en el informe para la nómina.
        cambiar((x) => { x.bajas = x.bajas || {}; x.bajas[p.id] = p.nombre; x.equipo.splice(i, 1); });
      }}>🗑</button>
      <label className="contrato">Contrato{' '}
        <input className="numero" inputMode="decimal" value={contrato} placeholder="—" aria-label="Horas de contrato a la semana" style={malo ? { borderColor: '#d92d20' } : undefined}
          onChange={(e) => {
            setContrato(e.target.value);
            const v = leerNumero(e.target.value);
            if (v !== null && (Number.isNaN(v) || v > 80)) { setMalo(true); return; }
            setMalo(false);
            cambiar((x) => { x.equipo[i].contrato = v || null; });
          }} /> h/semana
      </label>
      <span className="orden">
        <button disabled={i === 0} aria-label="Subir" onClick={() => mover(i - 1, i)}>↑</button>
        <button disabled={i === total - 1} aria-label="Bajar" onClick={() => mover(i + 1, i)}>↓</button>
      </span>
    </div>
  );
}
