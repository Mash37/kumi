// Lo que en la app de la tienda (iPhone y Android) se hace con piezas nativas en vez de las del navegador.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

export const esNativa = Capacitor.isNativePlatform();

export async function prepararNativa(restaurar: (texto: string) => void, hayDatos: boolean) {
  if (!esNativa) return;
  // Botón «atrás» de Android: igual que el gesto atrás de la web (cierra la ventana o vuelve al inicio); desde el inicio, sale.
  App.addListener('backButton', ({ canGoBack }) => { if (canGoBack && history.state?.nivel > 0) history.back(); else App.exitApp(); });
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  // iOS puede vaciar el almacenamiento web si el móvil se queda sin espacio: si pasa, se recupera de la copia nativa.
  if (!hayDatos) {
    const { value } = await Preferences.get({ key: 'kumi-datos-v1' });
    if (value) restaurar(value);
  }
}
export function copiaNativa(texto: string) {
  if (esNativa) Preferences.set({ key: 'kumi-datos-v1', value: texto }).catch(() => {});
}
