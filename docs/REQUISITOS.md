# Kumi · Documento de requisitos del sistema (DRS)

| | |
|---|---|
| Versión | 0.2 (borrador) |
| Fecha | 17 de octubre de 2026 |
| Responsable | María Segura (producto) |
| Estado | En revisión: los requisitos marcados «Pendiente» son propuestas, no compromisos |

## 1. Introducción

### 1.1 Propósito
Describir qué debe hacer Kumi, para quién y con qué límites, de forma que cualquier persona que se sume al proyecto (desarrollo, diseño o negocio) entienda el producto sin depender de una conversación.

### 1.2 Alcance
Kumi es una app para **cocinas de restaurante** que reúne en el móvil de todo el equipo:
- el **horario** semanal (turnos, libres, incidencias),
- las **horas** trabajadas del mes,
- el **inventario** (stock, compras y recuentos),
- la **comunicación** del equipo (tablón de avisos),
- y, en próximas versiones, el **fichaje** (registro de jornada).

Se vende **por local**, no por persona. Funciona en el navegador (web), en Android y en iPhone con el mismo código.

### 1.3 Definiciones
| Término | Significado |
|---|---|
| Local / restaurante | La unidad que paga. Tiene un equipo, horarios, stock y tablón propios |
| Turno | Tramo de trabajo de una persona en un día (hasta dos por día: turno 1 y turno 2) |
| Franja / servicio | Periodo del día con un mínimo de personas (por ejemplo, Mediodía 12:00–16:00, mínimo 2) |
| Libre | Día sin turnos marcado como descanso |
| Incidencia | Lo que pasó realmente un día: falta, cambio de horas o cubrir a otra persona |
| Recuento | Cantidad contada de un producto en una fecha. Puede ser semanal o de cierre de mes |
| Fichaje | Registro de entrada y salida real de una persona, con fecha y hora del servidor |
| Corrección | Cambio sobre un fichaje. Nunca borra el original: se añade con motivo y autor |
| Tipo de cocina | Tema visual y datos de ejemplo (Kumi Kitchen, Sushi, Asador…) |

### 1.4 Referencias
- Estatuto de los Trabajadores, art. 34.9: obligación de registro diario de jornada (desde 2019) y conservación durante 4 años.
- Borrador de real decreto de registro de jornada digital (en trámite a octubre de 2026). **Confirmar los requisitos con el texto final publicado en el BOE.**
- Ley Orgánica 3/2018 (LOPDGDD), art. 88: derecho a la desconexión digital.
- Reglamento General de Protección de Datos (RGPD).

## 2. Descripción general

### 2.1 Usuarios y roles
| Rol | Quién es | Qué necesita |
|---|---|---|
| **Dueño** | Quien paga Kumi. Puede tener varios locales | Ver todo, pagar, gestionar encargados, revisar horas y costes, a menudo desde el ordenador |
| **Encargado** | Jefe o jefa de cocina o de sala | Hacer el horario, llevar el stock, revisar fichajes del equipo, desde el móvil |
| **Empleado** | Persona del equipo | Ver su horario, fichar, leer avisos y consultar sus propias horas, desde el móvil |

Hoy la app distingue dos roles en la nube (`jefe` y `equipo`). El paso a tres roles es un requisito pendiente (ver RF-ROL).

### 2.2 Entorno
- **Web** (PWA instalable) en navegadores actuales de móvil, tablet y ordenador.
- **Android** desde la versión 7 (minSdk 24) y **iPhone**, mediante Capacitor.
- **Nube:** Firebase (Firestore como base de datos, Firebase Auth para cuentas), servidores en Europa.
- **Sin conexión:** los datos se guardan primero en el dispositivo; la nube sirve para compartir con el equipo.

### 2.3 Restricciones
- Cumplir el RGPD: datos mínimos, en la UE, con derecho de acceso y borrado.
- **No guardar datos biométricos.** La huella o la cara solo desbloquean el dispositivo; Kumi nunca recibe la huella.
- Los avisos al personal respetan la desconexión digital: solo alrededor de su turno.
- El código es TypeScript estricto, en inglés; los textos de la app, en español.

### 2.4 Supuestos y dependencias
- Cada persona del equipo tiene un móvil propio. (Pendiente de decidir: tablet compartida en la cocina para fichar.)
- El cobro se hace en la web (Stripe), no dentro de la app. **Confirmar las normas de Apple antes de publicar en el App Store.**

## 3. Requisitos funcionales

Prioridad: **Debe** (imprescindible para vender) · **Debería** (importante) · **Podría** (deseable).
Estado: ✅ Hecho · 🟡 Parcial · ⬜ Pendiente.

