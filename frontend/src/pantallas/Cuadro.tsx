import { useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import type { Datos, Turnos } from '../datos/tipos';
import { DIAS, DIAS_CORTOS, claveSemana, fechaDeClave, rango, sumarDias } from '../dominio/fechas';
import { minutosTurnos, semanaTieneDatos, textoHoras } from '../dominio/horas';
import { avisosCobertura, avisosSemana, esLibre, incidenciaDe, nombreCorto, textoIncidencia, VACIO } from '../dominio/horario';
import { turnoCorto } from '../dominio/rellenar';
import { cifra } from '../dominio/stock';
import { dibujarCuadro, nombreArchivo } from '../dominio/cuadro';
import { Avatar } from '../componentes/Avatar';
import { Cabecera } from '../componentes/Cabecera';
import { Publicar } from '../componentes/EnLinea';
import { compartirArchivo, descargar, fuentesListas, imprimir, lienzoAArchivo } from '../componentes/archivos';
import { usarUi } from '../estado/ui';
import { PALETAS, paletaDe } from '../dominio/paletas';
import { Icono } from '../componentes/Icono';

// Lo mismo repetido en varios días va en una sola línea: «Noche: falta gente… · lun, mar, mié».
function diasTxt(dias: number[]) { return dias.length === 7 ? 'todos los días' : dias.map((x) => DIAS[x].slice(0, 3)).join(', '); }

export function Cuadro() {
  const d = usarAlmacen((s) => s.datos);
  const { lunes: clave, ir, ponerDia, avisar } = usarUi();
  const esEquipo = d.cuenta?.rol === 'equipo';
  const lunes = fechaDeClave(clave);
  const [abierto, setAbierto] = useState(false);

  // La imagen ya no se ve en pantalla: se dibuja solo al compartirla o guardarla.
  const dibujar = async () => {
    await fuentesListas();
    const cabecera = getComputedStyle(document.documentElement).getPropertyValue('--pdf-cabecera').trim() || '#eef2f1';
    return dibujarCuadro(document.createElement('canvas'), d, lunes, { titulo: PALETAS[paletaDe(d.restaurante)].profundo, cabecera });
  };
  const archivo = async () => lienzoAArchivo(await dibujar(), nombreArchivo(lunes, 'png'));

  const avisos = avisosSemana(d, lunes);
  const grupos: { que: string; icono: string; dias: number[] }[] = [];
  avisosCobertura(d, lunes).forEach((a) => {
    const g = grupos.find((x) => x.que === a.que);
    if (g) g.dias.push(a.dia!); else grupos.push({ que: a.que!, icono: a.icono!, dias: [a.dia!] });
  });
  const total = grupos.length + avisos.length;
  const verDia = (dia: number) => { ponerDia(dia); ir('rellenar'); };
  const item = (k: string, contenido: React.ReactNode, dia: number | null) => (
    <li key={k} data-ir-dia={dia ?? undefined} onClick={dia != null ? () => verDia(dia) : undefined}>
      <span>{contenido}</span>{dia != null && <b>Ver día ›</b>}
    </li>
  );

  return (
    <>
      <Cabecera conDias={false} />
      <main>
        <section className="vista activa" id="vistaCuadro">
          <div className="cuadro-grid">
            <div>
              {semanaTieneDatos(d.semanas[clave]) || Object.keys(d.libres || {}).some((k) => k >= clave && k <= claveSemana(sumarDias(lunes, 6)))
                ? <TablaSemana d={d} lunes={lunes} alTocar={esEquipo ? null : verDia} />
                : <div className="tarjeta"><h3>Semana sin horario</h3><p className="sub">{esEquipo ? 'Todavía no está publicada.' : 'Rellénala y aquí verás toda la semana de un vistazo.'}</p>
                  {!esEquipo && <div className="acciones"><button className="btn principal" onClick={() => verDia(0)}>Rellenar esta semana</button></div>}</div>}
            </div>
            <div className="cuadro-lado">
              <div className="solo-jefe">
                {total > 0 ? (
                  <details className="revisar" open={abierto} onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}>
                    <summary><i><Icono n="alerta" tam={22} /></i><span><b>{total === 1 ? '1 cosa que revisar' : total + ' cosas que revisar'}</b><small>Toca para verlas antes de enviarlo</small></span></summary>
                    <div className="revisar-cuerpo">
                      {grupos.length > 0 && <><div className="grupo-stock">Gente en cada servicio</div>
                        <ul>{grupos.map((g) => item(g.que, <>{g.que + ' · '}<em>{diasTxt(g.dias)}</em></>, g.dias.length === 1 ? g.dias[0] : null))}</ul></>}
                      {avisos.length > 0 && <><div className="grupo-stock">Descansos y horas</div>
                        <ul>{avisos.map((a, i) => item('a' + i, a.texto, a.dia))}</ul></>}
                      <p className="pista-campo">Las reglas, los servicios y los mínimos se cambian en ＋ → Ajustes.</p>
                    </div>
                  </details>
                ) : semanaTieneDatos(d.semanas[clave]) && (
                  <div className="revisar ok"><i><Icono n="ok" tam={22} /></i><span><b>Todo en orden</b><small>Gente en cada servicio, descansos y horas de contrato.</small></span></div>
                )}
              </div>
              <div className="acciones">
                <button className="btn principal" onClick={async () => {
                  const f = await archivo();
                  try { if ((await compartirArchivo(f, 'Horario ' + rango(lunes, false))) === 'sin-compartir') { descargar(f); avisar('Imagen guardada en descargas'); } }
                  catch { avisar('No se pudo compartir'); }
                }}>Compartir imagen (WhatsApp…)</button>
              </div>
              <details className="mas-opciones">
                <summary>Guardar imagen o PDF</summary>
                <div className="dos-botones">
                  <button className="btn secundario" onClick={async () => { descargar(await archivo()); avisar('Imagen guardada'); }}>Guardar imagen</button>
                  <button className="btn secundario" onClick={async () => imprimir('Horario ' + rango(lunes, false), '<img alt="" src="' + (await dibujar()).toDataURL('image/png') + '">', false)}>Guardar PDF</button>
                </div>
              </details>
              <div className="solo-jefe"><Publicar clave={clave} /></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// La semana en una tabla: una fila por persona, una columna por día. En el móvil se desliza de lado con los nombres fijos.
function TablaSemana({ d, lunes, alTocar }: { d: Datos; lunes: Date; alTocar: ((dia: number) => void) | null }) {
  const clave = claveSemana(lunes);
  const sem = d.semanas[clave] || {};
  const hoy = claveSemana(new Date());
  const dias = DIAS_CORTOS.map((letra, i) => ({ i, letra, fecha: sumarDias(lunes, i) }));
  return (
    <div className="tarjeta tabla-semana">
      <div className="cuadro-scroll">
        <table className="cuadro-tabla">
          <thead>
            <tr>
              <th scope="col" className="quien">Persona</th>
              {dias.map((x) => (
                <th key={x.i} scope="col" className={claveSemana(x.fecha) === hoy ? 'hoy' : undefined}>
                  <span>{x.letra}</span><b>{x.fecha.getDate()}</b>
                </th>
              ))}
              <th scope="col" className="total">Total</th>
            </tr>
          </thead>
          <tbody>
            {d.equipo.map((p) => {
              const turnos: Turnos[] = sem[p.id] ?? Array.from({ length: 7 }, () => VACIO);
              const min = turnos.reduce((s, t) => s + minutosTurnos(t), 0);
              return (
                <tr key={p.id}>
                  <th scope="row" className="quien"><span className="quien-in"><Avatar p={p} /><span>{nombreCorto(p.nombre)}</span></span></th>
                  {dias.map((x) => {
                    const t = turnos[x.i];
                    const libre = esLibre(d, x.fecha, p.id);
                    const inc = incidenciaDe(d, x.fecha, p.id);
                    const lineas = [turnoCorto(t[0], t[1]), turnoCorto(t[2], t[3])].filter(Boolean);
                    const etiqueta = DIAS[x.i] + ': ' + (libre ? 'libre' : lineas.length ? lineas.join(' y ') : 'sin turno') + (inc ? '. ' + textoIncidencia(d, inc, x.fecha, p.id) : '');
                    return (
                      <td key={x.i} className={[claveSemana(x.fecha) === hoy ? 'hoy' : '', libre ? 'libre' : '', !libre && !lineas.length ? 'vacia' : '', inc ? 'con-inc' : ''].filter(Boolean).join(' ') || undefined}
                        title={etiqueta} aria-label={etiqueta} onClick={alTocar ? () => alTocar(x.i) : undefined}>
                        {libre ? 'Libre' : lineas.length ? lineas.map((l, k) => <span key={k}>{l}</span>) : '—'}
                        {inc && <i className={'marca-inc ' + inc.tipo} aria-hidden="true" />}
                      </td>
                    );
                  })}
                  <td className="total">{textoHoras(min)}{p.contrato ? <small>de {cifra.format(p.contrato)}</small> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="pie-tabla">{alTocar ? 'Toca un día para cambiarlo.' : 'Desliza para ver toda la semana.'} Un punto de color marca una incidencia.</p>
    </div>
  );
}
