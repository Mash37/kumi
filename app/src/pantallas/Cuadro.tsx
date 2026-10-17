import { useEffect, useMemo, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { DIAS, fechaDeClave, rango } from '../dominio/fechas';
import { semanaTieneDatos } from '../dominio/horas';
import { avisosCobertura, avisosSemana } from '../dominio/horario';
import { dibujarCuadro, nombreArchivo } from '../dominio/cuadro';
import { Cabecera } from '../componentes/Cabecera';
import { Publicar } from '../componentes/EnLinea';
import { compartirArchivo, descargar, fuentesListas, imprimir, lienzoAArchivo } from '../componentes/archivos';
import { usarUi } from '../estado/ui';
import { tema } from '../tema';

// Lo mismo repetido en varios días va en una sola línea: «Noche: falta gente… · lun, mar, mié».
function diasTxt(dias: number[]) { return dias.length === 7 ? 'todos los días' : dias.map((x) => DIAS[x].slice(0, 3)).join(', '); }

export function Cuadro() {
  const d = usarAlmacen((s) => s.datos);
  const { lunes: clave, ir, ponerDia, avisar } = usarUi();
  const lunes = fechaDeClave(clave);
  const colores = tema(d.restaurante?.tipo).colores;
  const [imagen, setImagen] = useState('');
  const [abierto, setAbierto] = useState(false);
  const lienzo = useMemo(() => document.createElement('canvas'), []);
  const dibujar = async () => { await fuentesListas(); return dibujarCuadro(lienzo, d, lunes, colores); };
  useEffect(() => { let vivo = true; dibujar().then((c) => { if (vivo) setImagen(c.toDataURL('image/png')); }); return () => { vivo = false; }; }, [d, clave, colores]); // eslint-disable-line react-hooks/exhaustive-deps

  const avisos = avisosSemana(d, lunes);
  const grupos: { que: string; icono: string; dias: number[] }[] = [];
  avisosCobertura(d, lunes).forEach((a) => {
    const g = grupos.find((x) => x.que === a.que);
    if (g) g.dias.push(a.dia!); else grupos.push({ que: a.que!, icono: a.icono!, dias: [a.dia!] });
  });
  const total = grupos.length + avisos.length;
  const verDia = (dia: number) => { ponerDia(dia); ir('rellenar'); };
  const item = (clave: string, contenido: React.ReactNode, dia: number | null) => (
    <li key={clave} data-ir-dia={dia ?? undefined} onClick={dia != null ? () => verDia(dia) : undefined}>
      <span>{contenido}</span>{dia != null && <b>Ver día ›</b>}
    </li>
  );
  const archivo = async () => lienzoAArchivo(await dibujar(), nombreArchivo(lunes, 'png'));

  return (
    <>
      <Cabecera conDias={false} />
      <main>
        <section className="vista activa" id="vistaCuadro">
          <div className="cuadro-grid">
            <div>
              {imagen && <img className="cuadro-img" alt="Cuadro de horario de la semana" src={imagen} />}
              <p className="nota">Pellizca la imagen para hacer zoom.</p>
            </div>
            <div className="cuadro-lado">
              <div className="solo-jefe">
                {total > 0 ? (
                  <details className="revisar" open={abierto} onToggle={(e) => setAbierto((e.target as HTMLDetailsElement).open)}>
                    <summary><i>⚠️</i><span><b>{total === 1 ? '1 cosa que revisar' : total + ' cosas que revisar'}</b><small>Toca para verlas antes de enviarlo</small></span></summary>
                    <div className="revisar-cuerpo">
                      {grupos.length > 0 && <><div className="grupo-stock">Gente en cada servicio</div>
                        <ul>{grupos.map((g) => item(g.que, <>{g.icono + ' ' + g.que + ' · '}<em>{diasTxt(g.dias)}</em></>, g.dias.length === 1 ? g.dias[0] : null))}</ul></>}
                      {avisos.length > 0 && <><div className="grupo-stock">Descansos y horas</div>
                        <ul>{avisos.map((a, i) => item('a' + i, a.texto, a.dia))}</ul></>}
                      <p className="pista-campo">Las reglas, los servicios y los mínimos se cambian en ＋ → Ajustes.</p>
                    </div>
                  </details>
                ) : semanaTieneDatos(d.semanas[clave]) && (
                  <div className="revisar ok"><i>✅</i><span><b>Todo en orden</b><small>Gente en cada servicio, descansos y horas de contrato.</small></span></div>
                )}
              </div>
              <div className="acciones">
                <button className="btn principal" onClick={async () => {
                  const f = await archivo();
                  try { if (!(await compartirArchivo(f, 'Horario ' + rango(lunes, false)))) { descargar(f); avisar('Imagen guardada en descargas'); } }
                  catch { avisar('No se pudo compartir'); }
                }}>Compartir imagen (WhatsApp…)</button>
                <div className="dos-botones">
                  <button className="btn secundario" onClick={async () => { descargar(await archivo()); avisar('Imagen guardada'); }}>Guardar imagen</button>
                  <button className="btn secundario" onClick={async () => imprimir('Horario ' + rango(lunes, false), '<img alt="" src="' + (await dibujar()).toDataURL('image/png') + '">', false)}>Guardar PDF</button>
                </div>
              </div>
              <div className="solo-jefe"><Publicar clave={clave} /></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
