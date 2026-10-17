import { useEffect, useState } from 'react';
import { usarAlmacen } from '../datos/almacen';
import { nuevoId } from '../datos/acciones';
import { Tipos } from '../componentes/Tipos';
import { usarUi } from '../estado/ui';
import { tema, usarTema } from '../tema';

// Primera vez: nombre, restaurante, tipo de cocina y equipo. Todo se puede cambiar después en Ajustes.
export function Bienvenida({ soyEquipo }: { soyEquipo: () => void }) {
  const d = usarAlmacen((s) => s.datos);
  const cambiar = usarAlmacen((s) => s.cambiar);
  const r = d.restaurante ?? {};
  const [tipo, setTipo] = useState(r.tipo || 'kumi');
  const [persona, setPersona] = useState(r.persona || '');
  const [nombre, setNombre] = useState(r.nombre || '');
  const [equipo, setEquipo] = useState(d.equipo.map((p) => p.nombre).join('\n'));
  usarTema(tipo, r.modo);
  useEffect(() => { document.body.classList.add('en-bienvenida'); window.scrollTo(0, 0); return () => document.body.classList.remove('en-bienvenida'); }, []);
  // El dibujo de la portada y el de la bienvenida comparten ids de degradados: se renombran para que no choquen.
  const ilustracion = tema(tipo).ilustracion.replace(/id="([a-zA-Z]+)"/g, 'id="b$1"').replace(/url\(#([a-zA-Z]+)\)/g, 'url(#b$1)');
  const empezar = () => {
    cambiar((x) => {
      x.restaurante = { persona: persona.trim(), nombre: nombre.trim(), tipo, modo: x.restaurante?.modo || 'auto' };
      if (!x.equipo.length) x.equipo = equipo.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).map((n) => ({ id: nuevoId(), nombre: n }));
    });
    usarUi.getState().avisar('¡Lista! Ya puedes preparar el horario');
  };
  return (
    <section className="bienvenida">
      <div className="portada">
        <div className="barra-sup"><span className="logo-txt">Kumi</span></div>
        <h1>Vamos a preparar tu cocina</h1>
        <p>Te llevará un minuto. Todo se guarda en tu móvil.</p>
        <div className="ilustracion" dangerouslySetInnerHTML={{ __html: ilustracion }} />
      </div>
      <div className="tablero">
        <div className="tarjeta">
          <label className="campo"><span>Tu nombre</span><input placeholder="Ej.: Laura" autoComplete="given-name" value={persona} onChange={(e) => setPersona(e.target.value)} /></label>
          <label className="campo"><span>Nombre del restaurante</span><input placeholder="Ej.: La Brasa de Laura" value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>
        </div>
        <div className="tarjeta">
          <h3>¿Qué tipo de cocina tienes?</h3>
          <div className="sub">Cambia los colores, el dibujo, los productos de ejemplo y los datos curiosos. Se puede cambiar después.</div>
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
