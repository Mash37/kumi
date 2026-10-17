// Informes en PDF: se arman como HTML y el móvil los guarda con «Imprimir → Guardar como PDF».
import type { Datos } from '../datos/tipos';
import { DIAS_ABREV, MESES } from './fechas';
import { horasExactas, informeMes, nombreDe, textoDiaInforme, textoIncidencia, tramosDias } from './horario';
import { cantidadTxt, cifra, columnasHoja, comprasDelMes, euros, fechaCorta, informeStock, producto, productosEnOrden } from './stock';
import { escapar } from './texto';

export function htmlInformeHoras(d: Datos, anio: number, mes: number, hoy: Date, cocina: string): string | null {
  const { filas, sinHorario, ultimo, incidencias } = informeMes(d, anio, mes);
  const conHoras = filas.filter((f) => f.min || f.faltas);
  if (!conHoras.length) return null;
  const suma = (k: 'faltas' | 'min' | 'noche' | 'domingo') => conHoras.reduce((s, f) => s + f[k], 0);
  const nombreMes = MESES[mes] + ' ' + anio;
  const generado = hoy.getDate() + '/' + (hoy.getMonth() + 1) + '/' + hoy.getFullYear();
  return '<div class="inf">' +
    '<div class="inf-marca">Kumi · ' + escapar(d.restaurante?.nombre || cocina) + '</div>' +
    '<h1>Horas trabajadas · ' + nombreMes + '</h1>' +
    '<p class="inf-sub">Del 1 al ' + ultimo + ' de ' + MESES[mes] + ' de ' + anio + ' · Generado el ' + generado + '</p>' +
    '<table><thead><tr><th>Persona</th><th class="n">Contrato</th><th class="n">Días</th><th class="n">Faltas</th><th class="n">Horas totales</th><th class="n">Nocturnas (22–6 h)</th><th class="n">En domingo</th></tr></thead><tbody>' +
    conHoras.map((f) => { const c = d.equipo.find((p) => p.id === f.id)?.contrato; return '<tr><td>' + escapar(f.nombre) + '</td><td class="n">' + (c ? cifra.format(c) + ' h/sem' : '—') + '</td><td class="n">' + f.trabajados + '</td><td class="n">' + (f.faltas || '—') + '</td><td class="n">' + horasExactas(f.min) + '</td><td class="n">' + (f.noche ? horasExactas(f.noche) : '—') + '</td><td class="n">' + (f.domingo ? horasExactas(f.domingo) : '—') + '</td></tr>'; }).join('') +
    '<tr class="suma"><td>Total</td><td class="n"></td><td class="n"></td><td class="n">' + (suma('faltas') || '—') + '</td><td class="n">' + horasExactas(suma('min')) + '</td><td class="n">' + horasExactas(suma('noche')) + '</td><td class="n">' + horasExactas(suma('domingo')) + '</td></tr>' +
    '</tbody></table>' +
    '<p class="inf-nota">Horas según el horario del equipo con las incidencias apuntadas (faltas, cambios y coberturas); no son fichajes. Los turnos que pasan de medianoche cuentan en el día en que empiezan.' +
    (sinHorario.length ? ' Días del mes sin ningún turno apuntado: ' + tramosDias(sinHorario) + '.' : '') + '</p>' +
    (incidencias.length ? '<div class="inf-persona"><h2><span>Incidencias del mes</span><span>' + incidencias.length + '</span></h2>' +
      '<table><thead><tr><th>Fecha</th><th>Persona</th><th>Qué pasó</th><th class="n">Horario</th><th class="n">Hizo</th></tr></thead><tbody>' +
      incidencias.map((x) => '<tr><td>' + DIAS_ABREV[x.idx] + ' ' + x.fecha.getDate() + '/' + (mes + 1) + '</td><td>' + escapar(nombreDe(d, x.id)) + '</td><td>' +
        escapar(textoIncidencia(d, x.inc, x.fecha, x.id)) + '</td><td class="n">' + horasExactas(x.planMin) + '</td><td class="n">' + horasExactas(x.min) + '</td></tr>').join('') +
      '</tbody></table></div>' : '') +
    conHoras.map((f) => '<div class="inf-persona"><h2><span>' + escapar(f.nombre) + '</span><span>' + horasExactas(f.min) + '</span></h2>' +
      '<table><thead><tr><th>Fecha</th><th>Horario</th><th class="n">Horas</th></tr></thead><tbody>' +
      f.dias.map((dia) => '<tr><td>' + DIAS_ABREV[dia.idx] + ' ' + dia.fecha.getDate() + '/' + (mes + 1) + '</td><td>' + escapar(textoDiaInforme(d, dia)) + '</td><td class="n">' + horasExactas(dia.min) + '</td></tr>').join('') +
      '</tbody></table></div>').join('') +
    '<div class="inf-firmas"><div>Responsable de cocina</div><div>Recibido (nóminas)</div></div>' +
    '</div>';
}

