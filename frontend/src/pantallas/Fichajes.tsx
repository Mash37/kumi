import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { DIAS, DIAS_ABREV, MESES, claveSemana, fechaDeClave } from '../dominio/fechas';
import { claveMes, diaTramo, minutosTramo, sinCerrar, tramosFichados, type Fichaje, type Marca } from '../dominio/fichaje';
import { horasExactas, informeMes, nombreDe } from '../dominio/horario';
import { Avatar } from '../componentes/Avatar';
import { usarUi } from '../estado/ui';
import { nube } from '../nube';
import { usarFichajes } from '../nube/fichajes';
import { esJefeEnLinea } from '../nube/sesion';
import { horaDe, textoTramo } from './TarjetaFichar';
import { Icono } from '../componentes/Icono';

// La jefa ve lo que ha fichado cada persona en el mes y corrige los olvidos. Corregir nunca borra: añade un registro.
export function Fichajes() {
  const d = usarAlmacen((s) => s.datos);
  const { ir, abrirPanel } = usarUi.getState();
  const [mes, setMes] = useState(() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); });
  const { lista, listo, error } = usarFichajes(esJefeEnLinea() ? d.cuenta!.rid : undefined, [claveMes(mes)], null);
  const [ahora] = useState(Date.now());

  if (!esJefeEnLinea()) {
    return (
      <main><section className="vista activa" id="vistaFichajes">
        <button className="volver" onClick={() => ir('inicio')}><span>‹</span> Inicio</button>
        <h2>Fichajes</h2>
        <div className="tarjeta"><h3>Registro de jornada</h3><p className="sub">Cada persona ficha desde su móvil y tú lo ves aquí.</p>
          <div className="vacio">Primero conecta a tu equipo en <b>＋ → Ajustes → Tu equipo en Kumi</b>.</div>
          <div className="acciones" style={{ marginTop: 12 }}><button className="btn secundario" onClick={() => ir('ajustes')}>Ir a Ajustes</button></div>
        </div>
      </section></main>
    );
  }
  const tramos = tramosFichados(lista);
  const plan = new Map(informeMes(d, mes.getFullYear(), mes.getMonth()).filas.map((f) => [f.id, f.min]));
  const ids = [...new Set([...d.equipo.map((p) => p.id), ...tramos.map((t) => t.personaId)])].filter((id) => tramos.some((t) => t.personaId === id));
  const total = tramos.reduce((s, t) => s + minutosTramo(t), 0);
  const pendientes = tramos.filter((t) => sinCerrar(t, ahora)).length;
  const corregir = (personaId: string, dia: string) => abrirPanel(<PanelCorregir personaId={personaId} dia={dia} lista={lista} />);
  return (
    <main><section className="vista activa" id="vistaFichajes">
      <button className="volver" onClick={() => ir('inicio')}><span>‹</span> Inicio</button>
      <div className="mes-nav">
        <button aria-label="Mes anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
        <div><small>Fichajes</small><b>{MESES[mes.getMonth()][0].toUpperCase() + MESES[mes.getMonth()].slice(1) + ' ' + mes.getFullYear()}</b></div>
        <button aria-label="Mes siguiente" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="tarjeta"><div className="cifras">
        <div><b>{horasExactas(total).replace(' min', '′')}</b><span>horas fichadas</span></div>
        <div><b>{ids.length}</b><span>personas</span></div>
        <div><b>{pendientes}</b><span>sin cerrar</span></div>
      </div></div>
      {pendientes > 0 && <div className="alerta"><Icono n="alerta" tam={18} /> Hay {pendientes === 1 ? '1 fichaje' : pendientes + ' fichajes'} sin entrada o sin salida. Toca el día para corregirlo.</div>}
      <div className="tarjeta"><h3>Por persona</h3><div className="sub">Toca un día para corregirlo</div>
        <div>{error ? <div className="vacio">No se pudieron leer los fichajes. ¿Tienes internet?</div>
          : !listo ? <div className="vacio">Cargando…</div>
          : !ids.length ? <div className="vacio">Nadie ha fichado en {MESES[mes.getMonth()]}.</div>
          : ids.map((id) => {
            const suyos = tramos.filter((t) => t.personaId === id);
            const dias = [...new Set(suyos.map(diaTramo))];
            const min = suyos.reduce((s, t) => s + minutosTramo(t), 0);
            const p = d.equipo.find((x) => x.id === id);
            return (
              <details className="persona-mes" key={id}>
                <summary>{p ? <Avatar p={p} /> : <span className="avatar" />}
                  <span className="quien"><b>{nombreDe(d, id)}</b><small>{dias.length + (dias.length === 1 ? ' día' : ' días')}{plan.get(id) ? ' · horario ' + horasExactas(plan.get(id)!) : ''}</small></span>
                  <span className="total">{horasExactas(min)}</span></summary>
                <div className="detalle-mes">
                  {dias.map((dia) => {
                    const delDia = suyos.filter((t) => diaTramo(t) === dia), f = fechaDeClave(dia);
                    return (
                      <div key={dia} className="toca" onClick={() => corregir(id, dia)}>
                        <span>{DIAS_ABREV[(f.getDay() + 6) % 7] + ' ' + f.getDate()}</span>
                        <span style={delDia.some((t) => sinCerrar(t, ahora)) ? { color: 'var(--frambuesa)' } : undefined}>{delDia.map(textoTramo).join(' · ')}</span>
                        <span>{horasExactas(delDia.reduce((s, t) => s + minutosTramo(t), 0))}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}</div>
        <div className="acciones" style={{ marginTop: 12 }}><button className="btn secundario" onClick={() => corregir(d.equipo[0]?.id || '', claveSemana(new Date()))}>+ Añadir un fichaje olvidado</button></div>
      </div>
      <p className="nota">Cada persona ficha desde «Mi horario» en su móvil; la hora la pone el servidor. Corregir no borra nada: queda guardado quién lo cambió, cuándo y por qué. Lo marcado con * está corregido.</p>
    </section></main>
  );
}

// Corregir un día: cambiar una hora, anular un registro o añadir uno olvidado, siempre con motivo.
function PanelCorregir({ personaId, dia, lista }: { personaId: string; dia: string; lista: Fichaje[] }) {
  const d = usarAlmacen((s) => s.datos);
  const { cerrarPanel, avisar } = usarUi.getState();
  const [quien, setQuien] = useState(personaId);
  const [fecha, setFecha] = useState(dia);
  const [editando, setEditando] = useState<{ marca: Marca | null; tipo: 'entrada' | 'salida' | 'anula'; hora: string } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => { setEditando(null); }, [quien, fecha]);
  // Por tramo, como en la lista: una salida pasada la medianoche sale en el día en que empezó el turno.
  const marcas = tramosFichados(lista).filter((t) => t.personaId === quien && diaTramo(t) === fecha).flatMap((t) => [t.e, t.s]).filter((m): m is Marca => !!m);
  const f = fechaDeClave(fecha);
  const hh = (ms: number) => { const x = new Date(ms); return String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0'); };

  const guardar = async () => {
    if (!editando) return;
    if (motivo.trim().length < 3) { avisar('Escribe el motivo'); return; }
    let hora = editando.marca ? editando.marca.h : 0;
    if (editando.tipo !== 'anula') {
      if (!editando.hora) { avisar('Pon la hora'); return; }
      const [a, b] = editando.hora.split(':').map(Number);
      const x = fechaDeClave(fecha); x.setHours(a, b, 0, 0); hora = x.getTime();
      // Una salida antes que la entrada del mismo día es de pasada la medianoche.
      const entrada = marcas.find((m) => m.f.tipo === 'entrada');
      if (editando.tipo === 'salida' && entrada && hora <= entrada.h) hora += 86400000;
    }
    if (hora > Date.now()) { avisar('No se puede poner una hora que aún no ha llegado'); return; }
    if (!navigator.onLine) { avisar('Necesitas internet para corregir'); return; }
    setEnviando(true);
    try {
      await nube.corregirFichaje(d.cuenta!.rid, { personaId: quien, tipo: editando.tipo, hora, corrige: editando.marca ? editando.marca.f.id : null, motivo: motivo.trim(), mes: claveMes(new Date(hora)) });
      avisar('Corregido'); cerrarPanel();
    } catch { avisar('No se pudo guardar. ¿Tienes internet?'); setEnviando(false); }
  };
  return (
    <>
      <h3>{nombreDe(d, quien)}</h3><p className="sub">{DIAS[(f.getDay() + 6) % 7]} {f.getDate()} de {MESES[f.getMonth()]}</p>
      <div className="campos-2">
        <label className="campo"><span>Persona</span>
          <select value={quien} onChange={(e) => setQuien(e.target.value)}>{d.equipo.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
        <label className="campo"><span>Día</span><input type="date" value={fecha} max={claveSemana(new Date())} onChange={(e) => e.target.value && setFecha(e.target.value)} /></label>
      </div>
      {marcas.length ? marcas.map((m) => (
        <div key={m.f.id} className="fila-fichaje">
          <span><b>{m.f.tipo === 'entrada' ? 'Entrada' : 'Salida'}</b> {horaDe(m.h)}{m.corregida ? '*' : ''}{m.f.motivo && <small>{m.f.motivo}</small>}</span>
          <button className="btn chico secundario" onClick={() => { setEditando({ marca: m, tipo: m.f.tipo as 'entrada' | 'salida', hora: hh(m.h) }); setMotivo(''); }}>Cambiar hora</button>
          <button className="btn chico secundario" onClick={() => { setEditando({ marca: m, tipo: 'anula', hora: '' }); setMotivo(''); }}>Anular</button>
        </div>
      )) : <div className="vacio">Ese día no hay fichajes.</div>}
      {!editando && (
        <div className="acciones fila-botones">
          <button className="btn secundario" onClick={() => setEditando({ marca: null, tipo: 'entrada', hora: '' })}>+ Entrada olvidada</button>
          <button className="btn secundario" onClick={() => setEditando({ marca: null, tipo: 'salida', hora: '' })}>+ Salida olvidada</button>
        </div>
      )}
      {editando && (
        <div className="corregir-fichaje">
          <div className="grupo-stock">{editando.tipo === 'anula' ? 'Anular ' + (editando.marca!.f.tipo === 'entrada' ? 'la entrada' : 'la salida') + ' de las ' + horaDe(editando.marca!.h) : editando.marca ? 'Nueva hora de ' + editando.tipo : (editando.tipo === 'entrada' ? 'Entrada' : 'Salida') + ' olvidada'}</div>
          {editando.tipo !== 'anula' && <label className="campo"><span>Hora</span><input type="time" step={60} value={editando.hora} onChange={(e) => setEditando({ ...editando, hora: e.target.value })} /></label>}
          <label className="campo"><span>Motivo (lo verá la persona)</span><input value={motivo} maxLength={300} placeholder="Ej.: se olvidó de fichar la salida" onChange={(e) => setMotivo(e.target.value)} /></label>
        </div>
      )}
      <div className="acciones">
        {editando && <button className="btn principal" disabled={enviando} onClick={guardar}>{enviando ? 'Guardando…' : 'Guardar corrección'}</button>}
        <button className="btn secundario" onClick={() => (editando ? setEditando(null) : cerrarPanel())}>{editando ? 'Volver' : 'Cerrar'}</button>
      </div>
    </>
  );
}
