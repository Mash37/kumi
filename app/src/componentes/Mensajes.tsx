import { useEffect, useState } from 'react';
import { usarUi } from '../estado/ui';

// El mensajito de abajo (2,5 s) y la barra «Deshacer» (10 s).
export function Mensajes() {
  const aviso = usarUi((s) => s.aviso);
  const deshacer = usarUi((s) => s.deshacer);
  const [ver, setVer] = useState(false);
  useEffect(() => {
    if (!aviso) return;
    setVer(true);
    const t = setTimeout(() => setVer(false), 2500);
    return () => clearTimeout(t);
  }, [aviso]);
  useEffect(() => {
    if (!deshacer) return;
    const t = setTimeout(() => usarUi.setState({ deshacer: null }), 10000);
    return () => clearTimeout(t);
  }, [deshacer]);
  return (
    <>
      <div className={'aviso' + (ver ? ' ver' : '')}>{aviso?.texto}</div>
      {deshacer && (
        <div className="deshacer">
          <span>{deshacer.texto}</span>
          <button onClick={() => { deshacer.accion(); usarUi.setState({ deshacer: null }); usarUi.getState().avisar('Deshecho'); }}>Deshacer</button>
        </div>
      )}
    </>
  );
}

export function Panel() {
  const panel = usarUi((s) => s.panel);
  const cerrar = usarUi((s) => s.cerrarPanel);
  useEffect(() => {
    if (!panel) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [panel, cerrar]);
  if (!panel) return null;
  return (
    <div className="hoja-fondo" onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <div className="hoja" role="dialog" aria-modal="true"><div className="asa" />{panel}</div>
    </div>
  );
}
