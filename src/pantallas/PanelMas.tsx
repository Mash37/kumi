import { usarAlmacen } from '../datos/almacen';
import { textoUltimaCopia } from '../dominio/copia';
import { listaPedir, productosActivos } from '../dominio/stock';
import { guardarCopia, recuperarCopia } from '../componentes/copias';
import { usarUi, type Vista } from '../estado/ui';
import { PanelCompra } from './Stock';

// Ventana ＋ : atajos y lo que se usa menos.
export function PanelMas() {
  const d = usarAlmacen((s) => s.datos);
  const ui = usarUi();
  const pedir = productosActivos(d).length ? listaPedir(d).length : 0;
  const n = d.equipo.length;
  const irDesdePanel = (v: Vista) => { ui.cerrarPanel(true); ui.ir(v); };
  const stock = (que: 'compra' | 'recuento') => {
    ui.cerrarPanel(true);
    if (!productosActivos(d).length) { ui.ponerSubStock('lista'); ui.ir('stock'); ui.avisar('Primero añade los productos'); return; }
    ui.ir('stock');
    if (que === 'compra') { ui.ponerSubStock('compras'); ui.abrirPanel(<PanelCompra />); } else ui.empezarRecuento();
  };
  const acceso = (icono: string, titulo: string, sub: string, accion: () => void, activo = false) => (
    <button className={activo ? 'activo' : undefined} onClick={accion}><i>{icono}</i>{titulo}<small>{sub}</small></button>
  );
  return (
    <>
      <h3>¿Qué quieres hacer?</h3><p className="sub">&nbsp;</p>
      <div className="grupo-stock">Apuntar rápido</div>
      <div className="accesos">
        {acceso('🧾', 'Apuntar compra', 'Lo que ha llegado y lo que costó', () => stock('compra'))}
        {acceso('📦', 'Hacer recuento', pedir ? pedir + ' por pedir ahora' : 'Contar lo que queda', () => stock('recuento'))}
      </div>
      <div className="grupo-stock">Más</div>
      <div className="accesos">
        {acceso('🕒', 'Horas del mes', 'Informe en PDF para la nómina', () => irDesdePanel('horas'), ui.vista === 'horas')}
        {acceso('📣', 'Avisos al equipo', 'Tablón con «leído por»', () => irDesdePanel('avisos'), ui.vista === 'avisos')}
        {acceso('👥', 'Tu equipo', n + (n === 1 ? ' persona' : ' personas'), () => irDesdePanel('equipo'), ui.vista === 'equipo')}
        {acceso('⚙️', 'Ajustes', 'Perfil, restaurante, reglas, apariencia…', () => irDesdePanel('ajustes'), ui.vista === 'ajustes')}
      </div>
      <div className="grupo-stock">Tus datos</div>
      <div className="accesos">
        {acceso('💾', 'Guardar copia', textoUltimaCopia(d), () => { ui.cerrarPanel(); guardarCopia(); })}
        {acceso('📂', 'Recuperar copia', 'Desde un archivo guardado', () => { ui.cerrarPanel(); recuperarCopia(); })}
      </div>
      <div className="acciones"><button className="btn secundario" onClick={() => ui.cerrarPanel()}>Cerrar</button></div>
    </>
  );
}