### 3.1 Horario (RF-HOR)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-HOR-01 | El encargado crea el horario semanal por persona y día, con hasta dos turnos por día | Debe | ✅ |
| RF-HOR-02 | Marcar días libres | Debe | ✅ |
| RF-HOR-03 | Repetir el horario de un día o de la semana anterior | Debería | ✅ |
| RF-HOR-04 | Definir franjas de servicio con su mínimo de personas y avisar si una franja se queda corta | Debe | ✅ |
| RF-HOR-05 | Avisar si alguien incumple descansos o máximos (12 h entre días, 36 h semanales seguidas, 9 h al día, 40 h a la semana) | Debe | ✅ |
| RF-HOR-06 | Registrar incidencias del día: falta con motivo, cambio de horas, cubrir a otra persona | Debe | ✅ |
| RF-HOR-07 | Publicar la semana para que el equipo la vea en su móvil | Debe | ✅ |
| RF-HOR-08 | Cada empleado ve solo su horario y el del equipo, sin poder cambiarlo | Debe | 🟡 Depende de RF-ROL |

### 3.2 Horas (RF-HRS)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-HRS-01 | Sumar las horas de cada persona por semana y por mes, comparadas con su contrato | Debe | ✅ |
| RF-HRS-02 | Informe mensual de horas para la gestoría, imprimible y en PDF | Debe | ✅ |
| RF-HRS-03 | Mantener las horas de quien se dio de baja en los informes pasados | Debe | ✅ |
| RF-HRS-04 | Exportar las horas a Excel o CSV | Debería | ⬜ |

### 3.3 Stock (RF-STK)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-STK-01 | Lista de productos con unidad, categoría, mínimo y precio, ordenada alfabéticamente | Debe | ✅ |
| RF-STK-02 | Registrar compras con cantidad, coste y proveedor | Debe | ✅ |
| RF-STK-03 | Recuentos semanales y de cierre de mes; corregir su fecha, cantidades o borrarlos | Debe | ✅ |
| RF-STK-04 | Hoja de inventario con columnas por fecha y sumas en la casilla («2+3») | Debe | ✅ |
| RF-STK-05 | Lista de productos por pedir según el mínimo, para mandar al proveedor | Debería | ✅ |
| RF-STK-06 | Informe del mes: compras y coste de lo consumido | Debería | ✅ |
| RF-STK-07 | Valor en euros de cada recuento (cantidad × precio) | Debería | ⬜ |
| RF-STK-08 | Enviar el pedido al proveedor como PDF (desde «Compartir») o como mensaje, con la cantidad sugerida: lo que falta para llegar al doble del mínimo | Debería | ✅ |
| RF-STK-09 | Lista de proveedores con nombre, teléfono, correo y notas | Debería | ⬜ |
| RF-STK-10 | Asignar a cada producto el proveedor que lo trae | Debería | ⬜ |
| RF-STK-11 | Pedido separado por proveedor: un PDF o un mensaje para cada uno, con WhatsApp directo a su teléfono si lo tiene | Debería | ⬜ |
| RF-STK-12 | Importar proveedores y productos desde una plantilla (CSV, abre en Excel o Google Sheets) | Podría | ⬜ |

### 3.4 Equipo y comunicación (RF-EQP)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-EQP-01 | Invitar al equipo con un código de restaurante | Debe | ✅ |
| RF-EQP-02 | Tablón de avisos con «leído por» | Debería | ✅ |
| RF-EQP-03 | Dar de baja a una persona sin perder su historia | Debe | ✅ |

### 3.5 Fichaje (RF-FIC) · requisitos según el borrador de norma, a confirmar
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-FIC-01 | Cada persona ficha entrada y salida desde su dispositivo, de forma personal | Debe | ⬜ |
| RF-FIC-02 | La hora del fichaje la pone el **servidor**, no el dispositivo | Debe | ⬜ |
| RF-FIC-03 | Un fichaje **nunca se borra ni se sobrescribe**. Corregirlo añade un registro nuevo con autor, fecha y motivo | Debe | ⬜ |
| RF-FIC-04 | El empleado puede pedir una corrección; el encargado o el dueño la aprueban | Debe | ⬜ |
| RF-FIC-05 | El empleado ve siempre sus fichajes y todas las correcciones | Debe | ⬜ |
| RF-FIC-06 | Comparar fichado contra planificado (llegó tarde, salió antes, horas extra) | Debería | ⬜ |
| RF-FIC-07 | Exportar el registro para la Inspección de Trabajo en un formato legible | Debe | ⬜ |
| RF-FIC-08 | Conservar los registros 4 años | Debe | ⬜ |
| RF-FIC-09 | Fichar sin conexión y enviarlo al recuperarla, guardando la hora real del evento con aviso de que se registró sin conexión | Debería | ⬜ |

