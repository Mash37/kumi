import { useEffect, useState } from 'react';
import { usarAlmacen } from './datos/almacen';
import { Menu } from './componentes/Menu';
import { Mensajes, Panel } from './componentes/Mensajes';
import { usarUi } from './estado/ui';
import { arrancarSesion, sinLeer, usarSesion } from './nube/sesion';
import { usarTema } from './tema';
import { Ajustes } from './pantallas/Ajustes';
import { Avisos } from './pantallas/Avisos';
import { Bienvenida } from './pantallas/Bienvenida';
import { Cuadro } from './pantallas/Cuadro';
import { Equipo } from './pantallas/Equipo';
import { Horas } from './pantallas/Horas';
import { Inicio } from './pantallas/Inicio';
import { MiHorario } from './pantallas/MiHorario';
import { PanelMas } from './pantallas/PanelMas';
import { Rellenar } from './pantallas/Rellenar';
import { Stock } from './pantallas/Stock';
import { Unirse } from './pantallas/Unirse';

const PANTALLAS = { inicio: Inicio, rellenar: Rellenar, cuadro: Cuadro, horas: Horas, stock: Stock, equipo: Equipo, ajustes: Ajustes, mihorario: MiHorario, avisos: Avisos } as const;
// Un enlace de invitación (…/?unirse=ABC123) lleva directo a unirse, si este móvil aún no tiene restaurante.
const codigoEnlace = new URLSearchParams(location.search).get('unirse');

export function App() {
  const r = usarAlmacen((s) => s.datos.restaurante);
  const esEquipo = usarAlmacen((s) => s.datos.cuenta?.rol === 'equipo');
  const vista = usarUi((s) => s.vista);
  usarSesion((s) => s.avisos);
  usarAlmacen((s) => s.datos.cuenta?.leidos);
  const [unirse, setUnirse] = useState<string | null>(!r && codigoEnlace ? codigoEnlace : null);
  usarTema(r?.tipo, r?.modo);
  useEffect(() => { document.body.classList.toggle('modo-equipo', esEquipo); }, [esEquipo]);
  const conectado = usarAlmacen((s) => !!s.datos.cuenta);
  useEffect(() => { if (conectado) arrancarSesion(); }, [conectado]);
  // Ya dentro de un equipo, el enlace de invitación deja de contar: si luego sale, vuelve a la bienvenida.
  useEffect(() => { if (esEquipo) setUnirse(null); }, [esEquipo]);
  useEffect(() => { if (esEquipo && !['mihorario', 'avisos', 'cuadro', 'ajustes'].includes(vista)) usarUi.setState({ vista: 'mihorario' }); }, [esEquipo, vista]);

  if (unirse !== null && !esEquipo) return <><Unirse codigoInicial={unirse} volver={() => setUnirse(null)} /><Mensajes /></>;
  if (!r) return <><Bienvenida soyEquipo={() => setUnirse('')} /><Mensajes /></>;
  const Pantalla = PANTALLAS[vista];
  return (
    <>
      <Pantalla />
      <Menu vista={vista} ir={usarUi.getState().ir} abrirMas={() => usarUi.getState().abrirPanel(<PanelMas />)} sinLeer={sinLeer().length} />
      <Mensajes />
      <Panel />
    </>
  );
}
