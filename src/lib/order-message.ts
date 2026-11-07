/**
 * Mensagem padrão da solicitação de orçamento (WhatsApp e e-mail).
 *
 * Três blocos, para ficar organizado:
 *   1) INFORMAÇÕES PESSOAIS   → vêm do cadastro do usuário
 *   2) CONTATO PARA RETORNO   → telefone / e-mail / forma de retorno informados no carrinho
 *   3) ITENS DO ORÇAMENTO     → lista + total (o total fica junto da lista, no final)
 *
 * Este arquivo é usado no navegador (link do WhatsApp) e no servidor (e-mail),
 * por isso não depende de React nem de nada do Next.
 */

export const COMPANY_WHATSAPP = '557734512175';          // (77) 3451-2175
export const COMPANY_EMAIL    = 'robertaaraguaia10@gmail.com';

export interface OrderMessageItem {
  name: string;
  quantity: number;
  unit?: string | null;
  variant_label?: string | null;
}

export interface OrderMessageData {
  // — cadastro —
  accountName: string;
  accountEmail: string;
  registeredAt?: string | null;       // data de criação da conta (ISO)
  // — carrinho —
  requestName?: string | null;        // nome digitado no formulário do carrinho
  phone?: string | null;              // WhatsApp informado
  returnEmail?: string | null;        // e-mail informado para o retorno
  methods: string[];                  // 'whatsapp' | 'email' | 'site'
  items: OrderMessageItem[];
  observation?: string | null;
}

const METHOD_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', email: 'E-mail', site: 'Pelo nosso site',
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
};

