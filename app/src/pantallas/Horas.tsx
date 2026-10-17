import { useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { DIAS_ABREV, MESES } from '../dominio/fechas';
import { horasExactas, informeMes, textoDiaInforme, tramosDias } from '../dominio/horario';
import { htmlInformeHoras } from '../dominio/informes';
import { iniciales } from '../dominio/personas';
import { cifra } from '../dominio/stock';
import { fuentesListas, imprimir } from '../componentes/archivos';
import { usarUi } from '../estado/ui';
import { tema } from '../tema';

// Los primeros días del mes se suele preparar la nómina del mes anterior.
function mesInicial() { const h = new Date(); return h.getDate() <= 7 ? new Date(h.getFullYear(), h.getMonth() - 1, 1) : new Date(h.getFullYear(), h.getMonth(), 1); }

export function Horas() {
  const d = usarAlmacen((s) => s.datos);
  const { ir, avisar } = usarUi.getState();
  const [mesInforme, setMes] = useState(mesInicial);
  const anio = mesInforme.getFullYear(), mes = mesInforme.getMonth();
  const t = tema(d.restaurante?.tipo);
  const { filas, sinHorario, ultimo } = informeMes(d, anio, mes);
  const total = filas.reduce((s, f) => s + f.min, 0);
  const mover = (n: number) => setMes(new Date(anio, mes + n, 1));

  return (
    <main>
      <section className="vista activa" id="vistaHoras">
        <button className="volver" onClick={() => ir('inicio')}><span>‹</span> Inicio</button>
        <div className="mes-nav">
          <button aria-label="Mes anterior" onClick={() => mover(-1)}>‹</button>
          <div><small>Informe de horas</small><b>{MESES[mes][0].toUpperCase() + MESES[mes].slice(1) + ' ' + anio}</b></div>
          <button aria-label="Mes siguiente" onClick={() => mover(1)}>›</button>
        </div>
        <div className="tarjeta"><div className="cifras">
          <div><b>{horasExactas(total).replace(' min', '′')}</b><span>horas del equipo</span></div>
          <div><b>{filas.filter((f) => f.min).length}</b><span>personas con turnos</span></div>
          <div><b>{ultimo - sinHorario.length + '/' + ultimo}</b><span>días con horario</span></div>
        </div></div>
        {sinHorario.length > 0 && sinHorario.length < ultimo && (
          <div className="alerta">⚠️ <b>{sinHorario.length + (sinHorario.length === 1 ? ' día' : ' días') + ' sin ningún turno'}</b> ({tramosDias(sinHorario)}). Si se trabajó esos días, falta rellenarlos para que la nómina salga bien.</div>
        )}
        <div className="tarjeta">
          <h3>Por persona</h3>
          <div className="sub">Toca a alguien para ver sus días</div>
          {!total ? <div className="vacio">No hay turnos apuntados en {MESES[mes]}.</div> : filas.map((f) => {
            const i = d.equipo.findIndex((p) => p.id === f.id);
            const persona = d.equipo[i];
            const extras = [f.trabajados + (f.trabajados === 1 ? ' día' : ' días')];
            if (persona?.contrato) extras.push('contrato ' + cifra.format(persona.contrato) + ' h/sem');
            if (f.faltas) extras.push(f.faltas + (f.faltas === 1 ? ' falta' : ' faltas'));
            if (f.coberturas) extras.push('cubrió ' + f.coberturas);
            if (f.noche) extras.push(horasExactas(f.noche) + ' noche');
            if (f.domingo) extras.push(horasExactas(f.domingo) + ' domingo');
            return (
              <details className="persona-mes" key={f.id}>
                <summary>
                  <span className="avatar" style={{ background: i >= 0 ? t.avatares[i % t.avatares.length] : '#b3a9b1' }}>{iniciales(d, f.nombre.replace(' (baja)', ''))}</span>
                  <span className="quien"><b>{f.nombre}</b><small>{extras.join(' · ')}</small></span>
                  <span className={'total' + (f.min ? '' : ' cero')}>{horasExactas(f.min)}</span>
                </summary>
                {f.dias.length > 0 && (
                  <div className="detalle-mes">
                    {f.dias.map((dia, k) => (
                      <div key={k}><span>{DIAS_ABREV[dia.idx] + ' ' + dia.fecha.getDate()}</span><span style={dia.inc ? { color: 'var(--frambuesa)' } : undefined}>{textoDiaInforme(d, dia)}</span><span>{horasExactas(dia.min)}</span></div>
                    ))}
                  </div>
                )}
              </details>
            );
          })}
        </div>
        <div className="acciones">
          <button className="btn principal" onClick={async () => {
            const html = htmlInformeHoras(d, anio, mes, new Date(), t.cocina);
            if (!html) { avisar('No hay turnos apuntados este mes'); return; }
            await fuentesListas();
            imprimir('Horas ' + MESES[mes] + ' ' + anio + ' - Kumi', html, true);
          }}>Guardar PDF para nómina</button>
        </div>
        <p className="nota">Son las horas del horario más las incidencias apuntadas (faltas, cambios y coberturas), no las fichadas. Si alguien faltó o hizo otras horas, apúntalo en «Rellenar» con «¿Qué pasó?».</p>
      </section>
    </main>
  );
}
