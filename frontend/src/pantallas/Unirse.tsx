import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { nombreCorto } from '../dominio/horario';
import { usarUi } from '../estado/ui';
import { nube } from '../nube';
import type { Codigo } from '../nube/firebase';
import { arrancarSesion, escucharMiRestaurante, usarSesion } from '../nube/sesion';
import { usarTema } from '../tema';

// Alguien del equipo: entra con Google, escribe el código y elige su nombre.
export function Unirse({ codigoInicial, volver }: { codigoInicial: string; volver: () => void }) {
  const u = usarSesion((s) => s.usuario);
  const { avisar } = usarUi.getState();
  const [codigo, setCodigo] = useState(codigoInicial.toUpperCase());
  const [rest, setRest] = useState<Codigo | null>(null);
  const [personaId, setPersona] = useState<string | null>(null);
  const [uniendo, setUniendo] = useState(false);
  usarTema(rest?.tipo, usarAlmacen.getState().datos.restaurante?.modo);
  useEffect(() => { arrancarSesion(); }, []);
  useEffect(() => { document.body.classList.add('en-bienvenida'); window.scrollTo(0, 0); return () => document.body.classList.remove('en-bienvenida'); }, []);

  const buscar = async () => {
    const cod = codigo.trim().toUpperCase();
    if (cod.length !== 6) { avisar('El código tiene 6 letras y números'); return; }
    try {
      const r = await nube.leerCodigo(cod);
      if (!r) { avisar('No hay ningún restaurante con ese código'); return; }
      setRest(r); setPersona(null);
    } catch { avisar('No se pudo comprobar el código'); }
  };
  const unirme = async () => {
    if (!rest || !personaId || !u) return;
    setUniendo(true);
    const cod = codigo.trim().toUpperCase();
    try { await nube.unirse(cod, rest.rid, personaId); }
    catch { avisar('No se pudo unir. Pide a tu jefe el código actual'); setUniendo(false); return; }
    const yo = rest.equipo.find((p) => p.id === personaId)!;
    usarAlmacen.getState().reemplazar({
      equipo: rest.equipo.map((p) => ({ id: p.id, nombre: p.nombre, contrato: p.contrato || null })), semanas: {},
      restaurante: { persona: nombreCorto(yo.nombre), nombre: rest.nombre, tipo: rest.tipo, modo: usarAlmacen.getState().datos.restaurante?.modo || 'auto' },
      cuenta: { rol: 'equipo', rid: rest.rid, codigo: cod, personaId, uid: u.uid },
    });
    escucharMiRestaurante();
    usarUi.setState({ vista: 'mihorario' });
    avisar('¡Ya estás en el equipo de ' + rest.nombre + '!');
  };
  return (
    <section className="bienvenida">
      <div className="portada">
        <div className="barra-sup"><span className="logo-txt">Kumi</span></div>
        <h1>Únete a tu equipo</h1>
        <p>Verás tu horario en el móvil en cuanto lo publique tu jefe o jefa.</p>
      </div>
      <div className="tablero">
        <div className="tarjeta">
          <h3>1 · Entra con Google</h3>
          <p className="sub">{u ? <>Has entrado como <b>{u.displayName || u.email}</b>.</> : 'Así tu jefe sabe quién eres y nadie de fuera ve el horario.'}</p>
          {!u && <div className="acciones"><button className="btn principal" onClick={() => nube.entrar().catch((e) => { if (e.code === 'kumi/nativo-sin-configurar') avisar('Entrar con Google en la app llega muy pronto; de momento, desde la web'); else if (e.code !== 'auth/popup-closed-by-user') avisar('No se pudo entrar con Google'); })}>Entrar con Google</button></div>}
        </div>
        {u && (
          <div className="tarjeta">
            <h3>2 · Código de invitación</h3>
            <p className="sub">Te lo da tu jefe o jefa: 6 letras y números.</p>
            <label className="campo"><input className="uCodigo" maxLength={6} autoComplete="off" autoCapitalize="characters" placeholder="ABC123" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} /></label>
            <div className="acciones"><button className="btn secundario" onClick={buscar}>Buscar restaurante</button></div>
          </div>
        )}
        {rest && (
          <div className="tarjeta">
            <h3>{rest.nombre}</h3>
            <p className="sub">3 · ¿Quién eres?</p>
            <div className="chips-inc">
              {(rest.equipo || []).length ? rest.equipo.map((p) => <button key={p.id} className={personaId === p.id ? 'sel' : ''} onClick={() => setPersona(p.id)}>{p.nombre.toUpperCase()}</button>)
                : <div className="vacio">Tu jefe todavía no ha añadido al equipo.</div>}
            </div>
            <div className="acciones"><button className="btn principal" disabled={!personaId || uniendo} onClick={unirme}>Unirme</button></div>
          </div>
        )}
        <div className="acciones"><button className="btn texto" style={{ color: 'var(--frambuesa)' }} onClick={volver}>‹ Volver</button></div>
      </div>
    </section>
  );
}
