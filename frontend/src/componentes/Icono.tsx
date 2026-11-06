// Una sola familia de iconos de línea (24×24, trazo 1,8): sustituyen a los emojis, que se veían distintos en cada móvil.
const TRAZOS = {
  compra: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  recuento: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M9 13l2 2 4-4',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  fichaje: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5h4M3 3l3 3M21 3l-3 3',
  avisos: 'M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12',
  equipo: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6',
  ajustes: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  guardar: 'M12 3v12M7 10l5 5 5-5M4 19h16',
  recuperar: 'M12 15V3M7 8l5-5 5 5M4 19h16',
  alerta: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  ok: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6',
  carrito: 'M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01',
  papelera: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6',
  sol: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  luna: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
  servicio: 'M4 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 13v8M18 21V3c-2 1-3 4-3 7v3h3',
  enviar: 'M21 3L10 14M21 3l-7 18-4-7-7-4z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  nuevo: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  falta: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6',
  cubre: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 11-3.3M19 14v6M16 17h6',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ n, tam = 20 }: { n: NombreIcono; tam?: number }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" width={tam} height={tam} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={TRAZOS[n]} />
    </svg>
  );
}
