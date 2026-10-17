import { usarAlmacen } from '../datos/almacen';
import { alternarLibre, copiarSemana, semanaDe, turnosDe, vaciarSemana } from '../datos/acciones';
import type { Persona, Turnos } from '../datos/tipos';
import { DIAS, MESES, claveSemana, fechaDeClave, sumarDias } from '../dominio/fechas';
import { aCasilla, minutosTurnos, normalizarHora, semanaTieneDatos, textoHoras } from '../dominio/horas';
import { avisosSemana, coberturaDia, detalleCorto, esLibre, incidenciaDe, textoIncidencia, VACIO, type Aviso } from '../dominio/horario';
import { Avatar } from '../componentes/Avatar';
import { Cabecera } from '../componentes/Cabecera';
import { usarUi } from '../estado/ui';
import { PanelIncidencia } from './PanelIncidencia';
import { PanelRepetir } from './PanelRepetir';

const ICONO_REPETIR = <svg viewBox="0 0 24 24"><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>;

export function Rellenar() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { lunes: clave, diaActivo, ir, avisar, abrirPanel } = usarUi();
  const lunes = fechaDeClave(clave);
  const fecha = sumarDias(lunes, diaActivo);
  const sem = d.semanas[clave] || {};
  const anterior = d.semanas[claveSemana(sumarDias(lunes, -7))];
  const avisos = avisosSemana(d, lunes);
  const alguienTrabaja = d.equipo.some((p) => sem[p.id] && sem[p.id][diaActivo].some(Boolean));

  const copiarAnterior = () => {
    if (!semanaTieneDatos(anterior)) { avisar('La semana anterior está vacía'); return; }
    if (semanaTieneDatos(sem) && !confirm('Esta semana ya tiene horas. ¿Reemplazarlas por las de la semana anterior?')) return;
    cambiar((x) => copiarSemana(x, sumarDias(lunes, -7), lunes));
    avisar('Copiada. Cambia solo lo que sea distinto');
  };

  return (
    <>
      <Cabecera conDias />
      <main>
        <section className="vista activa" id="vistaRellenar">
          {d.equipo.length > 0 && !semanaTieneDatos(sem) && (
            <div className="tarjeta empezar">
              <h3>Semana vacía</h3>
              {semanaTieneDatos(anterior) ? (
                <>
                  <p className="sub">Lo más rápido: copia la semana anterior y cambia solo lo que sea distinto.</p>
                  <div className="acciones"><button className="btn principal" onClick={copiarAnterior}>Copiar la semana anterior</button></div>
                </>
              ) : <p className="sub">Escribe las horas de cada persona día a día. Con «Repetir» las copias a otros días.</p>}
            </div>
          )}
          <h2>{DIAS[diaActivo] + ' ' + fecha.getDate() + ' de ' + MESES[fecha.getMonth()]}</h2>
          <div className="cobertura">
            {(coberturaDia(d, fecha) || []).map((r) => {
              const ok = !r.cortos.length;
              return (
                <div key={r.f.id} className={'franja ' + (ok ? 'ok' : 'corta')}>
                  <b>{r.f.icono + ' ' + r.f.nombre}</b><span>{r.min + '/' + r.f.minimo + (ok ? ' ✓' : ' ⚠️')}</span>
                  {!ok && <small>{detalleCorto(r).replace(/^./, (c) => c.toUpperCase())}</small>}
                </div>
              );
            })}
          </div>
          <div id="personas">
            {d.equipo.length ? d.equipo.map((p) => <FilaPersona key={p.id} p={p} lunes={lunes} dia={diaActivo} avisos={avisos} />)
              : <p className="nota">Añade a tu equipo en ＋ → Tu equipo.</p>}
          </div>
          <div className="acciones">
            {alguienTrabaja && (
              <button className="btn secundario" onClick={() => abrirPanel(<PanelRepetir ids={d.equipo.map((p) => p.id)} />)}>{ICONO_REPETIR}Repetir todo este día en otros días</button>
            )}
            <button className="btn principal" onClick={() => ir('cuadro')}>Ver cuadro y enviar</button>
          </div>
          <details className="mas-opciones solo-jefe">
            <summary>Más opciones de esta semana</summary>
            <div className="acciones">
              <button className="btn secundario" onClick={copiarAnterior}>Copiar el horario de la semana anterior</button>
              <button className="btn peligro" onClick={() => { if (confirm('¿Borrar todas las horas de esta semana?')) cambiar((x) => vaciarSemana(x, lunes)); }}>Vaciar esta semana</button>
            </div>
          </details>
        </section>
      </main>
    </>
  );
}

