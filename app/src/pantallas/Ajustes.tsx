import { useState } from 'react';
import { CLAVE, usarAlmacen } from '../datos/almacen';
import type { Reglas, Restaurante } from '../datos/tipos';
import { textoUltimaCopia } from '../dominio/copia';
import { reglas } from '../dominio/horario';
import { Tipos } from '../componentes/Tipos';
import { MiRestaurante, NubeJefe } from '../componentes/EnLinea';
import { guardarCopia, recuperarCopia } from '../componentes/copias';
import { usarUi } from '../estado/ui';
import { PanelServicios } from './PanelServicios';

export const VERSION = '3.0';
const MODOS = [['auto', 'Automático'], ['claro', '☀️ Claro'], ['oscuro', '🌙 Oscuro']] as const;
const REGLAS_UI: [keyof Reglas, string, string, number, number, number][] = [
  ['entreDias', 'Descanso entre jornadas', 'Del final de un día al inicio del siguiente', 1, 6, 24],
  ['semanal', 'Descanso semanal seguido', 'Día y medio = 36 h; dos días = 48 h', 12, 12, 96],
  ['maxDia', 'Máximo de horas en un día', 'Horas de trabajo efectivo', 1, 4, 14],
  ['maxSemana', 'Máximo de horas a la semana', 'Para quien no tenga horas de contrato', 1, 10, 60],
];
const TARJETAS_INICIO = [['servicio', 'El servicio de hoy'], ['semana', 'Semana que viene'], ['horas', 'Horas de cada uno'], ['stock', 'Stock'], ['dato', 'Palabra / dato del día']] as const;

export function Ajustes() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { ir, avisar, abrirPanel } = usarUi.getState();
  const r = d.restaurante ?? {};
  const R = reglas(d);
  const ver = { servicio: true, semana: true, horas: true, stock: true, dato: true, ...(d.inicio || {}) };
  // Las casillas de texto guardan sin espacios sobrantes, pero dejan escribirlos mientras se escribe.
  const [persona, setPersona] = useState(r.persona || '');
  const [nombre, setNombre] = useState(r.nombre || '');
  const ponerR = (c: Partial<Restaurante>) => cambiar((x) => { x.restaurante = { ...(x.restaurante || {}), ...c }; });
  const n = d.equipo.length;

  return (
    <main>
      <section className="vista activa" id="vistaAjustes">
        <button className="volver" onClick={() => ir('inicio')}><span>‹</span> Inicio</button>
        <h2>Ajustes</h2>
        <div className="tarjeta">
          <h3>Tu perfil</h3><p className="sub">&nbsp;</p>
          <label className="campo"><span>Tu nombre (el del saludo)</span><input autoComplete="given-name" value={persona} onChange={(e) => { setPersona(e.target.value); ponerR({ persona: e.target.value.trim() }); }} /></label>
        </div>
        <div className="tarjeta solo-jefe">
          <h3>Restaurante</h3><p className="sub">&nbsp;</p>
          <label className="campo"><span>Nombre del restaurante</span><input value={nombre} onChange={(e) => { setNombre(e.target.value); ponerR({ nombre: e.target.value.trim() }); }} /></label>
          <div className="grupo-stock">Tipo de cocina</div>
          <Tipos sel={r.tipo || 'sushi'} elegir={(tipo) => ponerR({ tipo })} />
        </div>
        <div className="tarjeta">
          <h3>Apariencia</h3><p className="sub">&nbsp;</p>
          <div className="modos">{MODOS.map(([k, l]) => <button key={k} className={(r.modo || 'auto') === k ? 'sel' : ''} onClick={() => ponerR({ modo: k })}>{l}</button>)}</div>
          <p className="pista-campo" style={{ marginTop: 8 }}>«Automático» sigue el modo claro u oscuro del móvil.</p>
        </div>
        <div className="tarjeta solo-jefe">
          <h3>Equipo y servicios</h3><p className="sub">Personas, horas de contrato y gente mínima por servicio.</p>
          <div className="acciones">
            <button className="btn secundario" onClick={() => ir('equipo')}>{'👥 Tu equipo (' + n + (n === 1 ? ' persona)' : ' personas)')}</button>
            <button className="btn secundario" onClick={() => abrirPanel(<PanelServicios />)}>🍽️ Servicios y mínimos</button>
          </div>
        </div>
        <div className="tarjeta solo-jefe" id="tarjetaNube">
          <h3>Tu equipo en Kumi</h3>
          <p className="sub">Publica el horario y cada persona lo verá en su móvil, sin mandar fotos.</p>
          <NubeJefe />
        </div>
        <MiRestaurante />
        <div className="tarjeta solo-jefe">
          <h3>Reglas de descanso</h3>
          <p className="sub">Vienen con las generales del Estatuto de los Trabajadores. Ajústalas a tu convenio.</p>
          {REGLAS_UI.map(([k, t, sub, paso, min, max]) => (
            <div className="regla" key={k}>
              <div><b>{t}</b><small>{sub}</small></div>
              <div className="contador">
                <button aria-label="Menos" onClick={() => cambiar((x) => { x.reglas = { ...(x.reglas || {}), [k]: Math.min(max, Math.max(min, R[k] - paso)) }; })}>−</button>
                <b>{R[k]} h</b>
                <button aria-label="Más" onClick={() => cambiar((x) => { x.reglas = { ...(x.reglas || {}), [k]: Math.min(max, Math.max(min, R[k] + paso)) }; })}>+</button>
              </div>
            </div>
          ))}
          <button className="btn texto" style={{ color: 'var(--frambuesa)' }} onClick={() => { cambiar((x) => { delete x.reglas; }); avisar('Reglas del Estatuto restablecidas'); }}>Volver a las del Estatuto</button>
        </div>
        <div className="tarjeta solo-jefe">
          <h3>Pantalla de inicio</h3><p className="sub">Elige qué tarjetas quieres ver.</p>
          {TARJETAS_INICIO.map(([k, t]) => (
            <div className="opcion-inicio" key={k}>{t}
              <button className={'interruptor' + (ver[k] ? ' on' : '')} role="switch" aria-checked={ver[k]} aria-label={t} onClick={() => cambiar((x) => { x.inicio = { ...ver, [k]: !ver[k] }; })}><i /></button>
            </div>
          ))}
        </div>
        <div className="tarjeta solo-jefe">
          <h3>Tus datos</h3><p className="sub">{textoUltimaCopia(d)}</p>
          <div className="acciones">
            <button className="btn secundario" onClick={guardarCopia}>💾 Guardar copia de seguridad</button>
            <button className="btn secundario" onClick={recuperarCopia}>📂 Recuperar desde una copia</button>
            <button className="btn peligro" onClick={() => {
              if (!confirm('¿Borrar TODOS los datos de Kumi en este móvil? Horarios, equipo, incidencias, stock y ajustes.')) return;
              if (!confirm('Última comprobación: no se puede deshacer. Si no has guardado una copia de seguridad, pulsa Cancelar. ¿Borrar todo?')) return;
              try { localStorage.removeItem(CLAVE); } catch { /* sin acceso */ }
              usarAlmacen.getState().reemplazar({ equipo: [], semanas: {} });
              ir('inicio');
              avisar('Datos borrados');
            }}>Borrar todo y empezar de cero</button>
          </div>
        </div>
        <div className="tarjeta acerca">
          <h3>Acerca de</h3>
          <p>Kumi · versión <b>{VERSION}</b></p>
          <p>Hecha por <b>Mash</b>. Todo lo que apuntas se guarda solo en este móvil.</p>
        </div>
      </section>
    </main>
  );
}
