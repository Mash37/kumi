import { useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { borrarRecuento, corregirRecuento, moverRecuento, nuevoId } from '../datos/acciones';
import type { Producto } from '../datos/tipos';
import { MESES, claveSemana, fechaDeClave } from '../dominio/fechas';
import { htmlHoja, htmlInformeStock } from '../dominio/informes';
import { CATEGORIAS, UNIDADES, cantidadSugerida, cantidadTxt, cifra, columnasHoja, productosEnOrden, recuentosDelDia, comprasDelMes, estadoProducto, euros, fechaCorta, hayQuePedir, informeStock, leerNumero, listaPedir, producto, productosActivos, stockDe } from '../dominio/stock';
import { fuentesListas, imprimir } from '../componentes/archivos';
import { enviarPedidoPdf } from '../componentes/pedido';
import { cambiarConDeshacer, usarUi } from '../estado/ui';
import { tema } from '../tema';

const SUBS = [['lista', 'Stock'], ['hoja', 'Hoja'], ['compras', 'Compras'], ['informe', 'Informe']] as const;

export function Stock() {
  const { subStock, enRecuento, ponerSubStock } = usarUi();
  return (
    <main>
      <section className="vista activa" id="vistaStock">
        <h2>Stock de cocina</h2>
        <div className="segmento">
          {SUBS.map(([k, txt]) => <button key={k} className={subStock === k ? 'activo' : ''} onClick={() => ponerSubStock(k)}>{txt}</button>)}
        </div>
        {subStock === 'lista' && (enRecuento ? <Recuento /> : <Lista />)}
        {subStock === 'hoja' && <Hoja />}
        {subStock === 'compras' && <Compras />}
        {subStock === 'informe' && <InformeStock />}
      </section>
    </main>
  );
}

// Agrupa por categoría, en el orden fijo de CATEGORIAS.
function porCategoria(activos: Producto[]) {
  return CATEGORIAS.map((cat) => [cat, activos.filter((p) => p.categoria === cat)] as const).filter(([, ps]) => ps.length);
}

function Lista() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { avisar, abrirPanel, empezarRecuento } = usarUi.getState();
  const activos = productosActivos(d);
  const t = tema(d.restaurante?.tipo);
  if (!activos.length) {
    return (
      <div className="tarjeta"><h3>Aún no hay productos</h3>
        <p className="sub">Puedes empezar con los productos típicos de un restaurante de tipo «{t.nombre.toLowerCase()}» y ajustarlos después.</p>
        <div className="acciones">
          <button className="btn principal" onClick={() => {
            cambiar((x) => { if (!x.stock) x.stock = { productos: [], compras: [], recuentos: [] }; t.productos.forEach(([nombre, unidad, categoria]) => x.stock!.productos.push({ id: nuevoId(), nombre, unidad, categoria, minimo: null, precio: null })); });
            avisar('Listo. Toca un producto para poner su mínimo');
          }}>Empezar con productos de ejemplo</button>
          <button className="btn secundario" onClick={() => abrirPanel(<PanelProducto id={null} />)}>Añadirlos uno a uno</button>
        </div>
      </div>
    );
  }
  const pedir = listaPedir(d);
  const mandarPedido = () => {
    const hoy = new Date();
    const texto = 'Pedido ' + (d.restaurante?.nombre || 'cocina') + ' · ' + hoy.getDate() + '/' + (hoy.getMonth() + 1) + '\n' +
      pedir.map((x) => '• ' + x.p.nombre + ': pedir ' + cantidadTxt(cantidadSugerida(x.p, x.e.cantidad!), x.p) + ' (quedan ' + cantidadTxt(x.e.cantidad!, x.p) + ')').join('\n');
    if (navigator.share) navigator.share({ text: texto }).catch(() => {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  };
  return (
    <>
      {pedir.length > 0 && (
        <div className="tarjeta pedir">
          <h3>🛒 {pedir.length + (pedir.length === 1 ? ' producto por pedir' : ' productos por pedir')}</h3>
          <ul>{pedir.map((x) => <li key={x.p.id}><b>{x.p.nombre}</b>: quedan {cantidadTxt(x.e.cantidad!, x.p)} (mínimo {cantidadTxt(x.p.minimo!, x.p)})</li>)}</ul>
          <div className="acciones">
            <button className="btn principal" onClick={() => { enviarPedidoPdf(d, tema(d.restaurante?.tipo).cocina).catch(() => avisar('No se pudo crear el PDF del pedido')); }}>Enviar PDF del pedido</button>
            <button className="btn secundario" onClick={mandarPedido}>Enviar por mensaje</button>
          </div>
        </div>
      )}
      <div className="fila-botones">
        <button className="btn principal" onClick={empezarRecuento}>Hacer recuento</button>
        <button className="btn secundario" onClick={() => abrirPanel(<PanelProducto id={null} />)}>+ Producto</button>
      </div>
      <div className="tarjeta">
        {porCategoria(activos).map(([cat, ps]) => (
          <div key={cat}>
            <div className="grupo-stock">{cat}</div>
            {ps.map((p) => {
              const e = estadoProducto(d, p);
              const detalle: string[] = [];
              if (p.minimo != null) detalle.push('mín. ' + cantidadTxt(p.minimo, p));
              if (e.ult) detalle.push('contado ' + fechaCorta(e.ult.ts) + (e.compras ? ' + compras' : ''));
              else if (e.compras) detalle.push('solo compras, sin contar');
              return (
                <div className="producto" key={p.id} onClick={() => abrirPanel(<PanelProducto id={p.id} />)}>
                  <div className="info"><b>{p.nombre}</b><small>{detalle.join(' · ') || 'toca para poner el mínimo'}</small></div>
                  {hayQuePedir(p, e) && <span className="pill">Pedir</span>}
                  <div className="cant">{e.cantidad == null ? <span className="pill gris">Sin contar</span> : <><b>{cifra.format(e.cantidad)}</b><small>{p.unidad}</small></>}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="nota">Lo que queda se calcula con el último recuento más lo comprado después. Haz un recuento cada semana para que sea exacto.</p>
    </>
  );
}

function Recuento() {
  const d = usarAlmacen((s) => s.datos);
  const { avisar, terminarRecuento } = usarUi.getState();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [malos, setMalos] = useState<Set<string>>(new Set());
  const hoyISO = claveSemana(new Date());
  // Se puede apuntar un recuento que se olvidó (por ejemplo, el de fin de mes) con su fecha de verdad.
  const [fecha, setFecha] = useState(hoyISO);
  const [tipo, setTipo] = useState<'semana' | 'mes'>('semana');
  const guardarRecuento = () => {
    const [a, m, dd] = fecha.split('-').map(Number);
    // Hoy: la hora exacta. Otro día: a mediodía de ese día.
    const ts = !a || fecha === claveSemana(new Date()) ? Date.now() : new Date(a, m - 1, dd, 12).getTime();
    const leidos = Object.entries(valores).map(([p, txt]) => [p, leerNumero(txt)] as const).filter(([, v]) => v !== null);
    const erroneos = new Set(leidos.filter(([, v]) => Number.isNaN(v)).map(([p]) => p));
    if (erroneos.size) { setMalos(erroneos); avisar('Revisa las cantidades en rojo'); return; }
    if (!leidos.length) { avisar('No has escrito ninguna cantidad'); return; }
    cambiarConDeshacer('Recuento guardado (' + leidos.length + ')', (x) => {
      if (!x.stock) x.stock = { productos: [], compras: [], recuentos: [] };
      leidos.forEach(([p, v]) => x.stock!.recuentos.push({ id: nuevoId(), p, cant: v as number, ts, ...(tipo === 'mes' ? { tipo: 'mes' as const } : {}) }));
    });
    terminarRecuento();
    window.scrollTo(0, 0);
  };
  return (
    <>
      <div className="tarjeta">
        <h3>Recuento</h3>
        <div className="sub">Escribe lo que hay. Deja vacío lo que no cuentes. Puedes sumar: «14+3».</div>
        <div className="fila-fecha">
          <label className="campo"><span>Fecha</span><input type="date" value={fecha} max={hoyISO} onChange={(e) => setFecha(e.target.value)} /></label>
          <div className="chips-inc">
            <button className={tipo === 'semana' ? 'sel' : ''} onClick={() => setTipo('semana')}>Semanal</button>
            <button className={tipo === 'mes' ? 'sel' : ''} onClick={() => setTipo('mes')}>Fin de mes</button>
          </div>
        </div>
        {porCategoria(productosActivos(d)).map(([cat, ps]) => (
          <div key={cat}>
            <div className="grupo-stock">{cat}</div>
            {ps.map((p) => {
              const e = estadoProducto(d, p);
              return (
                <div className="fila-recuento" key={p.id}>
                  <div><b>{p.nombre}</b><small>{e.cantidad == null ? 'sin datos' : 'antes: ' + cantidadTxt(e.cantidad, p)}</small></div>
                  <input className="numero" inputMode="decimal" placeholder="—" aria-label={'Cantidad de ' + p.nombre} style={malos.has(p.id) ? { borderColor: '#d92d20' } : undefined}
                    value={valores[p.id] ?? ''} onChange={(ev) => setValores((v) => ({ ...v, [p.id]: ev.target.value }))} />
                  <span>{p.unidad}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="acciones">
        <button className="btn principal" onClick={guardarRecuento}>Guardar recuento</button>
        <button className="btn secundario" onClick={terminarRecuento}>Cancelar</button>
      </div>
    </>
  );
}

function Compras() {
  const d = usarAlmacen((s) => s.datos);
  const { abrirPanel } = usarUi.getState();
  const hoy = new Date(), anio = hoy.getFullYear(), mes = hoy.getMonth();
  const lista = stockDe(d).compras.slice().sort((a, b) => b.ts - a.ts).slice(0, 60);
  const delMes = comprasDelMes(d, anio, mes);
  return (
    <>
      <div className="tarjeta"><div className="cifras" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><b>{euros.format(delMes.reduce((s, c) => s + c.coste, 0))}</b><span>compras de {MESES[mes]}</span></div>
        <div><b>{delMes.length}</b><span>entradas este mes</span></div>
      </div></div>
      <div className="acciones"><button className="btn principal" disabled={!productosActivos(d).length} onClick={() => abrirPanel(<PanelCompra />)}>+ Apuntar compra</button></div>
      <div className="tarjeta"><h3>Últimas compras</h3>
        {lista.length ? lista.map((c) => {
          const p = producto(d, c.p) || { nombre: '¿?', unidad: '' };
          return (
            <div className="compra" key={c.id}>
              <div><b>{p.nombre}</b><small>{fechaCorta(c.ts) + ' · ' + cantidadTxt(c.cant, p) + (c.proveedor ? ' · ' + c.proveedor : '')}</small></div>
              <span className="importe">{euros.format(c.coste)}</span>
              <button aria-label="Borrar compra" onClick={() => cambiarConDeshacer('Compra borrada', (x) => { x.stock!.compras = x.stock!.compras.filter((y) => y.id !== c.id); })}>✕</button>
            </div>
          );
        }) : <div className="vacio">Cuando llegue un pedido, apúntalo aquí con lo que costó.</div>}
      </div>
    </>
  );
}

function InformeStock() {
  const d = usarAlmacen((s) => s.datos);
  const [mesStock, setMes] = useState(() => { const h = new Date(); return new Date(h.getFullYear(), h.getMonth(), 1); });
  const anio = mesStock.getFullYear(), mes = mesStock.getMonth();
  const filas = informeStock(d, anio, mes);
  const gasto = filas.reduce((s, f) => s + f.gastado, 0);
  const consumido = filas.reduce((s, f) => s + (f.costeConsumo || 0), 0);
  return (
    <>
      <div className="mes-nav">
        <button aria-label="Mes anterior" onClick={() => setMes(new Date(anio, mes - 1, 1))}>‹</button>
        <div><small>Informe de stock</small><b>{MESES[mes][0].toUpperCase() + MESES[mes].slice(1) + ' ' + anio}</b></div>
        <button aria-label="Mes siguiente" onClick={() => setMes(new Date(anio, mes + 1, 1))}>›</button>
      </div>
      <div className="tarjeta"><div className="cifras" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><b>{euros.format(gasto)}</b><span>gastado en compras</span></div>
        <div><b>{euros.format(consumido)}</b><span>coste de lo consumido</span></div>
      </div></div>
      <div className="tarjeta"><h3>Por producto</h3><div className="sub">Consumo calculado entre recuentos</div>
        {filas.length ? filas.map((f) => (
          <div className="compra" style={{ gridTemplateColumns: '1fr auto' }} key={f.p.id}>
            <div><b>{f.p.nombre}</b><small>{'comprado ' + cantidadTxt(f.comprado, f.p) + ' · consumido ' + (f.conConsumo ? cantidadTxt(f.consumo, f.p) : 'falta un 2.º recuento')}</small></div>
            <span className="importe">{euros.format(f.gastado)}</span>
          </div>
        )) : <div className="vacio">No hay compras ni recuentos en {MESES[mes]}.</div>}
      </div>
      <div className="acciones">
        <button className="btn principal" disabled={!filas.length} onClick={async () => { await fuentesListas(); imprimir('Stock ' + MESES[mes] + ' ' + anio + ' - Kumi', htmlInformeStock(d, anio, mes, new Date(), tema(d.restaurante?.tipo).cocina), true); }}>Guardar PDF del mes</button>
      </div>
      <p className="nota">«Coste de lo consumido» usa el último precio de compra de cada producto. Para que salga, hacen falta dos recuentos en el mes.</p>
    </>
  );
}

function PanelProducto({ id }: { id: string | null }) {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { avisar, cerrarPanel } = usarUi.getState();
  const p = (id && producto(d, id)) || { nombre: '', unidad: 'kg', categoria: 'Otros', minimo: null, precio: null };
  const [f, setF] = useState({ nombre: p.nombre, unidad: p.unidad, categoria: p.categoria, minimo: p.minimo != null ? cifra.format(p.minimo) : '', precio: p.precio != null ? String(p.precio).replace('.', ',') : '' });
  const st = stockDe(d);
  const historial = id ? st.compras.filter((c) => c.p === id).map((c) => ({ ts: c.ts, txt: 'Compra ' + cantidadTxt(c.cant, p) + ' · ' + euros.format(c.coste) }))
    .concat(st.recuentos.filter((r) => r.p === id).map((r) => ({ ts: r.ts, txt: 'Recuento: ' + cantidadTxt(r.cant, p) }))).sort((a, b) => b.ts - a.ts).slice(0, 6) : [];
  const guardar = () => {
    const nombre = f.nombre.trim();
    const minimo = leerNumero(f.minimo), precio = leerNumero(f.precio);
    if (!nombre) { avisar('Ponle un nombre'); return; }
    if (Number.isNaN(minimo) || Number.isNaN(precio)) { avisar('Revisa el mínimo o el precio'); return; }
    const datosP = { nombre, unidad: f.unidad, categoria: f.categoria, minimo, precio };
    cambiar((x) => {
      if (!x.stock) x.stock = { productos: [], compras: [], recuentos: [] };
      if (id) Object.assign(x.stock.productos.find((y) => y.id === id)!, datosP);
      else x.stock.productos.push({ id: nuevoId(), ...datosP });
    });
    cerrarPanel();
  };
  return (
    <>
      <h3>{id ? 'Editar producto' : 'Nuevo producto'}</h3><p className="sub">&nbsp;</p>
      <label className="campo"><span>Nombre</span><input autoFocus={!id} value={f.nombre} placeholder="Ej.: Salmón" onChange={(e) => setF({ ...f, nombre: e.target.value })} /></label>
      <div className="campos-2">
        <label className="campo"><span>Unidad</span><select value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</select></label>
        <label className="campo"><span>Categoría</span><select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></label>
      </div>
      <div className="campos-2">
        <label className="campo"><span>Mínimo para pedir</span><input className="numero" inputMode="decimal" value={f.minimo} placeholder="—" onChange={(e) => setF({ ...f, minimo: e.target.value })} /></label>
        <label className="campo"><span>Precio por unidad (€)</span><input className="numero" inputMode="decimal" value={f.precio} placeholder="—" onChange={(e) => setF({ ...f, precio: e.target.value })} /></label>
      </div>
      <p className="pista-campo">El precio se actualiza solo cada vez que apuntas una compra.</p>
      {historial.length > 0 && <><div className="grupo-stock">Últimos movimientos</div><div className="historial">{historial.map((h, i) => <div key={i}><span>{fechaCorta(h.ts)}</span><span>{h.txt}</span></div>)}</div></>}
      <div className="acciones">
        <button className="btn principal" onClick={guardar}>Guardar</button>
        <button className="btn secundario" onClick={() => cerrarPanel()}>Cancelar</button>
        {id && <button className="btn texto" onClick={() => {
          if (!confirm('¿Quitar «' + p.nombre + '» de la lista? Sus compras siguen contando en los informes.')) return;
          cambiarConDeshacer('Producto quitado', (x) => { x.stock!.productos.find((y) => y.id === id)!.archivado = true; });
          cerrarPanel();
        }}>Quitar este producto</button>}
      </div>
    </>
  );
}

export function PanelCompra() {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const { avisar, cerrarPanel } = usarUi.getState();
  const activos = productosActivos(d);
  const grupos = porCategoria(activos);
  const hoyISO = claveSemana(new Date());
  const [f, setF] = useState({ p: grupos[0]?.[1][0]?.id ?? '', cant: '', coste: '', fecha: hoyISO, proveedor: stockDe(d).ultimoProveedor || '' });
  const p = producto(d, f.p);
  const cant = leerNumero(f.cant);
  const guardar = () => {
    const c = leerNumero(f.cant), coste = leerNumero(f.coste);
    if (!c) { avisar('Escribe la cantidad'); return; }
    if (coste === null || Number.isNaN(coste) || Number.isNaN(c)) { avisar('Escribe el importe total'); return; }
    const [a, m, dd] = f.fecha.split('-').map(Number);
    // Hoy: la hora exacta, para que quede bien ordenada respecto al último recuento. Otro día: a mediodía.
    const fecha = !a || f.fecha === claveSemana(new Date()) ? new Date() : new Date(a, m - 1, dd, 12);
    const proveedor = f.proveedor.trim();
    cambiar((x) => {
      const st = x.stock!;
      st.compras.push({ id: nuevoId(), p: f.p, cant: c, coste, ts: fecha.getTime(), proveedor });
      st.productos.find((y) => y.id === f.p)!.precio = Math.round((coste / c) * 100) / 100;
      if (proveedor) st.ultimoProveedor = proveedor;
    });
    cerrarPanel();
    avisar('Compra guardada');
  };
  return (
    <>
      <h3>Apuntar compra</h3><p className="sub">Lo que ha llegado y lo que ha costado.</p>
      <label className="campo"><span>Producto</span>
        <select value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })}>
          {grupos.map(([cat, ps]) => <optgroup key={cat} label={cat}>{ps.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</optgroup>)}
        </select>
      </label>
      <div className="campos-2">
        <label className="campo"><span>{p ? 'Cantidad (' + p.unidad + ')' : 'Cantidad'}</span><input className="numero" inputMode="decimal" placeholder="—" value={f.cant} onChange={(e) => setF({ ...f, cant: e.target.value })} /></label>
        <label className="campo"><span>Importe total (€)</span><input className="numero" inputMode="decimal" placeholder="—" value={f.coste} onChange={(e) => setF({ ...f, coste: e.target.value })} /></label>
      </div>
      <p className="pista-campo">{p?.precio ? 'Último precio: ' + euros.format(p.precio) + ' / ' + p.unidad + (cant ? ' → unos ' + euros.format(cant * p.precio) : '') : 'Aún no hay precio de este producto.'}</p>
      <div className="campos-2">
        <label className="campo"><span>Fecha</span><input type="date" value={f.fecha} max={hoyISO} onChange={(e) => setF({ ...f, fecha: e.target.value })} /></label>
        <label className="campo"><span>Proveedor (opcional)</span><input placeholder="—" value={f.proveedor} onChange={(e) => setF({ ...f, proveedor: e.target.value })} /></label>
      </div>
      <div className="acciones">
        <button className="btn principal" onClick={guardar}>Guardar compra</button>
        <button className="btn secundario" onClick={() => cerrarPanel()}>Cancelar</button>
      </div>
    </>
  );
}

function Hoja() {
  const d = usarAlmacen((s) => s.datos);
  const { abrirPanel, empezarRecuento } = usarUi.getState();
  const cols = columnasHoja(d);
  const filas = productosEnOrden(d);
  // Al abrirla, se ve el último recuento (a la derecha).
  const alPintar = (el: HTMLDivElement | null) => { if (el) el.scrollLeft = el.scrollWidth; };
  return (
    <>
      <div className="fila-botones">
        <button className="btn principal" onClick={empezarRecuento}>Hacer recuento</button>
        <button className="btn secundario" onClick={() => abrirPanel(<PanelProducto id={null} />)}>+ Producto</button>
      </div>
      <div className="tarjeta"><h3>Hoja de inventario</h3>
        <div className="sub">{cols.length ? 'Cada columna es un recuento. Desliza a la izquierda para ver los anteriores.' : 'Aún no hay recuentos. Toca «Hacer recuento» y aquí irán saliendo las columnas.'}</div>
        <div className="inv-scroll" ref={alPintar}>
          <table className="tabla-inv">
            <thead><tr><th className="nombre">Producto</th>
              {cols.map((c) => <th key={c.k} data-columna={c.k} onClick={() => abrirPanel(<PanelColumna k={c.k} />)}>{c.mes && <small>MES</small>}{new Date(c.ts).getDate() + '/' + (new Date(c.ts).getMonth() + 1)} ✎</th>)}
            </tr></thead>
            <tbody>{filas.map((p) => (
              <tr key={p.id}>
                <td className="nombre" onClick={() => abrirPanel(<PanelProducto id={p.id} />)}>{p.nombre} <small>{p.unidad}</small></td>
                {cols.map((c) => (
                  <td key={c.k} data-celda className={(c.valores[p.id] == null ? 'vacia' : '') + (c.mes ? ' mes' : '')} onClick={() => abrirPanel(<PanelCelda k={c.k} pid={p.id} />)}>
                    {c.valores[p.id] == null ? '—' : cifra.format(c.valores[p.id])}
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {cols.length > 0 && <div className="acciones"><button className="btn secundario" onClick={async () => { await fuentesListas(); imprimir('Inventario - Kumi', htmlHoja(d, new Date(), tema(d.restaurante?.tipo).cocina), true); }}>Guardar PDF de la hoja</button></div>}
      <p className="nota">Toca una fecha (✎) para cambiarla o borrar ese recuento; toca una cantidad para corregirla; toca un producto para cambiarle el nombre. Las columnas «MES» son de fin de mes.</p>
    </>
  );
}

function PanelColumna({ k }: { k: string }) {
  const d = usarAlmacen((s) => s.datos);
  const { avisar, cerrarPanel } = usarUi.getState();
  const rs = recuentosDelDia(d, k);
  const [fecha, setFecha] = useState(k);
  const [tipo, setTipo] = useState<'semana' | 'mes'>(rs.some((r) => r.tipo === 'mes') ? 'mes' : 'semana');
  if (!rs.length) return null;
  const guardar = () => {
    if (!fecha) { avisar('Elige una fecha'); return; }
    const choca = fecha !== k && recuentosDelDia(d, fecha).some((r) => rs.some((m) => m.p === r.p));
    if (choca && !confirm('El ' + fechaCorta(fechaDeClave(fecha).getTime() + 43200000) + ' ya tiene un recuento. Se juntarán y, en los productos repetidos, se quedará esta cantidad. ¿Seguir?')) return;
    cambiarConDeshacer('Recuento cambiado', (x) => moverRecuento(x, k, fecha, tipo, Date.now()));
    cerrarPanel();
  };
  return (
    <>
      <h3>Recuento del {fechaCorta(rs[0].ts)}</h3>
      <p className="sub">{rs.length + (rs.length === 1 ? ' producto contado' : ' productos contados')}.</p>
      <label className="campo"><span>Fecha del recuento</span><input type="date" value={fecha} max={claveSemana(new Date())} onChange={(e) => setFecha(e.target.value)} /></label>
      <div className="chips-inc">
        <button className={tipo === 'semana' ? 'sel' : ''} onClick={() => setTipo('semana')}>Semanal</button>
        <button className={tipo === 'mes' ? 'sel' : ''} onClick={() => setTipo('mes')}>Fin de mes</button>
      </div>
      <div className="acciones">
        <button className="btn principal" onClick={guardar}>Guardar</button>
        <button className="btn secundario" onClick={() => cerrarPanel()}>Cancelar</button>
        <button className="btn texto" onClick={() => {
          if (!confirm('¿Borrar el recuento del ' + fechaCorta(rs[0].ts) + ' (' + rs.length + ' productos)?')) return;
          cambiarConDeshacer('Recuento borrado', (x) => borrarRecuento(x, k));
          cerrarPanel();
        }}>Borrar este recuento</button>
      </div>
    </>
  );
}

function PanelCelda({ k, pid }: { k: string; pid: string }) {
  const d = usarAlmacen((s) => s.datos);
  const { avisar, cerrarPanel } = usarUi.getState();
  const p = producto(d, pid);
  const r = recuentosDelDia(d, k).filter((x) => x.p === pid).sort((a, b) => b.ts - a.ts)[0];
  const [texto, setTexto] = useState(r ? cifra.format(r.cant) : '');
  if (!p) return null;
  const guardar = () => {
    const v = leerNumero(texto);
    if (Number.isNaN(v)) { avisar('Escribe un número, por ejemplo 2,5'); return; }
    cambiarConDeshacer('Cantidad corregida', (x) => corregirRecuento(x, k, pid, v));
    cerrarPanel();
  };
  return (
    <>
      <h3>{p.nombre}</h3>
      <p className="sub">Recuento del {fechaCorta(fechaDeClave(k).getTime() + 43200000)}. Déjalo vacío para quitar esta cantidad.</p>
      <label className="campo"><span>Cantidad ({p.unidad})</span><input className="numero" inputMode="decimal" autoFocus placeholder="—" value={texto} onChange={(e) => setTexto(e.target.value)} /></label>
      <div className="acciones">
        <button className="btn principal" onClick={guardar}>Guardar</button>
        <button className="btn secundario" onClick={() => cerrarPanel()}>Cancelar</button>
      </div>
    </>
  );
}
