// Light mode friendly distinct palette for initial small numbers
export const LABEL_COLORS = [
  '#0969da', // Blue
  '#cf222e', // Red
  '#1a7f37', // Green
  '#9a6700', // Orange/Brown
  '#8250df', // Purple
  '#bf3989', // Pink
  '#059669', // Emerald
  '#d97706', // Amber
  '#57606a', // Gray
  '#0891b2', // Cyan
  '#4c1d95', // Deep Violet
  '#be185d', // Rose
];

export const MAX_K = 5;

// Hash string to color consistently and distinctly using Golden Angle approximation
export const getColorForLabel = (label: string): string => {
  const num = parseInt(label, 10);
  
  // 1. For small initial integers, use the hand-picked palette for best aesthetics
  if (!isNaN(num) && num >= 0 && num < LABEL_COLORS.length) {
     return LABEL_COLORS[num];
  }
  
  // 2. For generated labels (usually larger integers or complex strings), 
  // use algorithmic generation to ensure uniqueness without collision.
  
  let hash = 0;
  // Simple DJB2-like hash
  for (let i = 0; i < label.length; i++) {
    hash = ((hash << 5) - hash) + label.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  // Use Golden Angle (approx 137.508 degrees) to spread hues maximally apart
  // This ensures that hash(x) and hash(x+1) result in very different colors.
  const goldenAngle = 137.508;
  const hue = Math.abs(hash * goldenAngle) % 360;
  
  // Keep Saturation high (60-75%) and Lightness medium-dark (40-50%) 
  // so white text is always readable.
  const saturation = 65 + (Math.abs(hash) % 15); // 65-80%
  const lightness = 42 + (Math.abs(hash >> 2) % 10); // 42-52%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};