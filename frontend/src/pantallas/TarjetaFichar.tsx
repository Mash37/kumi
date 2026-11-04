import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { DIAS_ABREV, claveSemana } from '../dominio/fechas';
import { claveMes, dentroDesde, diaTramo, mesAnterior, minutosTramo, tramosFichados, type Marca, type TramoFichado } from '../dominio/fichaje';
import { horasExactas } from '../dominio/horario';
import { usarUi } from '../estado/ui';
import { nube } from '../nube';
import { usarFichajes } from '../nube/fichajes';

export const horaDe = (ms: number) => { const f = new Date(ms); return f.getHours() + ':' + String(f.getMinutes()).padStart(2, '0'); };
export const textoMarca = (m: Marca | null) => (m ? horaDe(m.h) + (m.corregida ? '*' : '') : '?');
/** «?» = falta la entrada; «…» = aún sin salida (dentro o se olvidó). */
export const textoTramo = (t: TramoFichado) => textoMarca(t.e) + '–' + (t.s ? textoMarca(t.s) : '…');

// Lo que ve cada persona del equipo arriba de su horario: fichar la entrada o la salida, y lo que lleva fichado.
export function TarjetaFichar() {
  const c = usarAlmacen((s) => s.datos.cuenta)!;
  const { avisar } = usarUi.getState();
  const [ahora, setAhora] = useState(Date.now());
  const [enviando, setEnviando] = useState(false);
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 30000); return () => clearInterval(t); }, []);
  const hoy = new Date(ahora);
  const { lista, listo, error } = usarFichajes(c.rid, [mesAnterior(hoy), claveMes(hoy)], c.personaId || null);
  if (!c.personaId) return null;
  const dentro = dentroDesde(lista, c.personaId, ahora);
  const tramos = tramosFichados(lista).filter((t) => t.personaId === c.personaId);
  const deHoy = tramos.filter((t) => diaTramo(t) === claveSemana(hoy));
  const delMes = tramos.filter((t) => diaTramo(t).startsWith(claveMes(hoy)));

  const fichar = async () => {
    // Sin conexión, la nube pondría la hora de cuando vuelva internet, no la de ahora.
    if (!navigator.onLine) { avisar('Necesitas internet para fichar'); return; }
    const tipo = dentro ? 'salida' : 'entrada';
    if (dentro && ahora - dentro.h < 120000 && !confirm('Acabas de fichar la entrada. ¿Fichar ya la salida?')) return;
    setEnviando(true);
    try { await nube.fichar(c.rid, c.personaId!, tipo, claveMes(new Date())); avisar((tipo === 'entrada' ? 'Entrada' : 'Salida') + ' a las ' + horaDe(Date.now()) + ' ✓'); }
    catch { avisar('No se pudo fichar. ¿Tienes internet?'); }
    finally { setEnviando(false); }
  };
  return (
    <div className="tarjeta fichar-mio">
      <h3>Fichaje</h3>
      <p className="sub">{error ? 'No se pudieron leer tus fichajes. ¿Tienes internet?' : !listo ? 'Cargando…' : dentro ? 'Dentro desde las ' + horaDe(dentro.h) : 'Fuera de la cocina'}</p>
      <button className={'btn principal fichar-ok' + (dentro ? ' salida' : '')} disabled={!listo || enviando} onClick={fichar}>
        {enviando ? 'Fichando…' : dentro ? 'Fichar salida' : 'Fichar entrada'}
      </button>
      {deHoy.length > 0 && <p className="fichado-hoy">Hoy: {deHoy.map(textoTramo).join(' · ')}</p>}
      {delMes.length > 0 && (
        <details className="mis-fichajes">
          <summary>Mis fichajes de este mes · {horasExactas(delMes.reduce((s, t) => s + minutosTramo(t), 0))}</summary>
          {delMes.map((t) => {
            const f = new Date((t.e ?? t.s)!.h);
            const corr = [t.e, t.s].filter((m): m is Marca => !!m && m.corregida).map((m) => m.f.motivo).filter(Boolean);
            return (
              <div key={(t.e ?? t.s)!.f.id}>
                <span>{DIAS_ABREV[(f.getDay() + 6) % 7] + ' ' + f.getDate()}</span>
                <span>{textoTramo(t)}{corr.length > 0 && <small>Corregido: {corr.join(' · ')}</small>}</span>
                <span>{t.e && t.s ? horasExactas(minutosTramo(t)) : 'falta'}</span>
              </div>
            );
          })}
          <p className="nota">Con * lo corrigió tu jefe. Si ves algo mal, díselo.</p>
        </details>
      )}
    </div>
  );
}
