// Forma de los datos guardados en el móvil (clave «kumi-datos-v1»). La versión 3 lee y escribe
// exactamente lo mismo que la 2, para que nadie pierda su horario al actualizar.

/** Entrada y salida del turno 1, entrada y salida del turno 2 («12:00», o vacío). */
export type Turnos = [string, string, string, string];
/** Por persona, sus 7 días (lunes a domingo). */
export type Semana = Record<string, Turnos[]>;

export interface Persona { id: string; nombre: string; contrato?: number | null }

export type Incidencia =
  | { tipo: 'falta'; motivo: string }
  | { tipo: 'cubre'; a: string; turnos: Turnos }
  | { tipo: 'cambio'; turnos: Turnos };

export interface Franja { id: string; nombre: string; icono: string; desde: string; hasta: string; minimo: number; dias: number[] }

export interface Reglas { entreDias: number; semanal: number; maxDia: number; maxSemana: number }

export interface Producto { id: string; nombre: string; unidad: string; categoria: string; minimo: number | null; precio: number | null; archivado?: boolean }
export interface Compra { id: string; p: string; cant: number; coste: number; ts: number; proveedor?: string }
export interface Recuento { id: string; p: string; cant: number; ts: number; tipo?: 'mes' }
export interface Stock { productos: Producto[]; compras: Compra[]; recuentos: Recuento[]; ultimoProveedor?: string }

export interface Restaurante { persona?: string; nombre?: string; tipo?: string; modo?: 'auto' | 'claro' | 'oscuro' }

export interface Cuenta {
  rol: 'jefe' | 'equipo';
  rid: string;
  codigo: string;
  uid: string;
  personaId?: string | null;
  ultimaPublicacion?: number;
  visto?: number;
  leidos?: string[];
}

export interface Datos {
  equipo: Persona[];
  /** Clave: fecha del lunes («2026-10-19»). */
  semanas: Record<string, Semana>;
  /** Clave: fecha del día; dentro, las personas que libran. */
  libres?: Record<string, Record<string, Turnos>>;
  /** Clave: fecha del día; dentro, lo que pasó con cada persona. */
  incidencias?: Record<string, Record<string, Incidencia>>;
  /** Nombres de quien ya no está en el equipo, para que sus horas pasadas sigan saliendo en los informes. */
  bajas?: Record<string, string>;
  restaurante?: Restaurante;
  reglas?: Partial<Reglas>;
  franjas?: Franja[];
  stock?: Stock;
  inicio?: Partial<Record<'servicio' | 'semana' | 'horas' | 'stock' | 'dato', boolean>>;
  cuenta?: Cuenta;
  /** Por semana publicada: lo que se subió (para saber si hay cambios sin publicar) y cuándo. */
  publicado?: Record<string, { huella: string; cuando: number }>;
  ultimaCopia?: number;
}
