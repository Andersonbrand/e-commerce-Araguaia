'use client';

import React, { useState, useMemo } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';
import { friendlyError, toNum } from '@/lib/friendly-error';
import toast from 'react-hot-toast';

export interface EditableRequest {
  id: string;
  source: 'cart' | 'form';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company?: string | null;
  items?: any[];
  total?: number;
  category?: string;
  message?: string;
}

interface Props {
  request: EditableRequest;
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors';
const labelCls = 'text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-1.5';

export default function RequestEditModal({ request, onClose, onSaved }: Props) {
  const [name, setName]         = useState(request.customer_name ?? '');
  const [email, setEmail]       = useState(request.customer_email ?? '');
  const [phone, setPhone]       = useState(request.customer_phone ?? '');
  const [company, setCompany]   = useState(request.company ?? '');
  const [category, setCategory] = useState(request.category ?? '');
  const [message, setMessage]   = useState(request.message ?? '');
  const [items, setItems]       = useState<any[]>(request.items ? request.items.map((i) => ({ ...i })) : []);
  const [saving, setSaving]     = useState(false);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + toNum(i.price) * toNum(i.quantity, true), 0),
    [items],
  );

  const setQty = (idx: number, qty: number) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, quantity: toNum(qty, true) } : it)));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())  { toast.error('Informe o nome do cliente.'); return; }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { toast.error('Informe um e-mail válido.'); return; }
    if (!phone.trim()) { toast.error('Informe o telefone do cliente.'); return; }
    if (request.source === 'form') {
      if (!category.trim()) { toast.error('Informe a categoria da solicitação.'); return; }
      if (!message.trim())  { toast.error('A mensagem da solicitação não pode ficar vazia.'); return; }
    } else {
      if (items.length === 0) { toast.error('O pedido precisa ter pelo menos um item. Para removê-lo por completo, use "Excluir".'); return; }
      if (items.some((i) => toNum(i.quantity, true) < 1)) { toast.error('A quantidade de cada item deve ser de pelo menos 1.'); return; }
    }

    setSaving(true);
    try {
      const table = request.source === 'cart' ? 'orders' : 'quotes';
      const payload =
        request.source === 'cart'
          ? { customer_name: name.trim(), customer_email: email.trim(), customer_phone: phone.trim(), items, total }
          : { name: name.trim(), email: email.trim(), phone: phone.trim(), company: company.trim() || null, category: category.trim(), message: message.trim() };

      // .select() permite detectar quando o RLS bloqueia a atualização sem devolver erro
      const { data, error } = await supabase.from(table).update(payload).eq('id', request.id).select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Nenhuma alteração foi gravada. A solicitação pode ter sido removida ou você não tem permissão para editá-la.');
        return;
      }
      toast.success('Solicitação atualizada com sucesso!');
      onSaved();
    } catch (err: any) {
      console.error('[RequestEditModal]', err);
      toast.error(friendlyError(err, 'atualizar a solicitação'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col" style={{ maxHeight: 'calc(100dvh - 40px)' }}>
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
              <AppIcon name="PencilSquareIcon" size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Editar solicitação</h2>
              <p className="text-[11px] text-muted">{request.source === 'cart' ? 'Pedido via carrinho' : 'Orçamento via formulário'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" aria-label="Fechar">
            <AppIcon name="XMarkIcon" size={18} className="text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className={labelCls}>Nome *</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>E-mail *</label>
              <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Telefone *</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          {request.source === 'form' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Empresa do cliente</label>
                  <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Categoria *</label>
                  <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mensagem *</label>
                <textarea rows={4} className={`${inputCls} resize-none`} value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            </>
          )}

          {request.source === 'cart' && (
            <div className="space-y-2">
              <label className={labelCls}>Itens do pedido</label>
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{it.name}</p>
                    <p className="text-[11px] text-muted">
                      {it.unit}{toNum(it.price) > 0 ? ` · R$ ${toNum(it.price).toFixed(2).replace('.', ',')} cada` : ' · sob consulta'}
                    </p>
                  </div>
                  <input type="number" min={1} value={it.quantity || ''} onChange={(e) => setQty(idx, parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 rounded-xl border border-border bg-white text-sm text-center focus:outline-none focus:border-primary" aria-label="Quantidade" />
                  <button type="button" onClick={() => removeItem(idx)} title="Remover item"
                    className="w-8 h-8 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all">
                    <AppIcon name="XMarkIcon" size={15} />
                  </button>
                </div>
              ))}
              <p className="text-sm text-right text-muted">
                Total: <span className="font-bold text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
              </p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-surface transition-colors">Cancelar</button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
