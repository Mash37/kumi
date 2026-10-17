import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { copiarSemana } from '../datos/acciones';
import { DIAS, DIAS_CORTOS, MESES, claveSemana, rango } from '../dominio/fechas';
import { minutosTurnos, semanaTieneDatos, textoHoras } from '../dominio/horas';
import { cosasQueRevisar, tramosReales } from '../dominio/horario';
import { comprasDelMes, cifra, euros, listaPedir, productosActivos } from '../dominio/stock';
import { Avatar } from '../componentes/Avatar';
import { Instalar } from '../componentes/Instalar';
import { TarjetaTablon } from '../componentes/EnLinea';
import { lunesEsta, lunesProxima, usarUi } from '../estado/ui';
import { tema } from '../tema';

function saludo(h: number) { return h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; }
// El inicio muestra quién está en cocina «ahora»: se actualiza cada minuto.
function usarMinuto() {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 60000); return () => clearInterval(t); }, []);
  return ahora;
}

export function Inicio() {
  const d = usarAlmacen((s) => s.datos);
  const ahora = usarMinuto();
  const r = d.restaurante ?? {};
  const t = tema(r.tipo);
  const ver = { servicio: true, semana: true, horas: true, stock: true, dato: true, ...(d.inicio || {}) };
  const h = ahora.getHours();

  // Hasta las 6:00 sigue contando el servicio de la noche anterior.
  const diaServicio = new Date(ahora.getTime() - 6 * 3600 * 1000);
  const idxServicio = (diaServicio.getDay() + 6) % 7;
  let minAhora = h * 60 + ahora.getMinutes();
  if (h < 6) minAhora += 24 * 60;
  const filas = d.equipo.map((p) => ({ p, tramos: tramosReales(d, diaServicio, p.id) }));
  const trabajan = filas.filter((f) => f.tramos.length);
  const enCocina = trabajan.filter((f) => f.tramos.some(([a, b]) => minAhora >= a && minAhora < b));

  return (
    <section className="vista activa" id="vistaInicio">
      <div className="portada">
        <div className="barra-sup"><span className="logo-txt">Kumi</span><span className="marca">{(r.nombre || t.nombre) + ' · ' + t.cocina}</span></div>
        <div className="saludo">
          <span className="t">{saludo(h) + (r.persona ? ',' : '')}</span>
          <span className="nombre">{r.persona}</span>
        </div>
        <div className="fecha">{DIAS[(ahora.getDay() + 6) % 7] + ', ' + ahora.getDate() + ' de ' + MESES[ahora.getMonth()]}</div>
        <div className="ilustracion" dangerouslySetInnerHTML={{ __html: t.ilustracion }} />
        <div className="ahora">
          <span className={'pulso' + (enCocina.length ? ' vivo' : '')} />
          <span>{enCocina.length ? (enCocina.length === 1 ? '1 persona' : enCocina.length + ' personas') + ' en cocina ahora'
            : trabajan.length ? 'Ahora no hay nadie de turno' : 'Hoy no hay turnos apuntados'}</span>
        </div>
      </div>

      <div className="tablero">
        <Instalar />
        {ver.servicio && (
          <div className="tarjeta" id="tarjetaServicio">
            <h3>El servicio de hoy</h3>
            <div className="sub">{DIAS[idxServicio][0].toUpperCase() + DIAS[idxServicio].slice(1) + ' ' + diaServicio.getDate() + (trabajan.length ? ' · ' + trabajan.length + ' de turno' : '')}</div>
            <LineaHoy filas={filas} trabajan={trabajan} minAhora={minAhora} />
          </div>
        )}
        {ver.semana && <TarjetaSemana />}
        <TarjetaTablon />
        {ver.horas && <TarjetaHoras />}
        {ver.stock && <TarjetaStock />}
        {ver.dato && <TarjetaDato ahora={ahora} />}
        <div className="firma">© {ahora.getFullYear()} · Kumi by <b>Mash</b></div>
      </div>
    </section>
  );
}

