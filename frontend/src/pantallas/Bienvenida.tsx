import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { nuevoId } from '../datos/acciones';
import { Paletas } from '../componentes/Paletas';
import { Tipos } from '../componentes/Tipos';
import { paletaDe, type ClavePaleta } from '../dominio/paletas';
import { usarUi } from '../estado/ui';
import { usarTema } from '../tema';

// Primera vez: nombre, restaurante, tema de color, tipo de cocina y equipo. Todo se puede cambiar después en Ajustes.
export function Bienvenida({ soyEquipo }: { soyEquipo: () => void }) {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const r = d.restaurante ?? {};
  const [tipo, setTipo] = useState(r.tipo || 'kumi');
  const [color, setColor] = useState<ClavePaleta>(paletaDe(r));
  const [persona, setPersona] = useState(r.persona || '');
  const [nombre, setNombre] = useState(r.nombre || '');
  const [equipo, setEquipo] = useState(d.equipo.map((p) => p.nombre).join('\n'));
  usarTema(color, r.modo);
  useEffect(() => { document.body.classList.add('en-bienvenida'); window.scrollTo(0, 0); return () => document.body.classList.remove('en-bienvenida'); }, []);
  const empezar = () => {
    cambiar((x) => {
      x.restaurante = { persona: persona.trim(), nombre: nombre.trim(), tipo, tema: color, modo: x.restaurante?.modo || 'auto' };
      if (!x.equipo.length) x.equipo = equipo.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).map((n) => ({ id: nuevoId(), nombre: n }));
    });
    usarUi.getState().avisar('¡Lista! Ya puedes preparar el horario');
  };
  return (
    <section className="bienvenida">
      <div className="portada">
        <div className="barra-sup"><span className="logo-txt">kumi</span></div>
        <h1>Vamos a preparar tu cocina</h1>
        <p>Te llevará un minuto. Todo se guarda en tu móvil.</p>
      </div>
      <div className="tablero">
        <div className="tarjeta">
          <label className="campo"><span>Tu nombre</span><input placeholder="Ej.: Laura" autoComplete="given-name" value={persona} onChange={(e) => setPersona(e.target.value)} /></label>
          <label className="campo"><span>Nombre del restaurante</span><input placeholder="Ej.: La Brasa de Laura" value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
        </div>
        <div className="tarjeta">
          <h3>Colores de tu app</h3>
          <div className="sub">Se puede cambiar después.</div>
          <Paletas sel={color} elegir={setColor} />
        </div>
        <div className="tarjeta">
          <h3>¿Qué tipo de cocina tienes?</h3>
          <div className="sub">Para los productos de ejemplo y el dato del día.</div>
          <Tipos sel={tipo} elegir={setTipo} />
        </div>
        <div className="tarjeta">
          <h3>Tu equipo</h3>
          <div className="sub">Escribe un nombre por línea. Se puede cambiar después.</div>
          <label className="campo"><textarea rows={5} placeholder={'Ana\nLuis\nMarta'} value={equipo} onChange={(e) => setEquipo(e.target.value)} /></label>
        </div>
        <div className="acciones"><button className="btn principal" onClick={empezar}>Empezar</button></div>
        <div className="acciones" style={{ marginTop: 0 }}><button className="btn secundario" onClick={soyEquipo}>Soy del equipo: tengo un código</button></div>
      </div>
    </section>
  );
}
