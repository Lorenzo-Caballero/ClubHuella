// Colores de remera que cada diseño puede usar con contraste y un archivo DTF
// preparado para esa combinación. El backend aplica el mismo mapa.
export const STYLE_SHIRT_COLORS = Object.freeze({
  vogue: ['blanca', 'negra'],
  retro: ['blanca', 'negra'],
  streetwear: ['negra'],
  collage: ['blanca', 'negra'],
  minimal: ['blanca', 'negra'],
  'rap-tee': ['negra'],
});

export const STYLE_DEFAULT_COLOR = Object.freeze({
  vogue: 'blanca',
  retro: 'blanca',
  streetwear: 'negra',
  collage: 'blanca',
  minimal: 'blanca',
  'rap-tee': 'negra',
});

export const shirtColorLabel = (color) => (color === 'negra' ? 'negra' : 'blanca');

export const styleColorOptions = (style) => STYLE_SHIRT_COLORS[style] || [];

export const styleColorAvailability = (style) => {
  const colors = styleColorOptions(style).map(shirtColorLabel);
  if (!colors.length) return '';
  if (colors.length === 1) return `Disponible en remera ${colors[0]}`;
  return `Disponible en remera ${colors[0]} y ${colors[1]}`;
};
