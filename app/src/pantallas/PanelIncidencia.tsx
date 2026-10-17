import { useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { ponerIncidencia } from '../datos/acciones';
import type { Incidencia, Turnos } from '../datos/tipos';
import { DIAS, fechaDeClave, sumarDias } from '../dominio/fechas';
import { aCasilla, normalizarHora } from '../dominio/horas';
import { MOTIVOS, incidenciaDe, incidenciasDelDia, nombreDe, textoTurnos4, tramosDe, turnosPlan } from '../dominio/horario';
import { cambiarConDeshacer, usarUi } from '../estado/ui';

// «¿Qué pasó este día?»: lo que pasó de verdad, sin tocar el horario planificado.
export function PanelIncidencia({ id }: { id: string }) {
  const d = usarAlmacen((s) => s.datos);
  const { lunes: clave, diaActivo, cerrarPanel, avisar } = usarUi();
  const fecha = sumarDias(fechaDeClave(clave), diaActivo);
  const [u, setU] = useState(() => {
    const inc = incidenciaDe(d, fecha, id);
    const plan = turnosPlan(d, fecha, id);
    const tienePlan = tramosDe(plan).length > 0;
    const faltan = d.equipo.filter((p) => p.id !== id && incidenciaDe(d, fecha, p.id)?.tipo === 'falta');
    const tipo: Incidencia['tipo'] = inc ? inc.tipo : tienePlan ? 'falta' : 'cubre';
    const a = inc && inc.tipo === 'cubre' ? inc.a : faltan[0]?.id ?? '';
    let turnos: Turnos = inc && inc.tipo !== 'falta' ? [...inc.turnos] : [...plan];
    if (tipo === 'cubre' && !inc && a) turnos = [...turnosPlan(d, fecha, a)];
    const quien = Object.entries(incidenciasDelDia(d, fecha)).find(([, x]) => x.tipo === 'cubre' && x.a === id);
    return { tienePlan, tipo, motivo: inc && inc.tipo === 'falta' ? inc.motivo : MOTIVOS[0], cubre: tipo === 'falta' && quien ? quien[0] : '', a, turnos, habia: !!inc };
  });
  const cambiarU = (c: Partial<typeof u>) => setU((x) => ({ ...x, ...c }));
  const plan = turnosPlan(d, fecha, id);
  const otros = d.equipo.filter((p) => p.id !== id);
  const libres = otros.filter((p) => !tramosDe(turnosPlan(d, fecha, p.id)).length);

  const terminar = (accion: 'guardar' | 'quitar') => {
    if (accion === 'guardar' && u.tipo === 'cubre' && !u.a) { avisar('Elige a quién cubrió'); return; }
    if (accion === 'guardar' && u.tipo === 'cubre' && !tramosDe(u.turnos).length) { avisar('Pon las horas que cubrió'); return; }
    cambiarConDeshacer(accion === 'quitar' ? 'Incidencia quitada' : 'Incidencia guardada', (x) => {
      // Quien cubría a esta persona deja de cubrirla si ya no consta que faltó.
      const soltarCoberturas = () => Object.entries(incidenciasDelDia(x, fecha)).forEach(([otro, inc]) => { if (inc.tipo === 'cubre' && inc.a === id) ponerIncidencia(x, fecha, otro, null); });
      if (accion === 'quitar') { ponerIncidencia(x, fecha, id, null); soltarCoberturas(); return; }
      soltarCoberturas();
      if (u.tipo === 'falta') {
        ponerIncidencia(x, fecha, id, { tipo: 'falta', motivo: u.motivo });
        if (u.cubre) ponerIncidencia(x, fecha, u.cubre, { tipo: 'cubre', a: id, turnos: [...turnosPlan(x, fecha, id)] });
      } else {
        const inc: Incidencia = u.tipo === 'cubre' ? { tipo: 'cubre', a: u.a, turnos: [...u.turnos] } : { tipo: 'cambio', turnos: [...u.turnos] };
        ponerIncidencia(x, fecha, id, inc);
      }
    });
    cerrarPanel();
  };
  const opcion = (tipo: Incidencia['tipo'], titulo: string, sub: string) => (
    <button className={u.tipo === tipo ? 'sel' : ''} onClick={() => cambiarU({ tipo, turnos: tipo === 'cubre' && u.a ? [...turnosPlan(d, fecha, u.a)] : [...plan] })}>{titulo}<small>{sub}</small></button>
  );
  const casilla = (i: number) => (
    <input type="time" step={60} value={aCasilla(u.turnos[i])} onChange={(e) => { const t = [...u.turnos] as Turnos; t[i] = normalizarHora(e.target.value || '') || ''; cambiarU({ turnos: t }); }} />
  );

  return (
    <>
      <h3>{nombreDe(d, id) + ' · ' + DIAS[(fecha.getDay() + 6) % 7] + ' ' + fecha.getDate()}</h3>
      <p className="sub">{u.tienePlan ? <>En el horario: <b>{textoTurnos4(plan)}</b></> : 'Según el horario, libra este día'}</p>
      <div className="opciones-inc">
        {u.tienePlan && opcion('falta', '❌ Faltó', 'No vino a trabajar')}
        {u.tienePlan && opcion('cambio', '🕒 Hizo otro horario', 'Llegó tarde, se fue antes o se quedó más')}
        {opcion('cubre', '🤝 Cubrió a un compañero', u.tienePlan ? 'Además de su turno, hizo el de otra persona' : 'Vino aunque libraba, para cubrir a alguien')}
      </div>
      {u.tipo === 'falta' && (
        <>
          <div className="grupo-stock">Motivo</div>
          <div className="chips-inc">{MOTIVOS.map((m) => <button key={m} className={u.motivo === m ? 'sel' : ''} onClick={() => cambiarU({ motivo: m })}>{m}</button>)}</div>
          <label className="campo"><span>¿Alguien cubrió su turno?</span>
            <select value={u.cubre} onChange={(e) => cambiarU({ cubre: e.target.value })}>
              <option value="">Nadie</option>
              {libres.concat(otros.filter((p) => !libres.includes(p))).map((p) => <option key={p.id} value={p.id}>{p.nombre.toUpperCase() + (libres.includes(p) ? ' (libraba)' : '')}</option>)}
            </select>
          </label>
          {u.cubre && <p className="pista-campo">A {nombreDe(d, u.cubre)} se le sumará este turno: {textoTurnos4(plan)}.</p>}
        </>
      )}
      {(u.tipo === 'cambio' || u.tipo === 'cubre') && (
        <>
          {u.tipo === 'cubre' && (
            <label className="campo"><span>¿A quién cubrió?</span>
              <select value={u.a} onChange={(e) => cambiarU({ a: e.target.value, ...(e.target.value ? { turnos: [...turnosPlan(d, fecha, e.target.value)] } : {}) })}>
                <option value="">Elige…</option>
                {otros.map((p) => <option key={p.id} value={p.id}>{p.nombre.toUpperCase() + (incidenciaDe(d, fecha, p.id)?.tipo === 'falta' ? ' (faltó)' : '')}</option>)}
              </select>
            </label>
          )}
          <div className="grupo-stock">{u.tipo === 'cubre' ? 'Horas que cubrió' : 'Horas que hizo de verdad'}</div>
          {[0, 1].map((n) => <div className="turno-inc" key={n}><span className="lbl">Turno {n + 1}</span>{casilla(n * 2)}<span>a</span>{casilla(n * 2 + 1)}</div>)}
        </>
      )}
      <div className="acciones" style={{ marginTop: 14 }}>
        <button className="btn principal" onClick={() => terminar('guardar')}>Guardar</button>
        <button className="btn secundario" onClick={() => cerrarPanel()}>Cancelar</button>
        {u.habia && <button className="btn texto" onClick={() => terminar('quitar')}>Quitar la incidencia</button>}
      </div>
    </>
  );
}
