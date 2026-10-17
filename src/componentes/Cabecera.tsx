import { usarAlmacen } from '../datos/almacen';
import { DIAS_CORTOS, claveSemana, fechaDeClave, rango, sumarDias } from '../dominio/fechas';
import { avisosCobertura, avisosSemana } from '../dominio/horario';
import { lunesEsta, lunesProxima, usarUi } from '../estado/ui';

// Semana que se mira, con flechas; en Rellenar, también los 7 días para elegir uno.
export function Cabecera({ conDias }: { conDias: boolean }) {
  const d = usarAlmacen((s) => s.datos);
  const { lunes: clave, diaActivo, ponerSemana, ponerDia } = usarUi();
  const lunes = fechaDeClave(clave);
  const sem = d.semanas[clave] || {};
  const avisos = conDias ? avisosSemana(d, lunes) : [];
  const cobertura = conDias ? avisosCobertura(d, lunes) : [];
  return (
    <header className="cabecera">
      <div className="semana">
        <button aria-label="Semana anterior" onClick={() => ponerSemana(sumarDias(lunes, -7))}>‹</button>
        <div className="titulo">
          <small>{clave === claveSemana(lunesEsta()) ? 'Esta semana' : clave === claveSemana(lunesProxima()) ? 'Semana que viene' : 'Semana'}</small>
          <b>{rango(lunes, false)}</b>
        </div>
        <button aria-label="Semana siguiente" onClick={() => ponerSemana(sumarDias(lunes, 7))}>›</button>
      </div>
      {conDias && (
        <div className="dias">
          {DIAS_CORTOS.map((letra, i) => {
            const trabajan = d.equipo.filter((p) => sem[p.id] && sem[p.id][i].some(Boolean)).length;
            const aviso = avisos.some((a) => a.dia === i) || cobertura.some((a) => a.dia === i);
            return (
              <button key={i} className={(i === diaActivo ? 'activo' : '') + (aviso ? ' con-aviso' : '')} onClick={() => ponerDia(i)}>
                <span>{letra}</span><b>{sumarDias(lunes, i).getDate()}</b><i>{trabajan ? '●'.repeat(Math.min(trabajan, 3)) : ''}</i>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