function FilaPersona({ p, lunes, dia, avisos }: { p: Persona; lunes: Date; dia: number; avisos: Aviso[] }) {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { avisar, abrirPanel } = usarUi.getState();
  const fecha = sumarDias(lunes, dia);
  const t: Turnos = d.semanas[claveSemana(lunes)]?.[p.id]?.[dia] ?? VACIO;
  const trabaja = t.some(Boolean);
  const libre = esLibre(d, fecha, p.id);
  const inc = incidenciaDe(d, fecha, p.id);
  const suyos = avisos.filter((a) => a.id === p.id && (a.dia === dia || a.dia === null));

  const guardarHora = (i: number, texto: string) => {
    const valor = normalizarHora(texto);
    if (valor === null) { avisar('Esa hora no es válida'); return; }
    if (t[i] !== valor) cambiar((x) => { turnosDe(semanaDe(x, lunes), p.id, dia)[i] = valor; });
  };
  const casilla = (i: number, etiqueta: string) => (
    <input type="time" step={60} className={t[i] ? 'lleno' : ''} aria-label={etiqueta} value={aCasilla(t[i])} onChange={(e) => guardarHora(i, e.target.value)} />
  );
  const fila = (n: number) => (
    <div className="turno" key={n}>
      <span className="lbl">Turno {n + 1}</span>
      {casilla(n * 2, 'Entrada turno ' + (n + 1))}
      <span className="a">a</span>
      {casilla(n * 2 + 1, 'Salida turno ' + (n + 1))}
      <button className="borrar" aria-label={'Borrar turno ' + (n + 1)} onClick={() => cambiar((x) => { const tt = turnosDe(semanaDe(x, lunes), p.id, dia); tt[n * 2] = ''; tt[n * 2 + 1] = ''; })}>✕</button>
    </div>
  );
  return (
    <div className={'persona' + (libre ? ' es-libre' : '')}>
      <div className="nombre">
        <Avatar p={p} />{p.nombre.toUpperCase()}
        <span className="derecha">
          {trabaja && <span className="etiqueta trabaja">{textoHoras(minutosTurnos(t))}</span>}
          <button className={'interruptor' + (libre ? ' on' : '')} role="switch" aria-checked={libre} onClick={() => cambiar((x) => alternarLibre(x, lunes, dia, p.id))}>Libre<i /></button>
        </span>
      </div>
      {suyos.length > 0 && <div className="avisos-desc">{suyos.map((a, i) => <div key={i}>⚠️ {a.texto}</div>)}</div>}
      {libre ? <div className="dia-libre">🌴 Libre</div> : [fila(0), fila(1)]}
      <div className="incid">
        {trabaja && <button className="repetir" onClick={() => abrirPanel(<PanelRepetir ids={[p.id]} />)}>{ICONO_REPETIR}Repetir</button>}
        {inc && <span className={'badge ' + inc.tipo}>{textoIncidencia(d, inc, fecha, p.id)}</span>}
        <button className="que-paso" onClick={() => abrirPanel(<PanelIncidencia id={p.id} />)}>{inc ? 'Cambiar' : '¿Qué pasó este día?'}</button>
      </div>
    </div>
  );
}
