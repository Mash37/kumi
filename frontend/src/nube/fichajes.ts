// Fichajes en directo: se escuchan los meses pedidos y se juntan en una sola lista.
import { useEffect, useState } from 'react';
import type { Fichaje } from '../dominio/fichaje';
import { cargarNube } from '.';

export type EstadoFichajes = { lista: Fichaje[]; listo: boolean; error: boolean };

/** personaId: solo los de esa persona (lo que puede leer alguien del equipo); null = todo el restaurante (la jefa). */
export function usarFichajes(rid: string | undefined, meses: string[], personaId: string | null): EstadoFichajes {
  const [porMes, setPorMes] = useState<Record<string, Fichaje[]>>({});
  const [error, setError] = useState(false);
  const clave = meses.join(',');
  useEffect(() => {
    if (!rid) return;
    let vivo = true;
    const parar: (() => void)[] = [];
    setPorMes({}); setError(false);
    cargarNube().then((nube) => {
      if (!vivo) return;
      meses.forEach((mes) => parar.push(nube.escucharFichajes(rid, mes, personaId,
        (lista) => { if (vivo) setPorMes((x) => ({ ...x, [mes]: lista })); },
        () => { if (vivo) setError(true); })));
    }).catch(() => { if (vivo) setError(true); });
    return () => { vivo = false; parar.forEach((p) => p()); };
  }, [rid, clave, personaId]); // eslint-disable-line react-hooks/exhaustive-deps
  return { lista: meses.flatMap((m) => porMes[m] || []), listo: meses.every((m) => m in porMes), error };
}
