// Estado de la pantalla (no se guarda): dónde está cada uno, mensajes y ventanas abiertas.
import type { ReactNode } from 'react';
import { create } from 'zustand';
import { usarAlmacen } from '../datos/almacen';
import { claveSemana, lunesDe, sumarDias } from '../dominio/fechas';
import type { Datos } from '../datos/tipos';

export type Vista = 'inicio' | 'rellenar' | 'cuadro' | 'stock' | 'mihorario' | 'avisos' | 'ajustes' | 'horas' | 'equipo';
const CASA: Vista[] = ['inicio', 'mihorario'];
const SOLO_JEFE: Vista[] = ['inicio', 'rellenar', 'stock', 'horas', 'equipo'];

export const lunesEsta = () => lunesDe(new Date());
export const lunesProxima = () => sumarDias(lunesEsta(), 7);

interface Ui {
  vista: Vista;
  /** Semana que se está preparando o mirando (por defecto la que viene: se prepara el jueves o el viernes). */
  lunes: string;
  diaActivo: number;
  aviso: { texto: string; n: number } | null;
  deshacer: { texto: string; accion: () => void; n: number } | null;
  panel: ReactNode | null;
  subStock: 'lista' | 'hoja' | 'compras' | 'informe';
  enRecuento: boolean;
  ir: (v: Vista, desdeHistorial?: boolean) => void;
  ponerSemana: (lunes: Date) => void;
  ponerDia: (d: number) => void;
  avisar: (texto: string) => void;
  ofrecerDeshacer: (texto: string, accion: () => void) => void;
  abrirPanel: (contenido: ReactNode) => void;
  cerrarPanel: (navegando?: boolean) => void;
  ponerSubStock: (s: 'lista' | 'hoja' | 'compras' | 'informe') => void;
  empezarRecuento: () => void;
  terminarRecuento: () => void;
}

const esEquipo = () => usarAlmacen.getState().datos.cuenta?.rol === 'equipo';

// «Atrás» (gesto o botón de Android): cierra la ventana abierta o vuelve al inicio; desde el inicio, sale.
// El historial nunca guarda más de: inicio → pantalla → ventana. «nivel» = cuántos pasos hay hasta el inicio.
export const usarUi = create<Ui>((set, get) => ({
  vista: esEquipo() ? 'mihorario' : 'inicio',
  lunes: claveSemana(lunesProxima()),
  diaActivo: 0,
  aviso: null,
  deshacer: null,
  panel: null,
  subStock: 'lista',
  enRecuento: false,
  ir: (v, desdeHistorial) => {
    if (esEquipo() && SOLO_JEFE.includes(v)) v = 'mihorario';
    if (!desdeHistorial) {
      const st = history.state || { nivel: 0 };
      if (CASA.includes(v)) {
        if (st.nivel > 0) { history.go(-st.nivel); return; }
      } else if (!st.nivel) history.pushState({ vista: v, nivel: 1 }, '');
      else history.replaceState({ vista: v, nivel: st.nivel }, '');
    }
    set({ vista: v, panel: null, ...(v !== 'stock' ? { enRecuento: false } : {}) });
    window.scrollTo(0, 0);
  },
  ponerSemana: (lunes) => set({ lunes: claveSemana(lunes) }),
  ponerDia: (d) => { set({ diaActivo: d }); window.scrollTo(0, 0); },
  avisar: (texto) => set({ aviso: { texto, n: Date.now() } }),
  ofrecerDeshacer: (texto, accion) => set({ deshacer: { texto, accion, n: Date.now() } }),
  abrirPanel: (contenido) => {
    if (!get().panel) {
      const st = history.state || { vista: get().vista, nivel: 0 };
      history.pushState({ vista: st.vista || get().vista, nivel: (st.nivel || 0) + 1, capa: true }, '');
    }
    set({ panel: contenido });
  },
  // «navegando»: la ventana se cierra para ir a otra pantalla, que ocupa su sitio en el historial.
  cerrarPanel: (navegando) => {
    if (!get().panel) return;
    set({ panel: null });
    if (!navegando && history.state?.capa) history.back();
  },
  ponerSubStock: (sub) => { get().terminarRecuento(); set({ subStock: sub }); },
  // El recuento ocupa su propio paso en el historial: «atrás» lo cancela sin salir de Stock.
  empezarRecuento: () => {
    if (!get().enRecuento) { const st = history.state || {}; history.pushState({ vista: 'stock', nivel: (st.nivel || 0) + 1, recuento: true }, ''); }
    set({ enRecuento: true, subStock: 'lista' });
    window.scrollTo(0, 0);
  },
  terminarRecuento: () => {
    const estaba = get().enRecuento;
    set({ enRecuento: false });
    if (estaba && history.state?.recuento) history.back();
  },
}));

window.addEventListener('popstate', (e) => {
  const st = e.state || { vista: 'inicio', nivel: 0 };
  const ui = usarUi.getState();
  if (!st.capa && ui.panel) usarUi.setState({ panel: null });
  if (ui.enRecuento && !st.recuento) usarUi.setState({ enRecuento: false });
  if ((st.vista || 'inicio') !== ui.vista) ui.ir(st.vista || 'inicio', true);
});
if (!history.state) history.replaceState({ vista: usarUi.getState().vista, nivel: 0 }, '');

/** Cambia los datos y ofrece «Deshacer»: vuelve a dejarlos exactamente como estaban antes del cambio. */
export function cambiarConDeshacer(texto: string, receta: (d: Datos) => void) {
  const antes = usarAlmacen.getState().datos;
  usarAlmacen.getState().cambiar(receta);
  usarUi.getState().ofrecerDeshacer(texto, () => usarAlmacen.getState().reemplazar(antes));
}
