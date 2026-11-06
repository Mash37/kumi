import { useEffect, useState } from 'react';

// Sin internet casi todo sigue funcionando (los datos viven en el móvil); solo lo compartido con el equipo espera.
export function SinConexion() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  useEffect(() => {
    const cambiar = () => setEnLinea(navigator.onLine);
    window.addEventListener('online', cambiar);
    window.addEventListener('offline', cambiar);
    return () => { window.removeEventListener('online', cambiar); window.removeEventListener('offline', cambiar); };
  }, []);
  if (enLinea) return null;
  return (
    <div className="sin-conexion" role="status">
      <b>Sin conexión.</b> Lo que apuntas se guarda en este móvil. Publicar, el tablón y fichar esperan a que vuelva internet.
    </div>
  );
}
