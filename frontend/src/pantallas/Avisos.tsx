import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { nombreCorto } from '../dominio/horario';
import { usarUi } from '../estado/ui';
import { nube } from '../nube';
import type { Leido, Miembro } from '../nube/firebase';
import { arrancarSesion, esEquipo, esJefeEnLinea, marcarLeidos, sinLeer, usarSesion } from '../nube/sesion';
import { fechaHora } from './MiHorario';

// Tablón: el jefe escribe, el equipo lee y queda apuntado quién lo leyó.
export function Avisos() {
  const d = usarAlmacen((s) => s.datos);
  const avisos = usarSesion((s) => s.avisos);
  usarSesion((s) => s.usuario);
  const { avisar, ir } = usarUi.getState();
  const jefe = !esEquipo();
  const [borrador, setBorrador] = useState('');
  // Lo nuevo se resalta en esta visita aunque ya se haya marcado como leído.
  const [nuevos] = useState(() => new Set(sinLeer().map((a) => a.id)));
  useEffect(() => { arrancarSesion(); }, []);
  const pendientes = sinLeer().map((a) => a.id).join(',');
  useEffect(() => { if (!jefe) marcarLeidos(sinLeer().map((a) => a.id)); }, [pendientes, jefe]);

  if (jefe && !esJefeEnLinea()) {
    return (
      <main><section className="vista activa" id="vistaAvisos">
        <h2>Avisos</h2><p className="sub-equipo">{d.restaurante?.nombre || ''}</p>
        <div className="tarjeta"><h3>Tablón de avisos</h3><p className="sub">Escribe a todo tu equipo a la vez y mira quién lo ha leído.</p>
          <div className="vacio">Primero conecta a tu equipo en <b>＋ → Ajustes → Tu equipo en Kumi</b>.</div>
          <div className="acciones" style={{ marginTop: 12 }}><button className="btn secundario" onClick={() => ir('ajustes')}>Ir a Ajustes</button></div>
        </div>
      </section></main>
    );
  }
  const publicar = async () => {
    const texto = borrador.trim();
    if (!texto) { avisar('Escribe el aviso'); return; }
    // Se vacía antes de enviar: así no se publica dos veces si se toca otra vez mientras sube.
    setBorrador('');
    try { await nube.publicarAviso(d.cuenta!.rid, texto); avisar('Aviso publicado'); }
    catch { setBorrador(texto); avisar('No se pudo publicar. ¿Tienes internet?'); }
  };
  return (
    <main><section className="vista activa" id="vistaAvisos">
      <h2>Avisos</h2>
      <p className="sub-equipo">{d.restaurante?.nombre || ''}</p>
      {jefe && (
        <div className="tarjeta"><h3>Nuevo aviso</h3><p className="sub">Lo verá todo tu equipo en Kumi.</p>
          <label className="campo"><textarea rows={3} maxLength={1000} placeholder="Ej.: El sábado hacemos inventario a las 10" value={borrador} onChange={(e) => setBorrador(e.target.value)} /></label>
          <div className="acciones"><button className="btn principal" onClick={publicar}>📣 Publicar aviso</button></div>
        </div>
      )}
      <div className="tarjeta">
        {avisos.length ? avisos.map((a) => (
          <div key={a.id} className={'tablon-item' + (nuevos.has(a.id) ? ' nuevo' : '')}>
            <p>{a.texto}</p>
            <div className="fila-aviso"><small>{(nuevos.has(a.id) ? '🆕 ' : '') + fechaHora(a.creado)}</small>
              {jefe && <button onClick={async () => {
                if (!confirm('¿Borrar este aviso? Tu equipo dejará de verlo.')) return;
                try { await nube.borrarAviso(d.cuenta!.rid, a.id); avisar('Aviso borrado'); } catch { avisar('No se pudo borrar. ¿Tienes internet?'); }
              }}>Borrar</button>}
            </div>
            {jefe && <LeidoPor aid={a.id} version={avisos.map((x) => x.id).join()} />}
          </div>
        )) : <div className="vacio">{jefe ? 'Todavía no has escrito ningún aviso.' : 'Tu jefe todavía no ha escrito ningún aviso.'}</div>}
      </div>
    </section></main>
  );
}

// Se vuelve a mirar cada vez que cambia el tablón (como en la versión 2).
function LeidoPor({ aid, version }: { aid: string; version: string }) {
  const d = usarAlmacen((s) => s.datos);
  const [estado, setEstado] = useState<{ leidos: Leido[]; miembros: Miembro[] } | 'error' | null>(null);
  useEffect(() => {
    let vivo = true;
    Promise.all([nube.leidosDe(d.cuenta!.rid, aid), nube.miembros(d.cuenta!.rid)])
      .then(([leidos, miembros]) => { if (vivo) setEstado({ leidos, miembros }); })
      .catch(() => { if (vivo) setEstado('error'); });
    return () => { vivo = false; };
  }, [aid, version, d.cuenta]);
  if (!estado) return <small className="leido">Mirando quién lo ha leído…</small>;
  if (estado === 'error') return <small className="leido">No se pudo ver quién lo ha leído. ¿Tienes internet?</small>;
  const { leidos, miembros } = estado;
  const nombre = (uid: string, respaldo?: string) => {
    const m = miembros.find((x) => x.uid === uid), p = m && d.equipo.find((q) => q.id === m.personaId);
    return p ? nombreCorto(p.nombre) : (m && m.nombre) || respaldo || 'Alguien';
  };
  const quien = new Set(leidos.map((l) => l.uid));
  const faltan = miembros.filter((m) => !quien.has(m.uid));
  return (
    <small className="leido">
      {(leidos.length ? '✓ Leído por ' + leidos.map((l) => nombre(l.uid, l.nombre)).join(', ') : 'Nadie lo ha leído todavía') +
        (leidos.length && faltan.length ? ' · falta ' + faltan.map((m) => nombre(m.uid)).join(', ') : '')}
    </small>
  );
}
