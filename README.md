# Kumi

Horarios, horas e inventario para cocinas de restaurante, en el móvil de todo el equipo.

> Estado: en desarrollo. Una cocina real la usa a diario. Lanzamiento previsto: verano de 2027.

## Qué hay en este repositorio

| Carpeta | Qué es |
|---|---|
| `app/` | La app (React + TypeScript + Capacitor para iPhone y Android) |
| `web/` | La web pública con SEO (HTML estático) |
| `firestore.rules` | Reglas de seguridad de la base de datos (Firebase) |
| `firebase.json` | Configuración de Firebase y del emulador |

## Requisitos

- Node 22. Con nvm: `nvm use` en la raíz (lee `.nvmrc`).
- npm.

## Arrancar la app

    cd app
    nvm use
    npm install
    npm run dev

| Comando (dentro de `app/`) | Qué hace |
|---|---|
| `npm run dev` | Abre la app en el navegador mientras programas |
| `npm test` | Pasa las pruebas automáticas |
| `npm run check` | Revisa los tipos de TypeScript |
| `npm run build` | Compila la app para publicarla |

## Probar la nube sin tocar datos reales

Desde la raíz, arranca el emulador de Firebase:

    npx -y firebase-tools@13 emulators:start --only auth,firestore --project kumi-22211

Después abre la app en local añadiendo `?emulador` a la dirección.

## Ver la web

Desde la raíz:

    python3 -m http.server 4491 --directory web

Y abre http://localhost:4491

## Cómo trabajamos

- **Ramas:** `main` es lo publicado. Cada cambio se hace en su propia rama.
- **Commits:** formato `tipo(zona): qué hace`, en español.
  - Tipos: `feat` (algo nuevo), `fix` (arreglo), `refactor` (reorganizar sin cambiar lo que hace), `docs` (documentación), `test` (pruebas).
  - Zonas: `app`, `web`, `shared`, `docs`.
  - Ejemplo: `feat(app): añade el precio a los productos del stock`.
- **Antes de cada commit:** `npm test` y `npm run build` en verde.

## Licencia

Proyecto privado. Todos los derechos reservados.