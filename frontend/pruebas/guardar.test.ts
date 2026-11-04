import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Lo que guarda la app en el móvil: que nada se pierda sin avisar y que una copia cancelada no cuente como hecha.
// La pantalla (estado/ui) escucha el botón «Atrás» al cargarse: en las pruebas no hay navegador, se le da uno mínimo.
const navegadorMinimo = () => {
  vi.stubGlobal('window', { addEventListener: () => {}, scrollTo: () => {} });
  vi.stubGlobal('history', { state: {}, replaceState: () => {}, pushState: () => {}, go: () => {} });
};
describe('guardar en el móvil', () => {
  let guardado: string | null;
  let lleno: boolean;
  beforeEach(() => {
    vi.resetModules();
    guardado = null; lleno = false;
    navegadorMinimo();
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: (_: string, v: string) => { if (lleno) throw new Error('QuotaExceededError'); guardado = v; },
    });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('guarda cada cambio', async () => {
    const { usarAlmacen } = await import('../src/datos/almacen');
    usarAlmacen.getState().cambiar((d) => { d.equipo.push({ id: 'p1', nombre: 'Ana' }); });
    expect(JSON.parse(guardado!).equipo[0].nombre).toBe('Ana');
  });

  it('si el móvil no tiene espacio, avisa una vez y no repite el aviso en cada tecla', async () => {
    const { usarAlmacen } = await import('../src/datos/almacen');
    const { usarUi } = await import('../src/estado/ui');
    const avisar = vi.spyOn(usarUi.getState(), 'avisar');
    lleno = true;
    usarAlmacen.getState().cambiar((d) => { d.equipo.push({ id: 'p1', nombre: 'Ana' }); });
    usarAlmacen.getState().cambiar((d) => { d.equipo[0].nombre = 'Ana M'; });
    await vi.waitFor(() => expect(avisar).toHaveBeenCalledTimes(1));
    expect(avisar.mock.calls[0][0]).toMatch(/No se pudo guardar/);
  });
});

describe('guardar copia', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    navegadorMinimo();
  });
  afterEach(() => vi.unstubAllGlobals());

  const compartirQue = (fin: 'compartido' | 'cancelado') => vi.stubGlobal('navigator', {
    canShare: () => true,
    share: async () => { if (fin === 'cancelado') throw Object.assign(new Error('cancelado'), { name: 'AbortError' }); },
  });

  it('si se cancela «Compartir», no la apunta como hecha ni dice «Copia guardada»', async () => {
    compartirQue('cancelado');
    const { guardarCopia } = await import('../src/componentes/copias');
    const { usarAlmacen } = await import('../src/datos/almacen');
    const { usarUi } = await import('../src/estado/ui');
    const avisar = vi.spyOn(usarUi.getState(), 'avisar');
    await guardarCopia();
    expect(usarAlmacen.getState().datos.ultimaCopia).toBeUndefined();
    expect(avisar).not.toHaveBeenCalled();
  });

  it('si se comparte, la apunta y lo dice', async () => {
    compartirQue('compartido');
    const { guardarCopia } = await import('../src/componentes/copias');
    const { usarAlmacen } = await import('../src/datos/almacen');
    const { usarUi } = await import('../src/estado/ui');
    const avisar = vi.spyOn(usarUi.getState(), 'avisar');
    await guardarCopia();
    expect(usarAlmacen.getState().datos.ultimaCopia).toBeTypeOf('number');
    expect(avisar.mock.calls[0][0]).toMatch(/^Copia guardada/);
  });
});
