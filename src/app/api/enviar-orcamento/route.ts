import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { COMPANY_EMAIL, OrderMessageData, toEmailHtml, toEmailText } from '@/lib/order-message';

export const runtime = 'nodejs';

/**
 * Envia por e-mail (para a Comercial Araguaia) o resumo de um pedido do carrinho
 * cujo cliente escolheu "E-mail" como retorno.
 *
 * Segurança: o conteúdo NÃO vem do navegador. O cliente manda só o id do pedido + o token da
 * sessão; a rota lê o pedido no banco com esse token (a RLS só devolve pedidos do próprio usuário).
 * Assim ninguém consegue usar a rota para mandar texto livre ao e-mail da empresa.
 */

const sent = new Set<string>(); // evita reenvio do mesmo pedido (por instância do servidor)

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let orderId = '';
  try { orderId = String((await req.json())?.orderId ?? ''); } catch { /* corpo inválido */ }
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('[enviar-orcamento] RESEND_API_KEY não configurada');
    return NextResponse.json({ error: 'email_not_configured' }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: order, error: orderErr } = await supabase.from('orders').select('*').eq('id', orderId).single();
  if (orderErr || !order || order.user_id !== user.id) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const methods: string[] = order.contact_methods ?? [];
  const ageMs = Date.now() - new Date(order.created_at).getTime();
  if (!methods.includes('email') || ageMs > 15 * 60 * 1000) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  if (sent.has(orderId)) return NextResponse.json({ ok: true, duplicate: true });

  const data: OrderMessageData = {
    accountName: (user.user_metadata?.full_name as string) || order.customer_name,
    accountEmail: user.email ?? order.customer_email,
    registeredAt: user.created_at,
    requestName: order.customer_name,
    phone: order.customer_phone || null,
    returnEmail: order.contact_email || null,
    methods,
    items: (order.items ?? []).map((i: any) => ({
      name: String(i.name ?? ''), quantity: Number(i.quantity) || 0, unit: i.unit ?? null, variant_label: i.variant_label ?? null,
    })),
    observation: order.observation ?? null,
  };

  try {
    // Resend: https://resend.com/docs/api-reference/emails/send-email
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'Site Grupo HC <onboarding@resend.dev>',
        to: [process.env.ORDER_MAIL_TO ?? COMPANY_EMAIL],
        reply_to: data.returnEmail || data.accountEmail,   // "Responder" já vai para o cliente
        subject: `Novo pedido de orçamento — ${data.accountName}`.slice(0, 150),
        text: toEmailText(data),
        html: toEmailHtml(data),
      }),
    });
    if (!res.ok) {
      // o Resend explica o motivo no corpo (ex.: domínio não verificado, destinatário não permitido)
      console.error('[enviar-orcamento] Resend recusou o envio:', res.status, await res.text());
      return NextResponse.json({ error: 'send_failed' }, { status: 502 });
    }
    sent.add(orderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[enviar-orcamento] falha ao chamar o Resend:', err);
    return NextResponse.json({ error: 'send_failed' }, { status: 502 });
  }
}