export function htmlInformeStock(d: Datos, anio: number, mes: number, hoy: Date, cocina: string): string {
  const filas = informeStock(d, anio, mes);
  const nombreMes = MESES[mes] + ' ' + anio;
  const gasto = filas.reduce((s, f) => s + f.gastado, 0);
  const consumido = filas.reduce((s, f) => s + (f.costeConsumo || 0), 0);
  const compras = comprasDelMes(d, anio, mes).sort((a, b) => a.ts - b.ts);
  return '<div class="inf"><div class="inf-marca">Kumi · ' + escapar(d.restaurante?.nombre || cocina) + '</div>' +
    '<h1>Stock y compras · ' + nombreMes + '</h1>' +
    '<p class="inf-sub">Del 1 al ' + new Date(anio, mes + 1, 0).getDate() + ' de ' + MESES[mes] + ' de ' + anio + ' · Generado el ' + hoy.getDate() + '/' + (hoy.getMonth() + 1) + '/' + hoy.getFullYear() + '</p>' +
    '<table><thead><tr><th>Producto</th><th class="n">Comprado</th><th class="n">Gastado</th><th class="n">Consumido</th><th class="n">Coste consumo</th></tr></thead><tbody>' +
    filas.map((f) => '<tr><td>' + escapar(f.p.nombre) + '</td><td class="n">' + cantidadTxt(f.comprado, f.p) + '</td><td class="n">' + euros.format(f.gastado) + '</td><td class="n">' +
      (f.conConsumo ? cantidadTxt(f.consumo, f.p) : '—') + '</td><td class="n">' + (f.costeConsumo != null ? euros.format(f.costeConsumo) : '—') + '</td></tr>').join('') +
    '<tr class="suma"><td>Total</td><td class="n"></td><td class="n">' + euros.format(gasto) + '</td><td class="n"></td><td class="n">' + euros.format(consumido) + '</td></tr></tbody></table>' +
    '<p class="inf-nota">El consumo se calcula entre recuentos: lo que había + lo que se compró − lo que quedaba. El coste del consumo usa el último precio de compra.</p>' +
    (compras.length ? '<div class="inf-persona"><h2><span>Compras del mes</span><span>' + euros.format(gasto) + '</span></h2><table><thead><tr><th>Fecha</th><th>Producto</th><th>Proveedor</th><th class="n">Cantidad</th><th class="n">Importe</th></tr></thead><tbody>' +
      compras.map((c) => { const p = producto(d, c.p) || { nombre: '¿?', unidad: '' }; return '<tr><td>' + fechaCorta(c.ts) + '</td><td>' + escapar(p.nombre) + '</td><td>' + escapar(c.proveedor || '—') + '</td><td class="n">' + cantidadTxt(c.cant, p) + '</td><td class="n">' + euros.format(c.coste) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' : '') +
    '<div class="inf-firmas"><div>Responsable de cocina</div><div>Revisado</div></div></div>';
}

// La hoja de inventario en papel: los últimos 8 recuentos, uno por columna.
export function htmlHoja(d: Datos, hoy: Date, cocina: string): string {
  const cols = columnasHoja(d).slice(-8);
  return '<div class="inf"><div class="inf-marca">Kumi · ' + escapar(d.restaurante?.nombre || cocina) + '</div><h1>Inventario</h1>' +
    '<p class="inf-sub">Últimos ' + cols.length + ' recuentos · Generado el ' + hoy.getDate() + '/' + (hoy.getMonth() + 1) + '/' + hoy.getFullYear() + '</p>' +
    '<table><thead><tr><th>Producto</th><th>Unidad</th>' + cols.map((c) => { const f = new Date(c.ts); return '<th class="n">' + f.getDate() + '/' + (f.getMonth() + 1) + (c.mes ? ' (mes)' : '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
    productosEnOrden(d).map((p) => '<tr><td>' + escapar(p.nombre) + '</td><td>' + p.unidad + '</td>' + cols.map((c) => '<td class="n">' + (c.valores[p.id] == null ? '' : cifra.format(c.valores[p.id])) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table><div class="inf-firmas"><div>Responsable de cocina</div><div>Revisado</div></div></div>';
}
