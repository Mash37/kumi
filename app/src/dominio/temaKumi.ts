import type { Tema } from './temas';

// Tema de la marca: pizarra y azafrán. Es el que se usa cuando el restaurante no elige un tipo de cocina.
const PIZARRA = '<svg viewBox="0 0 220 180" aria-hidden="true"><defs><linearGradient id="kMadera" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c98a52"/><stop offset="1" stop-color="#8a5a2b"/></linearGradient><linearGradient id="kPizarra" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f525c"/><stop offset="1" stop-color="#1b252c"/></linearGradient></defs><ellipse cx="110" cy="164" rx="84" ry="9" fill="#0f1519" opacity=".25"/><rect x="22" y="24" width="152" height="114" rx="12" fill="url(#kMadera)"/><rect x="31" y="33" width="134" height="96" rx="6" fill="url(#kPizarra)"/><path d="M44 50 C58 46 72 52 86 48 C96 45 104 49 112 47" fill="none" stroke="#f2f1ec" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/><g fill="none" stroke="#f2f1ec" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"><rect x="44" y="64" width="9" height="9" rx="2"/><rect x="44" y="82" width="9" height="9" rx="2"/><rect x="44" y="100" width="9" height="9" rx="2"/><path d="M62 69 L118 69"/><path d="M62 87 L104 87"/><path d="M62 105 L112 105"/></g><g fill="none" stroke="#f2a900" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M45 68 L48 71 L54 63"/><path d="M45 86 L48 89 L54 81"/></g><rect x="58" y="133" width="26" height="6" rx="3" fill="#f2f1ec"/><g transform="translate(168 122)"><circle r="31" fill="#f2a900"/><circle r="24" fill="#fff6dc"/><g stroke="#22303a" stroke-width="4" stroke-linecap="round"><line x1="0" y1="0" x2="0" y2="-15"/><line x1="0" y1="0" x2="11" y2="6"/></g><circle r="3.5" fill="#22303a"/></g><g fill="#ffc94a"><path d="M28 64 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3z" opacity=".9"/><path d="M196 74 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2z" opacity=".8"/></g></svg>';

export const KUMI_KITCHEN: Tema = {
  nombre: 'Kumi Kitchen', emoji: '👩‍🍳', cocina: 'Cualquier cocina', etiquetaDato: 'Consejo del día',
  colores: {
    rosa: '#2c3e48', coral: '#f2a900', frambuesa: '#22303a', frambuesaOscuro: '#1b252c', medio: '#f2cf73', suave: '#fdf3d6', borde: '#ebe5d6', fondo: '#f7f5ef',
    fondoDeg: 'linear-gradient(180deg, #f9f4e6 0%, #f7f5ef 55%, #f6f6f2 100%)',
    deg: 'linear-gradient(135deg, #ffc94a 0%, #f2a900 100%)',
    degIntenso: 'linear-gradient(150deg, #3f525c 0%, #2c3e48 40%, #22303a 75%, #1b252c 100%)',
    degOscuro: 'linear-gradient(135deg, #1b252c 0%, #3a4a52 100%)',
    brillo1: 'rgba(242, 169, 0, .55)', brillo2: 'rgba(255, 201, 74, .22)', sombra: 'rgba(242, 169, 0, .35)',
    degNoche: 'linear-gradient(90deg, #2c3e48, #1b252c)', degBarra: 'linear-gradient(180deg, #ffd56b, #f2a900 60%, #c98a00)',
    barra: '#22303a', tituloOscuro: '#f2a900', pdfCabecera: '#fbe7b0', anillo: ['#ffc94a', '#f2a900'],
    textoSobreDeg: '#1b252c', rosaOscuro: '#f2a900',
  },
  avatares: ['#2c3e48', '#8a5d00', '#4f6470', '#a8661c', '#1f5b64', '#6b4b00', '#3a4a52', '#9c4f2a'],
  ilustracion: PIZARRA,
  productos: [
    ['Aceite de oliva', 'L', 'Salsas y condimentos'], ['Sal', 'kg', 'Salsas y condimentos'], ['Vinagre', 'L', 'Salsas y condimentos'],
    ['Harina', 'kg', 'Arroz y secos'], ['Arroz', 'kg', 'Arroz y secos'], ['Pasta', 'kg', 'Arroz y secos'],
    ['Tomate', 'kg', 'Verdura y fruta'], ['Cebolla', 'kg', 'Verdura y fruta'], ['Ajo', 'kg', 'Verdura y fruta'], ['Patata', 'kg', 'Verdura y fruta'], ['Limón', 'ud', 'Verdura y fruta'],
    ['Huevos', 'docena', 'Lácteos y huevos'], ['Leche', 'L', 'Lácteos y huevos'], ['Nata', 'L', 'Lácteos y huevos'], ['Mantequilla', 'kg', 'Lácteos y huevos'],
    ['Pollo', 'kg', 'Carnes'],
    ['Papel de cocina', 'rollo', 'Envases y limpieza'], ['Film transparente', 'rollo', 'Envases y limpieza'], ['Guantes', 'caja', 'Envases y limpieza'],
  ],
  datos: [
    ['Mise en place', 'Tener todo cortado, medido y a mano antes del servicio es lo que separa una noche tranquila de una caótica.'],
    ['Primero en entrar, primero en salir', 'Coloca lo nuevo detrás de lo viejo en la cámara: así se gasta antes lo que caduca antes.'],
    ['Etiqueta todo', 'Nombre y fecha en cada recipiente. Ahorra dudas, desperdicio y sustos en una inspección.'],
    ['El libre, con tiempo', 'Publicar el horario con varios días de antelación reduce los cambios de última hora.'],
    ['Limpia mientras cocinas', 'Una tabla y un cuchillo limpios a mitad de servicio valen más que una limpieza larga al final.'],
    ['Cuenta lo que hay, no lo que crees', 'Un recuento real cada semana evita pedir de más y quedarse sin lo importante.'],
    ['Cuchillos afilados', 'Un cuchillo afilado es más seguro que uno sin filo: corta sin resbalar.'],
    ['El equipo, informado', 'Un aviso claro en el tablón ahorra diez preguntas por WhatsApp.'],
    ['Agua y descanso', 'En una cocina caliente, beber agua a menudo ayuda a mantener el ritmo hasta el cierre.'],
    ['Prueba siempre', 'Probar cada elaboración antes de servirla es la última comprobación de calidad.'],
  ],
};
