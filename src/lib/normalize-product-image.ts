// Padroniza a foto do produto NO UPLOAD do painel admin, para todas ficarem iguais no site:
//  1. troca fundo transparente por branco;
//  2. recorta as margens em branco em volta do produto;
//  3. centraliza o produto numa tela fixa 4:3 (1200×900), com o mesmo respiro em todas;
//  4. limpa o "quase branco" (cinza clarinho do JPG) para branco puro #FFFFFF — some o retângulo no card.
// Fotos com cenário/fundo colorido (não são recorte sobre branco) NÃO são alteradas: o admin é avisado.

export const PRODUCT_IMAGE_WIDTH  = 1200;
export const PRODUCT_IMAGE_HEIGHT = 900;
/** Fração da tela que o produto ocupa (o restante é respiro branco). */
export const PRODUCT_IMAGE_FILL   = 0.86;
const MAX_UPSCALE     = 3;     // não amplia além de 3× para não estourar a qualidade
const ANALYSIS_SIZE   = 600;   // a análise roda numa cópia reduzida (rápido)
const BG_THRESHOLD    = 240;   // canal mínimo ≥ 240 = fundo
const BORDER_WHITE_MIN = 0.55; // % da borda da foto que precisa ser branca para considerar "recorte sobre branco"

export type NormalizeStatus = 'normalized' | 'fullBleed' | 'skipped';
export interface NormalizeResult { blob: Blob; ext: string; status: NormalizeStatus; }

// ───────── funções puras (sem DOM — fáceis de testar) ─────────

/** Proporção da borda da imagem (faixa de ~2%) que é fundo claro. Foto com cenário → perto de 0. */
export function borderWhiteRatio(data: Uint8ClampedArray, w: number, h: number, threshold = 235): number {
  const t = Math.max(2, Math.round(Math.min(w, h) * 0.02));
  let total = 0, light = 0;
  const check = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    total++;
    if (Math.min(data[i], data[i + 1], data[i + 2]) >= threshold) light++;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x < t || y < t || x >= w - t || y >= h - t) check(x, y);
  }
  return total ? light / total : 0;
}

/** Caixa que envolve o produto (ignora fundo claro e ruído isolado). */
export function findContentBox(data: Uint8ClampedArray, w: number, h: number, threshold = BG_THRESHOLD):
  { x0: number; y0: number; x1: number; y1: number } | null {
  const rows = new Uint32Array(h), cols = new Uint32Array(w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (Math.min(data[i], data[i + 1], data[i + 2]) < threshold) { rows[y]++; cols[x]++; }
  }
  const minRow = Math.max(2, Math.round(w * 0.004)), minCol = Math.max(2, Math.round(h * 0.004));
  let y0 = 0, y1 = h - 1, x0 = 0, x1 = w - 1;
  while (y0 < h && rows[y0] < minRow) y0++;
  while (y1 >= 0 && rows[y1] < minRow) y1--;
  while (x0 < w && cols[x0] < minCol) x0++;
  while (x1 >= 0 && cols[x1] < minCol) x1--;
  if (y0 > y1 || x0 > x1) return null;
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/** "Quase branco" (≥ 236) vira branco puro com transição suave; tons mais escuros não mudam. */
export function whitenNearWhite(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const m = Math.min(data[i], data[i + 1], data[i + 2]);
    if (m <= 236) continue;
    const x = m >= 248 ? 1 : (m - 236) / 12;
    const t = x * x * (3 - 2 * x); // smoothstep
    data[i]     += (255 - data[i])     * t;
    data[i + 1] += (255 - data[i + 1]) * t;
    data[i + 2] += (255 - data[i + 2]) * t;
  }
}

// ───────── parte com canvas (navegador) ─────────

const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};

const canvasToBlob = (c: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), type, quality));

export async function normalizeProductImage(file: File): Promise<NormalizeResult> {
  const keep = (status: NormalizeStatus): NormalizeResult =>
    ({ blob: file, ext: file.name.split('.').pop()?.toLowerCase() ?? 'jpg', status });

  // GIF/SVG não passam por canvas sem perder animação/vetor
  if (/gif|svg/i.test(file.type)) return keep('skipped');

  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  const sw = bmp.width, sh = bmp.height;
  if (!sw || !sh) return keep('skipped');

  // 1) análise numa cópia reduzida, já sobre fundo branco (transparente → branco)
  const k  = Math.min(1, ANALYSIS_SIZE / Math.max(sw, sh));
  const aw = Math.max(1, Math.round(sw * k)), ah = Math.max(1, Math.round(sh * k));
  const ac = makeCanvas(aw, ah);
  const actx = ac.getContext('2d', { willReadFrequently: true })!;
  actx.fillStyle = '#fff'; actx.fillRect(0, 0, aw, ah);
  actx.drawImage(bmp, 0, 0, aw, ah);
  const adata = actx.getImageData(0, 0, aw, ah).data;

  // foto com cenário/fundo colorido: mantém o arquivo original e avisa
  if (borderWhiteRatio(adata, aw, ah) < BORDER_WHITE_MIN) { bmp.close?.(); return keep('fullBleed'); }

  // 2) região do produto, em coordenadas da imagem original
  let sx = 0, sy = 0, sWidth = sw, sHeight = sh;
  const box = findContentBox(adata, aw, ah);
  if (box) {
    sx = Math.max(0, Math.floor(box.x0 / k)); sy = Math.max(0, Math.floor(box.y0 / k));
    sWidth  = Math.min(sw - sx, Math.ceil((box.x1 - box.x0) / k));
    sHeight = Math.min(sh - sy, Math.ceil((box.y1 - box.y0) / k));
  }

  // 3) centraliza na tela fixa 4:3
  const W = PRODUCT_IMAGE_WIDTH, H = PRODUCT_IMAGE_HEIGHT;
  const scale = Math.min((W * PRODUCT_IMAGE_FILL) / sWidth, (H * PRODUCT_IMAGE_FILL) / sHeight, MAX_UPSCALE);
  const dw = sWidth * scale, dh = sHeight * scale;
  const out = makeCanvas(W, H);
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, sx, sy, sWidth, sHeight, (W - dw) / 2, (H - dh) / 2, dw, dh);
  bmp.close?.();

  // 4) branco puro no fundo
  const img = ctx.getImageData(0, 0, W, H);
  whitenNearWhite(img.data);
  ctx.putImageData(img, 0, 0);

  return { blob: await canvasToBlob(out, 'image/jpeg', 0.9), ext: 'jpg', status: 'normalized' };
}
