# Marca Kumi

| Archivo | Para qué |
|---|---|
| `logo-1024.png` | Logo con esquinas redondeadas: web, presentaciones, redes |
| `tiendas-1024.png` | Logo cuadrado sin redondear: App Store y Google Play (la tienda pone la forma) |

Los iconos de la app viven en `frontend/public/` (`icon-180`, `icon-192`, `icon-512`, `icon-maskable-512`).

## Paleta: pizarra y azafrán

| Nombre | Color | Uso |
|---|---|---|
| Pizarra | `#22303A` | Fondos de marca, cabecera, barra del móvil |
| Pizarra oscura | `#1B252C` | Texto sobre azafrán, fondos profundos |
| Azafrán | `#F2A900` | Botones, acentos, el anillo del logo |
| Azafrán claro | `#FFC94A` | Degradados y brillos |
| Azafrán para texto | `#8A5D00` | Texto azafrán sobre fondo claro (contraste suficiente) |
| Tiza | `#F2F1EC` | Texto sobre pizarra, fondos claros |

Tipografías: Playfair Display cursiva (títulos), Jost (texto), Great Vibes (firma «Kumi»).

En la app, el tema de marca se llama **Kumi Kitchen** (`frontend/src/dominio/temaKumi.ts`) y es el que se usa si el restaurante no elige tipo de cocina. Los demás tipos (sushi, asador…) conservan sus colores.
