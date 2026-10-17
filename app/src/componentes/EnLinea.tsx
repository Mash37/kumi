// Las piezas en línea que van dentro de otras pantallas: publicar (Cuadro), «Tu equipo en Kumi» (Ajustes),
// «Tu restaurante» del equipo (Ajustes) y el tablón (Inicio).
import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';

import { semanaTieneDatos } from '../dominio/horas';
import { usarUi } from '../estado/ui';
import { nube } from '../nube';
import type { Miembro } from '../nube/firebase';
import { semanaANube } from '../nube/conversion';
import { arrancarSesion, esJefeEnLinea, escucharAvisos, pararTodo, usarSesion } from '../nube/sesion';
import { fechaHora } from '../pantallas/MiHorario';

export function Publicar({ clave }: { clave: string }) {
  const d = usarAlmacen((s) => s.datos);
  usarSesion((s) => s.usuario);
  const [subiendo, setSubiendo] = useState(false);
  if (!esJefeEnLinea()) {
    return <p className="nota" style={{ textAlign: 'left', margin: '0 2px 12px' }}>💡 Tu equipo puede ver este horario en su móvil, sin fotos: <b>＋ → Ajustes → Tu equipo en Kumi</b>.</p>;
  }
  const hayDatos = semanaTieneDatos(d.semanas[clave]), pub = (d.publicado || {})[clave];
  const estado = !hayDatos ? 'Esta semana está vacía.' : pub && pub.huella === JSON.stringify(semanaANube(d, clave)) ? '✅ Publicado el ' + fechaHora(pub.cuando) : pub ? '⚠️ Hay cambios sin publicar.' : 'Todavía no está publicado.';
  const publicar = async () => {
    const c = d.cuenta!, semana = semanaANube(d, clave);
    setSubiendo(true);
    try {
      await nube.publicarSemana(c.rid, c.codigo, clave, semana, { nombre: d.restaurante?.nombre || 'Mi restaurante', tipo: d.restaurante?.tipo || 'sushi' });
      usarAlmacen.getState().cambiar((x) => { x.publicado = x.publicado || {}; x.publicado[clave] = { huella: JSON.stringify(semana), cuando: Date.now() }; });
      usarUi.getState().avisar('Publicado: tu equipo ya lo ve en Kumi');
    } catch { usarUi.getState().avisar('No se pudo publicar. ¿Tienes internet?'); }
    setSubiendo(false);
  };
  return (
    <div className="tarjeta"><h3>Tu equipo en Kumi</h3><p className="sub">{estado}</p>
      <div className="acciones"><button className="btn principal" disabled={!hayDatos || subiendo} onClick={publicar}>📤 Publicar este horario</button></div>
    </div>
  );
}

export function NubeJefe() {
  const d = usarAlmacen((s) => s.datos);
  const u = usarSesion((s) => s.usuario);
  const { avisar } = usarUi.getState();
  const c = d.cuenta;
  const lista = usarSesion((s) => s.lista);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { arrancarSesion(); }, []);
  const intentar = async (f: () => Promise<unknown>) => {
    try { await f(); } catch (e) {
      const codigo = (e as { code?: string }).code;
      if (codigo === 'kumi/nativo-sin-configurar') avisar('Entrar con Google en la app llega muy pronto; de momento, desde la web');
      else if (codigo !== 'auth/popup-closed-by-user') avisar('No se pudo completar. ¿Tienes internet?');
    }
  };
  if (!lista) return <div className="vacio">Conectando…</div>;
  if (!u) {
    return (
      <>
        <div className="acciones"><button className="btn principal" onClick={() => intentar(() => nube.entrar())}>Entrar con Google</button></div>
        <p className="pista-campo" style={{ marginTop: 8 }}>Solo se sube lo que publiques: nombres y turnos. El stock, las horas para nómina y las incidencias se quedan en tu móvil.</p>
      </>
    );
  }
  if (c?.rol !== 'jefe' || !c.rid || c.uid !== u.uid) {
    return (
      <>
        <p className="sub">Has entrado como <b>{u.email}</b>.</p>
        <div className="acciones">
          <button className="btn principal" disabled={ocupado} onClick={() => intentar(async () => {
            setOcupado(true);
            try {
              const r = await nube.crearRestaurante({ nombre: d.restaurante?.nombre || 'Mi restaurante', tipo: d.restaurante?.tipo || 'sushi', equipo: d.equipo.map((p) => ({ id: p.id, nombre: p.nombre, contrato: p.contrato || null })) });
              usarAlmacen.getState().cambiar((x) => { x.cuenta = { rol: 'jefe', rid: r.rid, codigo: r.codigo, uid: u.uid }; });
              escucharAvisos();
              avisar('Listo. Comparte el código con tu equipo');
            } finally { setOcupado(false); }
          })}>Crear «{d.restaurante?.nombre || 'Mi restaurante'}» en línea</button>
          <button className="btn texto" style={{ color: 'var(--frambuesa)' }} onClick={() => intentar(() => nube.salir())}>Cerrar sesión</button>
        </div>
      </>
    );
  }
  const invitar = () => intentar(async () => {
    const enlace = 'https://mash37.github.io/kumi/?unirse=' + c.codigo;
    const texto = 'Únete al equipo de ' + (d.restaurante?.nombre || 'nuestro restaurante') + ' en Kumi para ver tu horario: ' + enlace + ' (código ' + c.codigo + ')';
    if (navigator.share) await navigator.share({ title: 'Invitación a Kumi', text: texto }).catch(() => {});
    else { await navigator.clipboard.writeText(texto); avisar('Invitación copiada'); }
  });
  return (
    <>
      <p className="sub">Código de invitación de tu equipo:</p>
      <div className="codigo-grande">{c.codigo}</div>
      <div className="acciones"><button className="btn principal" onClick={invitar}>Compartir invitación</button></div>
      <div className="grupo-stock" style={{ marginTop: 16 }}>Personas unidas</div>
      <Miembros />
      <p className="pista-campo" style={{ marginTop: 10 }}>Conectado como {u.email}.{' '}
        <button className="btn texto" style={{ display: 'inline', minHeight: 0, padding: 0, color: 'var(--frambuesa)', width: 'auto' }} onClick={() => intentar(() => nube.salir())}>Cerrar sesión</button>
      </p>
    </>
  );
}

