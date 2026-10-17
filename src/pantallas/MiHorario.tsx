import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { DIAS, MESES_CORTOS, claveSemana, rango, sumarDias } from '../dominio/fechas';
import { minutosTurnos, textoHoras } from '../dominio/horas';
import { VACIO, esLibre, nombreCorto, textoTurnos4 } from '../dominio/horario';
import { cifra } from '../dominio/stock';
import { lunesEsta, lunesProxima, usarUi } from '../estado/ui';
import { sinLeer, usarSesion } from '../nube/sesion';

export function fechaHora(ms: number) { const f = new Date(ms); return f.getDate() + '/' + (f.getMonth() + 1) + ' a las ' + f.getHours() + ':' + String(f.getMinutes()).padStart(2, '0'); }

// Lo que ve cada persona del equipo: sus turnos de la semana, con quién coincide y el total de horas.
export function MiHorario() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  usarSesion((s) => s.avisos);
  const [lunesMi, setLunes] = useState(lunesEsta);
  const c = d.cuenta!, pid = c.personaId, clave = claveSemana(lunesMi);
  const nuevo = !!c.ultimaPublicacion && c.ultimaPublicacion > (c.visto || 0);
  // «Horario actualizado» se queda a la vista mientras se está en esta pantalla, aunque ya cuente como visto.
  const [mostrarNuevo, setMostrarNuevo] = useState<number | null>(null);
  useEffect(() => {
    if (!nuevo) return;
    setMostrarNuevo(c.ultimaPublicacion!);
    cambiar((x) => { x.cuenta!.visto = c.ultimaPublicacion; });
  }, [nuevo]); // eslint-disable-line react-hooks/exhaustive-deps
  const pendientes = sinLeer();
  const yo = d.equipo.find((p) => p.id === pid);
  const sem = d.semanas[clave];
  let total = 0;
  return (
    <main>
      <section className="vista activa" id="vistaMihorario">
        <h2>Mi horario</h2>
        <p className="sub-equipo">{d.restaurante?.nombre || ''}</p>
        <div>
          {pendientes.length > 0 && (
            <div className="tarjeta tarjeta-ok" data-ver-avisos onClick={() => usarUi.getState().ir('avisos')}>
              <i>📣</i><div><b>{pendientes.length === 1 ? 'Tienes 1 aviso nuevo' : 'Tienes ' + pendientes.length + ' avisos nuevos'}</b>
                <span>{pendientes[0].texto.split('\n')[0].slice(0, 70)} · Toca para leerlo</span></div>
            </div>
          )}
          {mostrarNuevo && (
            <div className="tarjeta tarjeta-ok"><i>🆕</i><div><b>Horario actualizado</b><span>Hay cambios publicados {fechaHora(mostrarNuevo)}.</span></div></div>
          )}
        </div>
        <div className="mes-nav">
          <button aria-label="Semana anterior" onClick={() => setLunes(sumarDias(lunesMi, -7))}>‹</button>
          <div><small>{clave === claveSemana(lunesEsta()) ? 'Esta semana' : clave === claveSemana(lunesProxima()) ? 'Semana que viene' : 'Semana'}</small><b>{rango(lunesMi, false)}</b></div>
          <button aria-label="Semana siguiente" onClick={() => setLunes(sumarDias(lunesMi, 7))}>›</button>
        </div>
        <div className="tarjeta">
          {!yo ? <div className="vacio">Todavía no hay ningún horario publicado contigo. Cuando tu jefe lo publique, aparecerá aquí.</div>
            : !sem ? <div className="vacio">Esta semana todavía no está publicada.</div>
            : <>
              {DIAS.map((nombreDia, i) => {
                const f = sumarDias(lunesMi, i), t = sem[pid!] ? sem[pid!][i] : VACIO, min = minutosTurnos(t);
                total += min;
                const con = d.equipo.filter((p) => p.id !== pid && sem[p.id] && sem[p.id][i].some(Boolean)).map((p) => nombreCorto(p.nombre));
                return (
                  <div key={i} className={'dia-mio' + (claveSemana(f) === claveSemana(new Date()) ? ' hoy' : '')}>
                    <div><b>{nombreDia[0].toUpperCase() + nombreDia.slice(1)}</b><small>{f.getDate() + ' ' + MESES_CORTOS[f.getMonth()]}</small></div>
                    <div>{min ? <><b>{textoTurnos4(t)}</b>{con.length > 0 && <small>Con {con.join(', ')}</small>}</>
                      : esLibre(d, f, pid!) ? <span className="libre-mio">🌴 Libre</span> : <small>Sin turno</small>}</div>
                    <span>{min ? textoHoras(min) : ''}</span>
                  </div>
                );
              })}
              <div className="total-mio"><span>Total de la semana{yo.contrato ? ' · contrato ' + cifra.format(yo.contrato) + ' h' : ''}</span><b>{textoHoras(total)}</b></div>
            </>}
        </div>
      </section>
    </main>
  );
}