const clean = (s: string | null | undefined, max = 500) =>
  (s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function itemLines(items: OrderMessageItem[]): string[] {
  return items.map((i, n) => {
    const variant = i.variant_label ? ` (${clean(i.variant_label, 80)})` : '';
    const unit    = i.unit ? ` ${clean(i.unit, 30)}` : '';
    return `${n + 1}. ${clean(i.name, 120)}${variant} — Quantidade: ${i.quantity}${unit}`;
  });
}

function totals(items: OrderMessageItem[]) {
  const units = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  return { products: items.length, units };
}

/**
 * Resumo do pedido, escrito para não gerar dúvida:
 *   "3 produtos diferentes" = quantas linhas existem na lista de itens
 *   "4 itens no total"      = soma das quantidades (ex.: 2 rolos + 1 unidade + 1 unidade)
 * As unidades de medida podem ser diferentes (rolo, unidade, barra...), por isso a soma é dita como
 * "soma das quantidades" e não como "unidades".
 */
function summary(items: OrderMessageItem[]) {
  const t = totals(items);
  const produtos = `${t.products} ${t.products === 1 ? 'produto' : 'produtos diferentes'}`;
  const itens    = `${t.units} ${t.units === 1 ? 'item' : 'itens'}`;
  return {
    heading: `ITENS DO ORÇAMENTO (${produtos})`,
    totalLine: `TOTAL DO PEDIDO: ${produtos} · ${itens} somando as quantidades`,
    produtos, itens,
  };
}

type Row = [label: string, value: string];

function sections(d: OrderMessageData) {
  const personal: Row[] = [
    ['Nome', clean(d.accountName, 200)],
    ['E-mail do cadastro', clean(d.accountEmail, 254)],
  ];
  const since = fmtDate(d.registeredAt);
  if (since) personal.push(['Cliente desde', since]);

  const requested: Row[] = [];
  const typed = clean(d.requestName, 200);
  if (typed && typed.toLowerCase() !== clean(d.accountName, 200).toLowerCase()) requested.push(['Nome informado no pedido', typed]);
  if (d.phone) requested.push(['Telefone informado', clean(d.phone, 40)]);
  if (d.returnEmail) requested.push(['E-mail para retorno', clean(d.returnEmail, 254)]);
  requested.push(['Retorno preferido', d.methods.map((m) => METHOD_LABELS[m] ?? m).join(', ') || '—']);
  return { personal, requested, lines: itemLines(d.items), obs: clean(d.observation, 1000), sum: summary(d.items) };
}

/** Texto para o WhatsApp (negrito com *asteriscos*). Limita o tamanho para caber no link. */
export function toWhatsAppText(d: OrderMessageData, maxLen = 1700): string {
  const s = sections(d);
  const head = [
    '*SOLICITAÇÃO DE ORÇAMENTO — Grupo HC*', '',
    '*INFORMAÇÕES PESSOAIS*',
    ...s.personal.map(([k, v]) => `${k}: ${v}`), '',
    '*CONTATO PARA RETORNO*',
    ...s.requested.map(([k, v]) => `${k}: ${v}`), '',
    `*${s.sum.heading}*`,
  ];
  // o total e as observações ficam sempre no final (nunca são cortados); só a lista de itens é encurtada
  const tail = ['', `*${s.sum.totalLine}*`, ...(s.obs ? ['', `*Observações:* ${s.obs}`] : [])];
  const MORE = '… e mais itens (veja o pedido completo no painel)';
  let lines = s.lines;
  let text = [...head, ...lines, ...tail].join('\n');
  if (text.length > maxLen) {
    while (lines.length > 1 && [...head, ...lines, MORE, ...tail].join('\n').length > maxLen) {
      lines = lines.slice(0, -1);
    }
    text = [...head, ...lines, MORE, ...tail].join('\n');
  }
  return text;
}

export function whatsappLink(d: OrderMessageData): string {
  return `https://wa.me/${COMPANY_WHATSAPP}?text=${encodeURIComponent(toWhatsAppText(d))}`;
}

/** Texto simples para o e-mail. */
export function toEmailText(d: OrderMessageData): string {
  const s = sections(d);
  return [
    'SOLICITAÇÃO DE ORÇAMENTO — Grupo HC', '',
    'INFORMAÇÕES PESSOAIS',
    ...s.personal.map(([k, v]) => `${k}: ${v}`), '',
    'CONTATO PARA RETORNO',
    ...s.requested.map(([k, v]) => `${k}: ${v}`), '',
    s.sum.heading, ...s.lines, '', s.sum.totalLine,
    ...(s.obs ? ['', `Observações: ${s.obs}`] : []),
  ].join('\n');
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML do e-mail (todo texto vindo do usuário é escapado). */
export function toEmailHtml(d: OrderMessageData): string {
  const s = sections(d);
  const rows = (r: Row[]) => r.map(([k, v]) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap">${esc(k)}</td><td style="padding:4px 0;color:#111827"><b>${esc(v)}</b></td></tr>`).join('');
  const h = (t: string) => `<h3 style="margin:22px 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#af1518;border-bottom:1px solid #e5e7eb;padding-bottom:6px">${t}</h3>`;
  const itemRows = d.items.map((i, n) => {
    const variant = i.variant_label ? ` <span style="color:#6b7280">(${esc(clean(i.variant_label, 80))})</span>` : '';
    const qty = `${i.quantity}${i.unit ? ' ' + esc(clean(i.unit, 30)) : ''}`;
    return `<tr style="border-bottom:1px solid #e5e7eb"><td style="padding:8px 10px;color:#6b7280">${n + 1}</td><td style="padding:8px 10px;color:#111827">${esc(clean(i.name, 120))}${variant}</td><td style="padding:8px 10px;text-align:right;white-space:nowrap"><b>${qty}</b></td></tr>`;
  }).join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;max-width:620px;margin:0 auto">
<h2 style="margin:0 0 4px;color:#111827">Solicitação de orçamento</h2>
<p style="margin:0;color:#6b7280">Grupo HC — recebida pelo site</p>
${h('Informações pessoais <span style="text-transform:none;letter-spacing:0;color:#9ca3af">(cadastro)</span>')}
<table style="border-collapse:collapse">${rows(s.personal)}</table>
${h('Contato para retorno')}
<table style="border-collapse:collapse">${rows(s.requested)}</table>
${h(esc(s.sum.heading.charAt(0) + s.sum.heading.slice(1).toLowerCase()))}
<table style="border-collapse:collapse;width:100%;font-size:14px">
<tr style="background:#f3f4f6;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.05em"><td style="padding:6px 10px;width:28px">Nº</td><td style="padding:6px 10px">Produto</td><td style="padding:6px 10px;text-align:right;white-space:nowrap">Quantidade</td></tr>
${itemRows}
</table>
<p style="margin:12px 0 0;padding:10px 12px;background:#fef2f2;border-left:4px solid #af1518;border-radius:4px;color:#111827"><b>${esc(s.sum.totalLine)}</b></p>
${s.obs ? `<p style="margin:16px 0 4px;color:#6b7280">Observações</p><p style="margin:0;padding:10px 12px;background:#f9fafb;border-radius:8px">${esc(s.obs)}</p>` : ''}
</div>`;
}
