/**
 * Self-contained Code 128 (Subset B) SVG Barcode Generator
 * Generates crisp, scalable vector barcodes with zero external runtime dependencies.
 */

// Code 128 pattern widths (b1, s1, b2, s2, b3, s3)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112', // 100-106 (106 is STOP pattern: 2331112)
];

const START_B = 104;
const STOP = 106;

export function generateCode128Svg(
  text: string,
  options?: {
    height?: number;
    barWidth?: number;
    includeText?: boolean;
  },
): string {
  const height = options?.height ?? 50;
  const barWidth = options?.barWidth ?? 2;
  const includeText = options?.includeText ?? true;

  // Filter text to ASCII 32..126
  const cleanText = text.replace(/[^\x20-\x7E]/g, '');
  if (!cleanText) return '';

  const codes: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP);

  // Convert codes to pattern sequence
  let patternStr = '';
  for (const code of codes) {
    patternStr += CODE128_PATTERNS[code] || '';
  }

  let totalModules = 0;
  for (let i = 0; i < patternStr.length; i++) {
    totalModules += parseInt(patternStr[i], 10);
  }

  const svgWidth = totalModules * barWidth + 20; // 10px padding on each side
  const svgHeight = includeText ? height + 18 : height;

  let x = 10;
  let svgPaths = '';

  for (let i = 0; i < patternStr.length; i++) {
    const w = parseInt(patternStr[i], 10) * barWidth;
    const isBar = i % 2 === 0;
    if (isBar) {
      svgPaths += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000000" />`;
    }
    x += w;
  }

  const textElement = includeText
    ? `<text x="${svgWidth / 2}" y="${height + 14}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000" letter-spacing="1">${cleanText}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="display:block;margin:0 auto;max-width:100%;">${svgPaths}${textElement}</svg>`;
}