### 3.6 Notificaciones (RF-NOT)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-NOT-01 | Avisar al empleado si su turno empezó y no ha fichado (por ejemplo, a los 10 minutos) | Debe | ⬜ |
| RF-NOT-02 | Avisar si terminó el turno y no fichó la salida | Debería | ⬜ |
| RF-NOT-03 | Avisar al encargado de quién no ha fichado | Debería | ⬜ |
| RF-NOT-04 | Avisar de un horario nuevo publicado o de un aviso en el tablón | Debería | ⬜ |
| RF-NOT-05 | No enviar avisos fuera de la ventana del turno ni en días libres (desconexión digital) | Debe | ⬜ |
| RF-NOT-06 | Cada persona puede silenciar los avisos que no son obligatorios | Podría | ⬜ |

### 3.7 Acceso y primera vez (RF-AUT)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-AUT-01 | Bienvenida inicial para crear el restaurante | Debe | ✅ |
| RF-AUT-02 | Unirse a un restaurante con código | Debe | ✅ |
| RF-AUT-03 | Bienvenida distinta para dueño y para empleado, con 3 pantallas que expliquen Kumi | Debería | ⬜ |
| RF-AUT-04 | Iniciar sesión con Google en la web | Debe | ✅ |
| RF-AUT-05 | Iniciar sesión con Google y con Apple en las apps nativas | Debe | ⬜ |
| RF-AUT-06 | Iniciar sesión con correo y contraseña o enlace mágico, para quien no use Google | Debería | ⬜ |
| RF-AUT-07 | Desbloquear la app con huella o cara tras el primer inicio de sesión | Debería | ⬜ |
| RF-AUT-08 | Borrar la cuenta desde la propia app (obligatorio en el App Store) | Debe | ⬜ |

### 3.8 Roles, permisos y registro de cambios (RF-ROL)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-ROL-01 | Tres roles: dueño, encargado y empleado, con los permisos de la tabla de la sección 6 | Debe | ⬜ |
| RF-ROL-02 | Los permisos se comprueban en el servidor (reglas de Firestore o funciones), no solo en la pantalla | Debe | 🟡 Hoy para `jefe` y `equipo` |
| RF-ROL-03 | Registro de cambios: quién cambió qué y cuándo en horarios, fichajes y equipo | Debe | ⬜ |
| RF-ROL-04 | Nadie puede editar ni borrar el historial de otra persona sin dejar rastro | Debe | ⬜ |
| RF-ROL-05 | El dueño gestiona varios locales con una sola cuenta | Debería | ⬜ |

### 3.9 Integraciones (RF-INT)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-INT-01 | Exportar horas, fichajes y stock a Excel o CSV | Debería | ⬜ |
| RF-INT-02 | API con clave por restaurante para que otros programas lean datos de Kumi | Podría | ⬜ |
| RF-INT-03 | Avisos automáticos a otros sistemas (webhooks) cuando ocurre un fichaje o se publica un horario | Podría | ⬜ |

### 3.10 Otros (RF-OTR)
| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-OTR-01 | Copia de seguridad: guardar y recuperar todos los datos del dispositivo en un archivo | Debe | ✅ |
| RF-OTR-02 | Tipos de cocina con sus colores; Kumi Kitchen (pizarra y azafrán) por defecto | Podría | ✅ |
| RF-OTR-03 | Modo claro, oscuro y automático | Debería | ✅ |
| RF-OTR-04 | Vista para ordenador pensada para el dueño (semana completa, varios locales) | Debería | 🟡 Hay vista de tablet |
| RF-OTR-05 | Planes y cobro: Gratis, Equipo mensual y anual, por local | Debe | ⬜ |
| RF-OTR-06 | Web pública con SEO y guías | Debería | 🟡 Preparada, sin publicar |
| RF-OTR-07 | App de Android instalable (APK de prueba; Google Play en la fase de tiendas) | Debe | 🟡 APK de prueba |

