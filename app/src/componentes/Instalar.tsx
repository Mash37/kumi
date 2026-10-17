import { useEffect, useState } from 'react';
import { usarUi } from '../estado/ui';

const CLAVE_INSTALAR = 'kumi-instalar-cerrado';
interface PeticionInstalar extends Event { prompt: () => void; userChoice: Promise<unknown> }
let peticion: PeticionInstalar | null = null;
const avisos = new Set<() => void>();
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); peticion = e as PeticionInstalar; avisos.forEach((f) => f()); });
window.addEventListener('appinstalled', () => { peticion = null; avisos.forEach((f) => f()); usarUi.getState().avisar('¡Kumi instalada!'); });

const yaInstalada = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
const esIphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
const esAndroid = /android/i.test(navigator.userAgent);
const leer = () => { try { return localStorage.getItem(CLAVE_INSTALAR); } catch { return null; } };

// Solo en la web: dentro de la app de la tienda ya está instalada y esto no se enseña.
export function Instalar() {
  const [, refrescar] = useState(0);
  useEffect(() => { const f = () => refrescar((n) => n + 1); avisos.add(f); return () => { avisos.delete(f); }; }, []);
  if (yaInstalada() || leer() || !(peticion || esIphone || esAndroid)) return null;
  return (
    <div className="tarjeta instalar" id="tarjetaInstalar">
      <button className="cerrar" aria-label="Cerrar" onClick={() => { try { localStorage.setItem(CLAVE_INSTALAR, '1'); } catch { /* sin acceso */ } refrescar((n) => n + 1); }}>✕</button>
      <h3>Ten Kumi como una app</h3>
      {peticion ? <p>Instálala y aparecerá en tu móvil con su icono, como cualquier otra app. Funciona sin internet.</p>
        : esIphone ? <p>En Safari, toca <b>Compartir</b> y luego <b>«Añadir a pantalla de inicio»</b>. Tendrás su icono como cualquier app y funcionará sin internet.</p>
        : <p>En Chrome, abre el menú <b>⋮</b> y toca <b>«Instalar app»</b> o <b>«Añadir a pantalla de inicio»</b>.</p>}
      {peticion && <button className="btn principal" onClick={async () => { peticion!.prompt(); await peticion!.userChoice.catch(() => {}); peticion = null; refrescar((n) => n + 1); }}>Instalar en el móvil</button>}
    </div>
  );
}