type Fila = { p: { id: string; nombre: string }; tramos: [number, number][] };
function LineaHoy({ filas, trabajan, minAhora }: { filas: Fila[]; trabajan: Fila[]; minAhora: number }) {
  if (!trabajan.length) return <div className="vacio">Aún no hay horario para hoy. Cuando lo rellenes, aquí verás quién entra y a qué hora.</div>;
  const todos = trabajan.flatMap((f) => f.tramos);
  const ini = Math.floor(Math.min(...todos.map((x) => x[0]), 12 * 60) / 60) * 60;
  const fin = Math.ceil(Math.max(...todos.map((x) => x[1]), 24 * 60) / 60) * 60;
  const pos = (m: number) => ((m - ini) / (fin - ini)) * 100;
  const paso = fin - ini > 12 * 60 ? 240 : 120;
  const eje: number[] = [];
  for (let m = ini; m <= fin; m += paso) eje.push(m);
  const corta = (m: number) => { m %= 1440; return Math.floor(m / 60) + (m % 60 ? ':' + String(m % 60).padStart(2, '0') : ''); };
  const libres = filas.filter((f) => !f.tramos.length);
  return (
    <>
      <div className="linea">
        {minAhora >= ini && minAhora <= fin && <div className="ya" style={{ left: 'calc(116px + (100% - 116px) * ' + pos(minAhora) / 100 + ')' }} />}
        {trabajan.map((f) => (
          <div className="fila-linea" key={f.p.id}>
            <div className="quien"><Avatar p={f.p} /><span>{f.p.nombre.toUpperCase()}</span></div>
            <div className="pista">
              {f.tramos.map(([a, b], i) => (
                <div key={i} className={'tramo' + (a >= 17 * 60 ? ' noche' : '')} style={{ left: pos(a) + '%', width: pos(b) - pos(a) + '%' }}>
                  {b - a >= 180 ? corta(a) + '–' + corta(b) : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="horas-eje">{eje.map((m) => <span key={m} style={{ left: pos(m) + '%' }}>{(m / 60) % 24}h</span>)}</div>
      </div>
      {libres.length > 0 && <div className="libran">Libran: {libres.map((f) => <span key={f.p.id} className="chip">{f.p.nombre.toUpperCase()}</span>)}</div>}
    </>
  );
}

function TarjetaSemana() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { ir, ponerSemana, ponerDia, avisar } = usarUi.getState();
  const lunesP = lunesProxima();
  const prox = d.semanas[claveSemana(lunesP)];
  const porDia = DIAS_CORTOS.map((_, i) => d.equipo.filter((p) => prox && prox[p.id] && prox[p.id][i].some(Boolean)).length);
  const listos = porDia.filter(Boolean).length;
  const maxDia = Math.max(...porDia, 1);
  const anillo = tema(d.restaurante?.tipo).colores.anillo;
  const r = 36, circ = 2 * Math.PI * r;
  const revisar = listos ? cosasQueRevisar(d, lunesP) : 0;
  const preparar = () => { ponerSemana(lunesP); ponerDia(0); ir('rellenar'); };
  return (
    <div className="tarjeta" id="tarjetaSemana">
      <h3>Semana que viene</h3>
      <div className="sub">{'Del ' + rango(lunesP, true)}</div>
      <div className="resumen">
        <div className="anillo">
          <svg width="86" height="86" viewBox="0 0 86 86">
            <defs><linearGradient id="gAnillo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={anillo[0]} /><stop offset="1" stopColor={anillo[1]} /></linearGradient></defs>
            <circle cx="43" cy="43" r={r} fill="none" style={{ stroke: 'var(--rosa-suave)' }} strokeWidth="9" />
            <circle cx="43" cy="43" r={r} fill="none" stroke="url(#gAnillo)" strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - listos / 7)} />
          </svg>
          <div className="cifra"><b>{listos}/7</b><small>días</small></div>
        </div>
        <div className="barras-dias">
          {DIAS_CORTOS.map((l, i) => (
            <div key={l} className={porDia[i] ? 'ok' : ''}><em>{porDia[i] || ''}</em><i style={{ height: porDia[i] ? 14 + (porDia[i] / maxDia) * 40 : 6 }} /><span>{l}</span></div>
          ))}
        </div>
      </div>
      <div className="estado">
        {listos === 0 ? <>Todavía <b>sin empezar</b>. Lo normal es prepararla el jueves o el viernes.</>
          : listos === 7 ? <><b>¡Lista!</b> Todos los días tienen turnos. Ya puedes enviarla.</>
          : <>Vas por <b>{listos} de 7 días</b>. ¡Ya casi!</>}
        {revisar > 0 ? <><br />⚠️ <b>{revisar === 1 ? '1 cosa que revisar' : revisar + ' cosas que revisar'}</b>: míralas en Cuadro antes de enviarla.</>
          : listos > 0 && <><br />✅ Sin avisos: cobertura y descansos bien.</>}
      </div>
      <div className="acciones">
        <button className="btn principal" onClick={preparar}>{listos ? 'Seguir con el horario' : 'Preparar el horario'}</button>
        {!listos && semanaTieneDatos(d.semanas[claveSemana(lunesEsta())]) && (
          <button className="btn secundario" onClick={() => { cambiar((x) => copiarSemana(x, lunesEsta(), lunesP)); avisar('Copiada. Cambia solo lo que sea distinto'); preparar(); }}>Empezar copiando esta semana</button>
        )}
        {listos > 0 && <button className="btn secundario" onClick={() => { ponerSemana(lunesP); ir('cuadro'); }}>Enviar al equipo</button>}
      </div>
    </div>
  );
}

function TarjetaHoras() {
  const d = usarAlmacen((s) => s.datos);
  const prox = d.semanas[claveSemana(lunesProxima())];
  const horas = d.equipo.map((p) => ({ p, min: prox && prox[p.id] ? prox[p.id].reduce((s, t) => s + minutosTurnos(t), 0) : 0 }));
  const max = Math.max(...horas.map((x) => x.min), 1);
  return (
    <div className="tarjeta" id="tarjetaHoras">
      <h3>Horas de cada uno</h3>
      <div className="sub">Semana que viene, sumando todos los turnos</div>
      {horas.some((x) => x.min) ? horas.map((x) => (
        <div className="horas-fila" key={x.p.id}>
          <Avatar p={x.p} /><b>{x.p.nombre.toUpperCase()}</b>
          <div className="barra"><i style={{ width: (x.min / max) * 100 + '%' }} /></div>
          <span>{textoHoras(x.min).replace(' h', '') + (x.p.contrato ? '/' + cifra.format(x.p.contrato) : '') + ' h'}</span>
        </div>
      )) : <div className="vacio">Aparecerán cuando rellenes la semana.</div>}
      <div className="acciones" style={{ marginTop: 14 }}><button className="btn secundario" onClick={() => usarUi.getState().ir('horas')}>Ver el informe del mes para nómina</button></div>
    </div>
  );
}

function TarjetaStock() {
  const d = usarAlmacen((s) => s.datos);
  const hoy = new Date();
  const activos = productosActivos(d);
  const pedir = activos.length ? listaPedir(d) : [];
  const gasto = comprasDelMes(d, hoy.getFullYear(), hoy.getMonth()).reduce((s, c) => s + c.coste, 0);
  return (
    <div className="tarjeta" id="tarjetaStock">
      <h3>Stock</h3>
      <div className="sub">{activos.length ? 'Compras de ' + MESES[hoy.getMonth()] + ': ' + euros.format(gasto) : 'Nuevo'}</div>
      {!activos.length ? <div className="vacio">Lleva el control de lo que hay en cocina, qué pedir y cuánto se gasta cada mes.</div>
        : pedir.length ? <div className="estado"><b>{pedir.length + (pedir.length === 1 ? ' producto' : ' productos') + ' por pedir:'}</b> {pedir.slice(0, 4).map((x) => x.p.nombre).join(', ') + (pedir.length > 4 ? '…' : '')}</div>
        : <div className="estado">Todo por encima del mínimo. 👌</div>}
      <div className="acciones" style={{ marginTop: 12 }}>
        <button className="btn secundario" onClick={() => usarUi.getState().ir('stock')}>{!activos.length ? 'Empezar con el stock' : pedir.length ? 'Ver qué pedir' : 'Ir al stock'}</button>
      </div>
    </div>
  );
}

function TarjetaDato({ ahora }: { ahora: Date }) {
  const t = tema(usarAlmacen((s) => s.datos.restaurante?.tipo));
  const lista = t.datos;
  if (!lista?.length) return null;
  const n = Math.floor((ahora.getTime() - new Date(ahora.getFullYear(), 0, 0).getTime()) / 86400000) % lista.length;
  const dato = lista[n];
  // En sushi: [japonés, romaji, explicación]; en el resto: [título, explicación] con el emoji del tipo.
  return (
    <div className="tarjeta palabra" id="tarjetaDato">
      <div className="kicker">{t.etiquetaDato}</div>
      <div className="jp">{dato.length === 3 ? dato[0] : t.emoji}</div>
      <div className="romaji">{dato.length === 3 ? dato[1] : dato[0]}</div>
      <p>{dato.length === 3 ? dato[2] : dato[1]}</p>
    </div>
  );
}