## 4. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-01 | Seguridad | Toda escritura en la nube pasa por reglas de seguridad probadas en el emulador. Las claves públicas de Firebase se limitan a los dominios de Kumi |
| RNF-02 | Privacidad | Datos en la UE. Sin datos biométricos. Cada persona puede ver y pedir el borrado de sus datos, salvo los fichajes que la ley obliga a conservar |
| RNF-03 | Sin conexión | Horario, horas y stock funcionan sin internet. Los cambios se sincronizan al volver la conexión |
| RNF-04 | Rendimiento | La app abre en menos de 2 segundos en un móvil de gama media con conexión 4G |
| RNF-05 | Accesibilidad | Contraste de texto de al menos 4,5:1 en modo claro **y oscuro**, en todos los tipos de cocina. Zonas táctiles de al menos 44 px |
| RNF-06 | Compatibilidad | Últimas dos versiones de Chrome, Safari y Firefox; Android 7 o posterior; iOS 16 o posterior |
| RNF-07 | Calidad | TypeScript estricto. Cada PR pasa tipos, pruebas y compilación en el CI. Pruebas e2e con Playwright en los recorridos principales |
| RNF-08 | Mantenibilidad | Código en inglés, documentado en el repositorio; cualquiera puede arrancar el proyecto siguiendo el README |
| RNF-09 | Disponibilidad | Publicación automática al entrar en `main`; sin cortes para quien ya usa la app |
| RNF-10 | Datos | Los datos guardados en el dispositivo nunca se pierden al actualizar la app |

## 5. Modelo de datos

### 5.1 En el dispositivo
Clave `kumi-datos-v1`: equipo, semanas, libres, incidencias, bajas, restaurante, reglas, franjas, stock, cuenta y copia. Definido en `frontend/src/datos/tipos.ts`.

### 5.2 En la nube (Firestore)
```
codigos/{código}                 → enlace del código con su restaurante
restaurantes/{id}                → datos del restaurante
  ├─ miembros/{persona}          → quién forma parte del equipo y con qué rol
  ├─ semanas/{semana}            → horario publicado de cada semana
  └─ avisos/{aviso}              → tablón
       └─ leidos/{persona}       → quién leyó cada aviso
```

### 5.3 Pendiente para el fichaje (propuesta)
```
restaurantes/{id}
  └─ fichajes/{fichaje}          → solo se puede CREAR, nunca editar ni borrar
       · persona, tipo (entrada/salida), horaServidor, horaDispositivo, sinConexion
  └─ correcciones/{corrección}   → solo se puede CREAR
       · fichaje, nuevaHora, motivo, autor, horaServidor, estado (pedida/aprobada/rechazada)
  └─ registroCambios/{cambio}    → solo se puede CREAR: quién, qué, cuándo
```

## 6. Matriz de roles y permisos (objetivo)

| Acción | Dueño | Encargado | Empleado |
|---|---|---|---|
| Pagar y gestionar locales | ✅ | ❌ | ❌ |
| Añadir y quitar encargados | ✅ | ❌ | ❌ |
| Añadir y dar de baja empleados | ✅ | ✅ | ❌ |
| Hacer y publicar el horario | ✅ | ✅ | ❌ |
| Stock y compras | ✅ | ✅ | Solo recuentos, si se le permite |
| Ver fichajes de todo el equipo | ✅ | ✅ | ❌ |
| Corregir un fichaje | Con motivo, queda registrado | Con motivo, queda registrado | Pide la corrección |
| Ver su horario, fichar, leer el tablón | ✅ | ✅ | ✅ |
| Ver sus propios fichajes y correcciones | ✅ | ✅ | ✅ |
| Borrar historial de fichajes | ❌ Nadie | ❌ Nadie | ❌ Nadie |

## 7. Fuera de alcance (por ahora)
- Nóminas y cálculo de salarios.
- Facturación, TPV y cobro a clientes del restaurante.
- Reconocimiento facial o huella guardados en el servidor.
- Gestión de vacaciones con flujo de aprobación (posible versión futura).

## 8. Preguntas abiertas
1. ¿Se permite fichar desde una tablet compartida en la cocina, además del móvil de cada persona?
2. ¿Se exige ubicación al fichar? Si sí, ¿cómo se informa y se limita según el RGPD?
3. ¿Qué formato concreto pedirá la Inspección cuando se publique la norma?
4. ¿El plan gratuito incluye fichaje, o solo los de pago?
5. ¿Cuánto tiempo después del inicio del turno se manda el primer aviso de fichaje?

## 9. Historial
| Versión | Fecha | Cambios |
|---|---|---|
| 0.1 | 17/10/2026 | Primer borrador: estado actual de la app e ideas de fichaje, roles, avisos, acceso, web e integraciones |
| 0.2 | 17/10/2026 | Pedido al proveedor en PDF (hecho); proveedores, pedido por proveedor e importación con plantilla (pendientes); APK de Android |
