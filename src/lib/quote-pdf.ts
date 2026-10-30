import type { SupabaseClient } from '@supabase/supabase-js';

// PDFs de orçamento ficam num bucket PRIVADO. O banco guarda só o caminho do arquivo e o site gera um
// link temporário (assinado) na hora de abrir/baixar — quem não tem permissão não consegue o link.
export const QUOTE_PDF_BUCKET = 'quote-pdfs';

/** Aceita o caminho puro ("123-abc.pdf") ou uma URL antiga salva antes desta mudança. */
export function quotePdfPath(pdfUrl: string): string {
  const marker = `/${QUOTE_PDF_BUCKET}/`;
  const i = pdfUrl.lastIndexOf(marker);
  const raw = i >= 0 ? pdfUrl.slice(i + marker.length) : pdfUrl;
  const path = raw.split('?')[0];
  try { return decodeURIComponent(path); } catch { return path; }
}

/** Link temporário (2 min) do PDF. Retorna null se a pessoa não tiver acesso ou o arquivo não existir. */
export async function getQuotePdfSignedUrl(
  supabase: SupabaseClient, pdfUrl: string, downloadName?: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(QUOTE_PDF_BUCKET)
    .createSignedUrl(quotePdfPath(pdfUrl), 120, downloadName ? { download: downloadName } : undefined);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Abre (aba nova) ou baixa o PDF. Retorna false se não foi possível. */
export async function openQuotePdf(
  supabase: SupabaseClient, pdfUrl: string, opts?: { download?: boolean; fileName?: string },
): Promise<boolean> {
  // abre a aba ANTES do await para o navegador não bloquear como pop-up
  const tab = opts?.download ? null : window.open('', '_blank');
  if (tab) tab.opener = null;
  const url = await getQuotePdfSignedUrl(supabase, pdfUrl, opts?.download ? (opts.fileName ?? 'orcamento.pdf') : undefined);
  if (!url) { tab?.close(); return false; }
  if (opts?.download) {
    const a = document.createElement('a');
    a.href = url; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  } else if (tab) {
    tab.location.href = url;
  }
  return true;
}