function Miembros() {
  const d = usarAlmacen((s) => s.datos);
  const { avisar } = usarUi.getState();
  const [ms, setMs] = useState<Miembro[] | 'error' | null>(null);
  const cargar = () => nube.miembros(d.cuenta!.rid).then(setMs).catch(() => setMs('error'));
  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ms) return <div className="vacio">Cargando…</div>;
  if (ms === 'error') return <div className="vacio">No se pudo cargar la lista. ¿Tienes internet?</div>;
  if (!ms.length) return <div className="vacio">Aún no se ha unido nadie. Comparte la invitación con tu equipo.</div>;
  return (
    <>
      {ms.map((m) => (
        <div className="miembro" key={m.uid}>
          <b>{m.nombre || 'Sin nombre'}</b><small>{m.correo}</small>
          <div className="fila">
            <select aria-label="Es en el equipo" defaultValue={m.personaId || ''} onChange={(e) => nube.vincular(d.cuenta!.rid, m.uid, e.target.value || null).then(() => avisar('Guardado')).catch(() => avisar('No se pudo guardar'))}>
              <option value="">— Sin asignar —</option>
              {d.equipo.map((p) => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
            </select>
            <button onClick={async () => {
              if (!confirm('¿Quitar a esta persona? Dejará de ver el horario.')) return;
              try { await nube.quitarMiembro(d.cuenta!.rid, m.uid); cargar(); } catch { avisar('No se pudo completar. ¿Tienes internet?'); }
            }}>Quitar</button>
          </div>
        </div>
      ))}
    </>
  );
}

export function MiRestaurante() {
  const d = usarAlmacen((s) => s.datos);
  const u = usarSesion((s) => s.usuario);
  return (
    <div className="tarjeta solo-equipo">
      <h3>Tu restaurante</h3>
      <p className="sub">Estás en <b>{d.restaurante?.nombre || ''}</b> como <b>{d.restaurante?.persona || ''}</b>.{u ? ' Has entrado con ' + (u.email || '') + '.' : ''}</p>
      <div className="acciones"><button className="btn peligro" onClick={async () => {
        if (!confirm('¿Salir de «' + (d.restaurante?.nombre || 'este restaurante') + '»? Dejarás de ver el horario.')) return;
        try { await nube.salirDelRestaurante(d.cuenta!.rid); } catch { /* sin conexión: se sale igual en este móvil */ }
        pararTodo();
        usarAlmacen.getState().reemplazar({ equipo: [], semanas: {} });
        usarUi.setState({ vista: 'inicio' });
      }}>Salir de este restaurante</button></div>
    </div>
  );
}

export function TarjetaTablon() {
  const avisos = usarSesion((s) => s.avisos);
  usarSesion((s) => s.usuario);
  usarAlmacen((s) => s.datos.cuenta);
  if (!esJefeEnLinea()) return null;
  return (
    <div className="tarjeta solo-jefe" id="tarjetaTablon">
      <h3>Tablón de avisos</h3>
      <div className="sub">{avisos.length ? 'Último aviso: ' + fechaHora(avisos[0].creado) : 'Escribe a todo tu equipo a la vez y mira quién lo ha leído.'}</div>
      <div className="acciones"><button className="btn secundario" onClick={() => usarUi.getState().ir('avisos')}>Escribir a tu equipo</button></div>
    </div>
  );
}

