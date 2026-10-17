import { useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { quitarLibre, semanaDe, turnosDe } from '../datos/acciones';
import { DIAS, DIAS_CORTOS, fechaDeClave, sumarDias } from '../dominio/fechas';
import { cambiarConDeshacer, usarUi } from '../estado/ui';

// Repetir el horario de un día en otros días de la misma semana.
export function PanelRepetir({ ids }: { ids: string[] }) {
  const d = usarAlmacen((s) => s.datos);
  const { lunes: clave, diaActivo, cerrarPanel } = usarUi();
  const lunes = fechaDeClave(clave);
  const sem = d.semanas[clave] || {};
  const conHoras = ids.filter((id) => sem[id] && sem[id][diaActivo].some(Boolean));
  const [dias, setDias] = useState(() => new Set([0, 1, 2, 3, 4, 5, 6].filter((x) => x > diaActivo)));
  if (!conHoras.length) return null;
  const fecha = sumarDias(lunes, diaActivo);
  const dia = DIAS[diaActivo] + ' ' + fecha.getDate();
  const p = ids.length === 1 ? d.equipo.find((x) => x.id === ids[0]) : null;
  const t = p ? sem[p.id][diaActivo] : null;
  const grupos: Record<string, number[]> = { siguientes: [0, 1, 2, 3, 4, 5, 6].filter((x) => x > diaActivo), todos: [0, 1, 2, 3, 4, 5, 6], laborables: [0, 1, 2, 3, 4], finde: [5, 6], ninguno: [] };
  const n = dias.size;
  const aplicar = () => {
    if (!n) return;
    cambiarConDeshacer('Repetido en ' + n + (n === 1 ? ' día' : ' días'), (x) => {
      const s = semanaDe(x, lunes);
      conHoras.forEach((id) => {
        const origen = turnosDe(s, id, diaActivo);
        dias.forEach((dd) => { s[id][dd] = [...origen]; quitarLibre(x, sumarDias(lunes, dd), id); });
      });
    });
    cerrarPanel();
  };
  return (
    <>
      <h3>{p ? 'Repetir el horario de ' + p.nombre.toUpperCase() : 'Repetir todo el ' + DIAS[diaActivo]}</h3>
      <p className="sub">
        {p && t ? <>Lo del {dia} (<b>{[[t[0], t[1]], [t[2], t[3]]].filter(([a, b]) => a || b).map(([a, b]) => (a || '?') + '–' + (b || '?')).join(' y ')}</b>). ¿En qué días lo repito?</>
          : <>Los turnos de <b>{conHoras.length + (conHoras.length === 1 ? ' persona' : ' personas')}</b> del {dia}. ¿En qué días los repito?</>}
      </p>
      <div className="atajos">
        {[['siguientes', 'Días siguientes'], ['todos', 'Toda la semana'], ['laborables', 'Lun a vie'], ['finde', 'Sáb y dom'], ['ninguno', 'Ninguno']].map(([k, txt]) => (
          <button key={k} onClick={() => setDias(new Set(grupos[k].filter((x) => x !== diaActivo)))}>{txt}</button>
        ))}
      </div>
      <div className="dias-hoja">
        {DIAS_CORTOS.map((l, i) => {
          const origen = i === diaActivo;
          const ocupado = !origen && conHoras.some((id) => sem[id] && sem[id][i].some(Boolean));
          return (
            <button key={i} className={dias.has(i) ? 'sel' : ''} disabled={origen}
              onClick={() => setDias((prev) => { const s = new Set(prev); if (s.has(i)) s.delete(i); else s.add(i); return s; })}>
              <span>{l}</span><b>{sumarDias(lunes, i).getDate()}</b><em>{origen ? 'este' : ocupado ? 'con horas' : ''}</em>
            </button>
          );
        })}
      </div>
      <p className="nota-hoja">Si esos días ya tenían horas, se cambian por estas. Podrás deshacerlo.</p>
      <div className="acciones">
        <button className="btn principal" disabled={!n} style={{ opacity: n ? undefined : 0.5 }} onClick={aplicar}>{n ? 'Repetir en ' + n + (n === 1 ? ' día' : ' días') : 'Elige al menos un día'}</button>
        <button className="btn secundario" onClick={() => cerrarPanel()}>Cancelar</button>
      </div>
    </>
  );
}
