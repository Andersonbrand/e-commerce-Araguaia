'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { COMPANIES, COMPANY_ORDER, CompanyId } from '@/context/CompanyContext';
import { Product } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Props {
    product: Product | null;
    categories: string[];
    onSave: () => void;
    onClose: () => void;
}

const UNITS = ['saco', 'barra 12m', 'barra 6m', 'cento', 'kg', 'par', 'painel 6x2,4m',
               'chapa 3x1,2m', 'metro', 'unidade', 'rolo', 'peça', 'caixa', 'litro'];
const DEFAULT_CATEGORIES = ['Cimento', 'Vergalhões', 'Ferragens', 'Serralheria'];

type FormData = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
type ImageMode = 'upload' | 'url';

// Sugestões de grupos pré-definidos para agilizar o cadastro
const VARIANT_GROUP_SUGGESTIONS = [
    'Espessura', 'Bitola', 'Comprimento', 'Peso', 'Tipo', 'Medida',
    'Cabeça', 'Ponta', 'Diâmetro', 'Largura', 'Altura',
];

interface LocalVariant {
    tempId: string;
    id?: string;
    variant_group: string; // ex: "Bitola", "Comprimento", "Peso", "Tipo"
    label: string;         // ex: "10", "500m", "1kg", "E6013"
    priceDelta: number;
    stock: number;
}

// Grupo lógico que agrupa variantes de mesmo variant_group
interface LocalVariantGroup {
    groupName: string;
    items: LocalVariant[];
}

interface LocalBrand {
    tempId: string;
    id?: string;
    name: string;
    price: number;
    stock: number;
}

// Regra de dependência entre grupos
interface VariantRule {
    tempId: string;
    whenGroup: string;
    whenLabel: string;
    allowsGroup: string;
    allowsLabels: string[];
}

export default function ProductModal({ product, categories, onSave, onClose }: Props) {
    const supabase      = createClient();
    const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

    const [form, setForm]             = useState<FormData>({
        name: '', category: allCategories[0] ?? 'Cimento',
        description: '', image_url: null, price: 0, unit: UNITS[0], stock: 0, is_active: true, companies: ['araguaia'], is_featured: false,
    });
    const [imageMode, setImageMode]   = useState<ImageMode>('upload');
    const [urlInput, setUrlInput]     = useState('');
    const [uploading, setUploading]   = useState(false);
    const [saving, setSaving]         = useState(false);
    const [preview, setPreview]       = useState<string | null>(null);
    const [showNewCat, setShowNewCat] = useState(false);
    const [newCat, setNewCat]         = useState('');
    const fileRef                     = useRef<HTMLInputElement>(null);

    // Variantes (agrupadas por variant_group)
    const [hasVariants, setHasVariants]         = useState(false);
    const [variants, setVariants]               = useState<LocalVariant[]>([]);
    const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
    const [newGroupName, setNewGroupName]       = useState('');
    const [showGroupInput, setShowGroupInput]   = useState(false);

    // Derivado: agrupa variants por variant_group
    const variantGroups: LocalVariantGroup[] = React.useMemo(() => {
        const map = new Map<string, LocalVariant[]>();
        variants.forEach((v) => {
            if (!map.has(v.variant_group)) map.set(v.variant_group, []);
            map.get(v.variant_group)!.push(v);
        });
        return Array.from(map.entries()).map(([groupName, items]) => ({ groupName, items }));
    }, [variants]);

    // Marcas
    const [hasBrands, setHasBrands]             = useState(false);
    const [brands, setBrands]                   = useState<LocalBrand[]>([]);
    const [deletedBrandIds, setDeletedBrandIds] = useState<string[]>([]);

    // Regras de dependência entre grupos
    const [variantRules, setVariantRules] = useState<VariantRule[]>([]);
    const [showRules, setShowRules]       = useState(false);

    useEffect(() => {
        if (product) {
            const { id: _id, created_at: _c, updated_at: _u, ...rest } = product;
            const formData = { ...rest };
            if ((formData as any).company && !(formData as any).companies) {
              (formData as any).companies = [(formData as any).company];
            }
            if (!(formData as any).companies) (formData as any).companies = ['araguaia'];
            setForm(formData);
            setPreview(rest.image_url);
            if (rest.image_url) setUrlInput(rest.image_url);

            // Carregar variant_rules
            if ((rest as any).variant_rules && Array.isArray((rest as any).variant_rules)) {
                const rules: VariantRule[] = ((rest as any).variant_rules as any[]).map((r: any, i: number) => ({
                    tempId: `rule-${i}`,
                    whenGroup: r.when?.group ?? '',
                    whenLabel: r.when?.label ?? '',
                    allowsGroup: r.allows?.group ?? '',
                    allowsLabels: r.allows?.labels ?? [],
                }));
                setVariantRules(rules);
                if (rules.length > 0) setShowRules(true);
            }

            supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', product.id)
                .eq('is_active', true)
                .order('sort_order')
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        setHasVariants(true);
                        setVariants(data.map((v: any) => ({
                            tempId: v.id,
                            id: v.id,
                            variant_group: v.variant_group ?? 'Espessura',
                            label: v.label,
                            priceDelta: v.price_delta,
                            stock: v.stock,
                        })));
                    }
                });

            supabase
                .from('product_brands')
                .select('*')
                .eq('product_id', product.id)
                .eq('is_active', true)
                .order('sort_order')
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        setHasBrands(true);
                        setBrands(data.map((b: any) => ({
                            tempId: b.id,
                            id: b.id,
                            name: b.name,
                            price: b.price,
                            stock: b.stock,
                        })));
                    }
                });
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'category' && value === '__new__') {
            setShowNewCat(true);
            setNewCat('');
            return;
        }
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : (name === 'price' || name === 'stock') ? parseFloat(value) || 0 : value,
        }));
    };

    const handleNewCatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewCat(val);
        setForm((prev) => ({ ...prev, category: val }));
    };

    const confirmNewCat = () => {
        if (!newCat.trim()) return;
        setForm((prev) => ({ ...prev, category: newCat.trim() }));
        setShowNewCat(false);
    };

    const cancelNewCat = () => {
        setShowNewCat(false);
        setNewCat('');
        setForm((prev) => ({ ...prev, category: allCategories[0] ?? 'Cimento' }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 5MB.'); return; }
        setUploading(true);
        try {
            const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage.from('product-images').upload(filename, file, { cacheControl: '3600', upsert: true });
            if (error) throw error;
            const { data } = supabase.storage.from('product-images').getPublicUrl(filename);
            setForm((prev) => ({ ...prev, image_url: data.publicUrl }));
            setPreview(data.publicUrl);
            toast.success('Imagem enviada!');
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao enviar imagem.');
        } finally {
            setUploading(false);
        }
    };

    const handleUrlApply = () => {
        if (!urlInput.trim()) return;
        setForm((prev) => ({ ...prev, image_url: urlInput.trim() }));
        setPreview(urlInput.trim());
        toast.success('URL aplicada!');
    };

    const handleRemoveImage = () => {
        setForm((prev) => ({ ...prev, image_url: null }));
        setPreview(null);
        setUrlInput('');
    };

    // --- Variantes (por grupo) ---
    const addVariantToGroup = (groupName: string) => {
        setVariants((prev) => [
            ...prev,
            { tempId: `new-${Date.now()}`, variant_group: groupName, label: '', priceDelta: 0, stock: 0 },
        ]);
    };

    const addNewGroup = () => {
        const name = newGroupName.trim();
        if (!name) return;
        if (variantGroups.some((g) => g.groupName.toLowerCase() === name.toLowerCase())) {
            toast.error('Já existe um grupo com esse nome.');
            return;
        }
        setVariants((prev) => [
            ...prev,
            { tempId: `new-${Date.now()}`, variant_group: name, label: '', priceDelta: 0, stock: 0 },
        ]);
        setNewGroupName('');
        setShowGroupInput(false);
    };

    const removeGroup = (groupName: string) => {
        const toDelete = variants.filter((v) => v.variant_group === groupName && v.id);
        setDeletedVariantIds((prev) => [...prev, ...toDelete.map((v) => v.id!)]);
        setVariants((prev) => prev.filter((v) => v.variant_group !== groupName));
    };

    const updateVariant = (tempId: string, field: keyof Omit<LocalVariant, 'tempId' | 'id'>, value: string | number) => {
        setVariants((prev) => prev.map((v) => v.tempId === tempId ? { ...v, [field]: value } : v));
    };

    const removeVariant = (tempId: string) => {
        const v = variants.find((x) => x.tempId === tempId);
        if (v?.id) setDeletedVariantIds((prev) => [...prev, v.id!]);
        setVariants((prev) => prev.filter((x) => x.tempId !== tempId));
    };

    const saveVariants = async (productId: string) => {
        if (deletedVariantIds.length > 0) {
            await supabase.from('product_variants').delete().in('id', deletedVariantIds);
        }
        if (!hasVariants || variants.length === 0) {
            if (product?.id) {
                await supabase.from('product_variants').update({ is_active: false }).eq('product_id', productId);
            }
            return;
        }
        const rows = variants
            .filter((v) => v.label.trim())
            .map((v, idx) => ({
                ...(v.id ? { id: v.id } : {}),
                product_id: productId,
                variant_group: v.variant_group,
                label: v.label.trim(),
                price_delta: v.priceDelta,
                stock: v.stock,
                sort_order: idx,
                is_active: true,
            }));
        if (rows.length > 0) {
            const { error } = await supabase.from('product_variants').upsert(rows, { onConflict: 'id' });
            if (error) throw error;
        }
    };

    // --- Regras de dependência ---
    const addVariantRule = () => {
        const groups = variantGroups.map((g) => g.groupName);
        if (groups.length < 2) {
            toast.error('Crie pelo menos 2 grupos de variantes para definir regras.');
            return;
        }
        setVariantRules((prev) => [...prev, {
            tempId: `rule-${Date.now()}`,
            whenGroup: groups[0],
            whenLabel: variantGroups[0]?.items[0]?.label ?? '',
            allowsGroup: groups[1],
            allowsLabels: [],
        }]);
    };

    const updateVariantRule = (tempId: string, field: keyof Omit<VariantRule, 'tempId'>, value: any) => {
        setVariantRules((prev) => prev.map((r) => {
            if (r.tempId !== tempId) return r;
            if (field === 'whenGroup') {
                // Reset label when group changes
                const items = variantGroups.find((g) => g.groupName === value)?.items ?? [];
                return { ...r, whenGroup: value, whenLabel: items[0]?.label ?? '' };
            }
            if (field === 'allowsGroup') {
                return { ...r, allowsGroup: value, allowsLabels: [] };
            }
            return { ...r, [field]: value };
        }));
    };

    const toggleAllowedLabel = (tempId: string, label: string) => {
        setVariantRules((prev) => prev.map((r) => {
            if (r.tempId !== tempId) return r;
            const has = r.allowsLabels.includes(label);
            return { ...r, allowsLabels: has ? r.allowsLabels.filter((l) => l !== label) : [...r.allowsLabels, label] };
        }));
    };

    const removeVariantRule = (tempId: string) => {
        setVariantRules((prev) => prev.filter((r) => r.tempId !== tempId));
    };

    const buildVariantRulesPayload = () => {
        if (!showRules || variantRules.length === 0) return null;
        return variantRules
            .filter((r) => r.whenGroup && r.whenLabel && r.allowsGroup && r.allowsLabels.length > 0)
            .map((r) => ({
                when: { group: r.whenGroup, label: r.whenLabel },
                allows: { group: r.allowsGroup, labels: r.allowsLabels },
            }));
    };

    // --- Marcas ---
    const addBrand = () => {
        setBrands((prev) => [
            ...prev,
            { tempId: `new-${Date.now()}`, name: '', price: 0, stock: 0 },
        ]);
    };

    const updateBrand = (tempId: string, field: keyof Omit<LocalBrand, 'tempId' | 'id'>, value: string | number) => {
        setBrands((prev) => prev.map((b) => b.tempId === tempId ? { ...b, [field]: value } : b));
    };

    const removeBrand = (tempId: string) => {
        const b = brands.find((x) => x.tempId === tempId);
        if (b?.id) setDeletedBrandIds((prev) => [...prev, b.id!]);
        setBrands((prev) => prev.filter((x) => x.tempId !== tempId));
    };

    const saveBrands = async (productId: string) => {
        if (deletedBrandIds.length > 0) {
            await supabase.from('product_brands').delete().in('id', deletedBrandIds);
        }
        if (!hasBrands || brands.length === 0) {
            if (product?.id) {
                await supabase.from('product_brands').update({ is_active: false }).eq('product_id', productId);
            }
            return;
        }
        const rows = brands
            .filter((b) => b.name.trim())
            .map((b, idx) => ({
                ...(b.id ? { id: b.id } : {}),
                product_id: productId,
                name: b.name.trim(),
                price: b.price,
                stock: b.stock,
                sort_order: idx,
                is_active: true,
            }));
        if (rows.length > 0) {
            const { error } = await supabase.from('product_brands').upsert(rows, { onConflict: 'id' });
            if (error) throw error;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Nome é obrigatório.'); return; }
        if (!form.category.trim()) { toast.error('Categoria é obrigatória.'); return; }
        if (hasVariants && variants.some((v) => !v.label.trim())) {
            toast.error('Preencha o nome de todas as espessuras.'); return;
        }
        if (hasBrands && brands.some((b) => !b.name.trim())) {
            toast.error('Preencha o nome de todas as marcas.'); return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                price: Number(form.price),
                stock: Number(form.stock),
                companies: (form as any).companies ?? ['araguaia'],
                variant_rules: buildVariantRulesPayload(),
            };

            let savedProductId = product?.id;

            if (product) {
                const { error } = await supabase.from('products')
                    .update({ ...payload, updated_at: new Date().toISOString() })
                    .eq('id', product.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('products').insert([payload]).select('id').single();
                if (error) throw error;
                savedProductId = data.id;
            }

            await saveVariants(savedProductId!);
            await saveBrands(savedProductId!);

            toast.success(product ? 'Produto atualizado!' : 'Produto cadastrado!');
            onSave();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao salvar produto.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-4xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-red-xl border border-border">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-border px-8 py-5 flex items-center justify-between rounded-t-4xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">{product ? 'Editar Produto' : 'Novo Produto'}</h2>
                        <p className="text-[11px] text-muted uppercase tracking-widest">{product ? 'Atualize as informações' : 'Preencha os dados'}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-surface hover:bg-border transition-colors flex items-center justify-center">
                        <AppIcon name="XMarkIcon" size={18} className="text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Imagem */}
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block">Imagem do Produto</label>
                        <div className="flex gap-2 p-1 bg-surface rounded-xl w-fit">
                            {(['upload', 'url'] as ImageMode[]).map((mode) => (
                                <button key={mode} type="button" onClick={() => setImageMode(mode)}
                                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${imageMode === mode ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}>
                                    {mode === 'upload' ? '📁 Upload' : '🔗 URL'}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full h-44 rounded-2xl border-2 border-dashed border-border overflow-hidden bg-surface flex items-center justify-center">
                            {preview ? (
                                <>
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover"
                                        onError={() => { setPreview(null); toast.error('Imagem inválida.'); }} />
                                    <button type="button" onClick={handleRemoveImage}
                                        className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/90 border border-border text-muted hover:text-primary flex items-center justify-center shadow-sm">
                                        <AppIcon name="XMarkIcon" size={16} />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center px-4">
                                    {uploading ? (
                                        <div className="space-y-2">
                                            <svg className="animate-spin h-8 w-8 text-primary mx-auto" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                            </svg>
                                            <p className="text-sm text-muted">Enviando...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <AppIcon name="PhotoIcon" size={36} className="text-muted mx-auto mb-2" />
                                            <p className="text-sm text-muted font-medium">Nenhuma imagem</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        {imageMode === 'upload' && (
                            <>
                                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="hidden" />
                                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    <AppIcon name="ArrowUpTrayIcon" size={18} />
                                    {uploading ? 'Enviando...' : 'Clique para selecionar (PNG, JPG, WEBP · máx 5MB)'}
                                </button>
                            </>
                        )}
                        {imageMode === 'url' && (
                            <div className="flex gap-2">
                                <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors" />
                                <button type="button" onClick={handleUrlApply}
                                    className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all">
                                    Aplicar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Nome */}
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-2">Nome do Produto *</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange}
                            placeholder="Ex: Cimento CP-II 50kg — Votoran" required
                            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors" />
                    </div>

                    {/* Categoria + Unidade */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-2">Categoria *</label>
                            {showNewCat ? (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCat}
                                            onChange={handleNewCatChange}
                                            placeholder="Nome da categoria"
                                            autoFocus
                                            className="flex-1 px-3 py-3 rounded-xl border-2 border-primary/40 bg-white text-sm focus:outline-none focus:border-primary transition-colors font-medium"
                                        />
                                        <button type="button" onClick={confirmNewCat}
                                            className="px-3 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all"
                                            title="Confirmar categoria">
                                            <AppIcon name="CheckIcon" size={16} />
                                        </button>
                                        <button type="button" onClick={cancelNewCat}
                                            className="px-3 py-3 rounded-xl bg-surface border border-border text-muted text-sm hover:bg-border transition-all"
                                            title="Cancelar">
                                            <AppIcon name="XMarkIcon" size={16} />
                                        </button>
                                    </div>
                                    {newCat.trim() && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20">
                                            <AppIcon name="TagIcon" size={14} className="text-primary" />
                                            <span className="text-[12px] font-bold text-primary">
                                                Categoria: <span className="text-foreground">{newCat}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <select name="category" value={form.category} onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors">
                                    {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                                    <option value="__new__">+ Nova categoria</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-2">Unidade *</label>
                            <select name="unit" value={form.unit} onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors">
                                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Preço + Estoque */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-2">Preço (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm font-bold">R$</span>
                                <input type="number" name="price" value={form.price || ''} onChange={handleChange}
                                    step="0.01" min="0" placeholder="0,00"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors" />
                            </div>
                            <p className="text-[10px] text-muted mt-1">Deixe 0 se o preço for sob consulta</p>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-2">Estoque *</label>
                            <input type="number" name="stock" value={form.stock || ''} onChange={handleChange} min="0" placeholder="0"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors" />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted block mb-2">Descrição / Especificações</label>
                        <textarea name="description" value={form.description ?? ''} onChange={handleChange} rows={3}
                            placeholder="Especificações técnicas, marca, características..."
                            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
                    </div>

                    {/* ===== VARIAÇÕES / GRUPOS DE OPÇÕES ===== */}
                    <div className="rounded-2xl border border-border overflow-hidden">
                        <div
                            className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${hasVariants ? 'bg-blue-50 border-b border-blue-100' : 'bg-surface'}`}
                            onClick={() => {
                                const next = !hasVariants;
                                setHasVariants(next);
                                if (next && variants.length === 0) {
                                    setVariants([{ tempId: `new-${Date.now()}`, variant_group: 'Espessura', label: '', priceDelta: 0, stock: 0 }]);
                                }
                            }}
                        >
                            <div>
                                <p className="text-sm font-bold text-foreground">📐 Variações / Opções</p>
                                <p className="text-[11px] text-muted">
                                    {hasVariants
                                        ? `${variantGroups.length} grupo${variantGroups.length !== 1 ? 's' : ''} · ${variants.length} opç${variants.length !== 1 ? 'ões' : 'ão'}`
                                        : 'Espessuras, bitolas, comprimentos, pesos, tipos e mais'}
                                </p>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${hasVariants ? 'bg-blue-500' : 'bg-border'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${hasVariants ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                        </div>

                        {hasVariants && (
                            <div className="p-4 space-y-4">

                                {/* Renderiza cada grupo separadamente */}
                                {variantGroups.map((group) => (
                                    <div key={group.groupName} className="rounded-xl border border-blue-100 bg-blue-50/40 overflow-hidden">
                                        {/* Cabeçalho do grupo */}
                                        <div className="flex items-center justify-between px-3 py-2 bg-blue-100/60 border-b border-blue-100">
                                            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-widest">
                                                📌 {group.groupName}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeGroup(group.groupName)}
                                                className="text-[10px] text-blue-400 hover:text-red-500 font-bold transition-colors px-2 py-0.5 rounded"
                                                title={`Remover grupo ${group.groupName}`}
                                            >
                                                Remover grupo
                                            </button>
                                        </div>

                                        {/* Linhas de opções */}
                                        <div className="p-3 space-y-2">
                                            <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                                                <span className="col-span-5 text-[9px] uppercase tracking-widest font-bold text-muted">Opção / Label</span>
                                                <span className="col-span-3 text-[9px] uppercase tracking-widest font-bold text-muted">Preço (R$)</span>
                                                <span className="col-span-3 text-[9px] uppercase tracking-widest font-bold text-muted">Estoque</span>
                                                <span className="col-span-1" />
                                            </div>

                                            {group.items.map((v) => (
                                                <div key={v.tempId} className="grid grid-cols-12 gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        value={v.label}
                                                        onChange={(e) => updateVariant(v.tempId, 'label', e.target.value)}
                                                        placeholder={
                                                            group.groupName === 'Espessura' ? 'ex: 2,0mm' :
                                                            group.groupName === 'Bitola' ? 'ex: 12' :
                                                            group.groupName === 'Comprimento' ? 'ex: 500m' :
                                                            group.groupName === 'Peso' ? 'ex: 35kg' :
                                                            group.groupName === 'Tipo' ? 'ex: E6013' :
                                                            group.groupName === 'Medida' ? 'ex: 17x27' :
                                                            'valor...'
                                                        }
                                                        className="col-span-5 px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={v.priceDelta || ''}
                                                        onChange={(e) => updateVariant(v.tempId, 'priceDelta', parseFloat(e.target.value) || 0)}
                                                        placeholder="0,00"
                                                        step="0.01"
                                                        className="col-span-3 px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={v.stock || ''}
                                                        onChange={(e) => updateVariant(v.tempId, 'stock', parseInt(e.target.value) || 0)}
                                                        placeholder="0"
                                                        min="0"
                                                        className="col-span-3 px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(v.tempId)}
                                                        className="col-span-1 flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <AppIcon name="XMarkIcon" size={15} />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => addVariantToGroup(group.groupName)}
                                                className="w-full py-2 rounded-xl border border-dashed border-blue-200 text-blue-500 text-[11px] font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <AppIcon name="PlusIcon" size={13} />
                                                + opção em {group.groupName}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Adicionar novo grupo */}
                                {showGroupInput ? (
                                    <div className="space-y-2 p-3 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Nome do novo grupo</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {VARIANT_GROUP_SUGGESTIONS.filter(
                                                (s) => !variantGroups.some((g) => g.groupName.toLowerCase() === s.toLowerCase())
                                            ).map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => { setNewGroupName(s); }}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${newGroupName === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newGroupName}
                                                onChange={(e) => setNewGroupName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewGroup())}
                                                placeholder="ou digite um nome personalizado..."
                                                autoFocus
                                                className="flex-1 px-3 py-2 rounded-xl border-2 border-blue-300 bg-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                            <button type="button" onClick={addNewGroup}
                                                className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all">
                                                <AppIcon name="CheckIcon" size={16} />
                                            </button>
                                            <button type="button" onClick={() => { setShowGroupInput(false); setNewGroupName(''); }}
                                                className="px-3 py-2 rounded-xl bg-surface border border-border text-muted text-sm hover:bg-border transition-all">
                                                <AppIcon name="XMarkIcon" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowGroupInput(true)}
                                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 text-[12px] font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <AppIcon name="PlusIcon" size={15} />
                                        Adicionar grupo de opções
                                    </button>
                                )}

                                <p className="text-[10px] text-muted">
                                    Preço: informe o preço individual de cada opção. Deixe 0 para usar o preço base do produto.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ===== REGRAS DE DEPENDÊNCIA ENTRE VARIANTES ===== */}
                    {hasVariants && variantGroups.length >= 2 && (
                        <div className="rounded-2xl border border-border overflow-hidden">
                            <div
                                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${showRules ? 'bg-purple-50 border-b border-purple-100' : 'bg-surface'}`}
                                onClick={() => setShowRules((v) => !v)}
                            >
                                <div>
                                    <p className="text-sm font-bold text-foreground">🔗 Regras de combinação</p>
                                    <p className="text-[11px] text-muted">
                                        {showRules && variantRules.length > 0
                                            ? `${variantRules.length} regra${variantRules.length !== 1 ? 's' : ''} definida${variantRules.length !== 1 ? 's' : ''}`
                                            : 'Restrinja quais opções ficam disponíveis quando outra é selecionada'}
                                    </p>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${showRules ? 'bg-purple-500' : 'bg-border'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${showRules ? 'translate-x-6' : 'translate-x-1'}`} />
                                </div>
                            </div>

                            {showRules && (
                                <div className="p-4 space-y-3">
                                    <p className="text-[11px] text-muted bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                                        💡 Exemplo: quando o cliente seleciona <strong>Espessura = 10 - 3,4mm</strong>, permita apenas <strong>Peso: 1kg e 50kg</strong>. Para as demais espessuras, apenas <strong>1kg</strong>.
                                    </p>

                                    {variantRules.map((rule) => {
                                        const whenItems = variantGroups.find((g) => g.groupName === rule.whenGroup)?.items ?? [];
                                        const allowsItems = variantGroups.find((g) => g.groupName === rule.allowsGroup)?.items ?? [];
                                        const otherGroups = variantGroups.map((g) => g.groupName).filter((g) => g !== rule.whenGroup);

                                        return (
                                            <div key={rule.tempId} className="rounded-xl border border-purple-200 bg-purple-50/40 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Regra</span>
                                                    <button type="button" onClick={() => removeVariantRule(rule.tempId)}
                                                        className="text-[10px] text-purple-400 hover:text-red-500 font-bold transition-colors px-2 py-0.5 rounded">
                                                        Remover
                                                    </button>
                                                </div>

                                                {/* QUANDO */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[9px] uppercase tracking-widest font-bold text-muted block mb-1">Quando grupo</label>
                                                        <select
                                                            value={rule.whenGroup}
                                                            onChange={(e) => updateVariantRule(rule.tempId, 'whenGroup', e.target.value)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-white text-xs focus:outline-none focus:border-purple-400"
                                                        >
                                                            {variantGroups.map((g) => (
                                                                <option key={g.groupName} value={g.groupName}>{g.groupName}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] uppercase tracking-widest font-bold text-muted block mb-1">For igual a</label>
                                                        <select
                                                            value={rule.whenLabel}
                                                            onChange={(e) => updateVariantRule(rule.tempId, 'whenLabel', e.target.value)}
                                                            className="w-full px-2 py-1.5 rounded-lg border border-border bg-white text-xs focus:outline-none focus:border-purple-400"
                                                        >
                                                            {whenItems.map((v) => (
                                                                <option key={v.tempId} value={v.label}>{v.label || '(sem label)'}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* PERMITE */}
                                                <div>
                                                    <label className="text-[9px] uppercase tracking-widest font-bold text-muted block mb-1">Permitir no grupo</label>
                                                    <select
                                                        value={rule.allowsGroup}
                                                        onChange={(e) => updateVariantRule(rule.tempId, 'allowsGroup', e.target.value)}
                                                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-white text-xs focus:outline-none focus:border-purple-400 mb-2"
                                                    >
                                                        {otherGroups.map((g) => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                    </select>

                                                    <label className="text-[9px] uppercase tracking-widest font-bold text-muted block mb-1">
                                                        Opções permitidas — <span className="text-purple-500 normal-case">marque as que ficarão disponíveis</span>
                                                    </label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {allowsItems.map((v) => {
                                                            const isAllowed = rule.allowsLabels.includes(v.label);
                                                            return (
                                                                <button
                                                                    key={v.tempId}
                                                                    type="button"
                                                                    onClick={() => toggleAllowedLabel(rule.tempId, v.label)}
                                                                    className="px-2.5 py-1 rounded-lg border-2 text-[11px] font-bold transition-all"
                                                                    style={{
                                                                        borderColor: isAllowed ? '#7c3aed' : '#dde3ed',
                                                                        backgroundColor: isAllowed ? '#7c3aed15' : 'white',
                                                                        color: isAllowed ? '#7c3aed' : '#9ca3af',
                                                                    }}
                                                                >
                                                                    {isAllowed ? '✓ ' : ''}{v.label || '(sem label)'}
                                                                </button>
                                                            );
                                                        })}
                                                        {allowsItems.length === 0 && (
                                                            <span className="text-[11px] text-muted italic">Adicione opções ao grupo "{rule.allowsGroup}" primeiro</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        onClick={addVariantRule}
                                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-purple-200 text-purple-600 text-[12px] font-bold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <AppIcon name="PlusIcon" size={15} />
                                        Adicionar regra
                                    </button>

                                    <p className="text-[10px] text-muted">
                                        Cada regra define: "quando <em>GrupoA</em> = <em>X</em>, apenas mostrar estas opções em <em>GrupoB</em>". Opções sem regra definida ficam sempre visíveis.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== MARCAS DISPONÍVEIS ===== */}
                    <div className="rounded-2xl border border-border overflow-hidden">
                        <div
                            className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${hasBrands ? 'bg-green-50 border-b border-green-100' : 'bg-surface'}`}
                            onClick={() => {
                                const next = !hasBrands;
                                setHasBrands(next);
                                if (next && brands.length === 0) {
                                    setBrands([{ tempId: `new-${Date.now()}`, name: '', price: 0, stock: 0 }]);
                                }
                            }}
                        >
                            <div>
                                <p className="text-sm font-bold text-foreground">🏷️ Marcas disponíveis</p>
                                <p className="text-[11px] text-muted">
                                    {hasBrands
                                        ? `${brands.length} marca${brands.length !== 1 ? 's' : ''} cadastrada${brands.length !== 1 ? 's' : ''}`
                                        : 'Ative para oferecer o mesmo produto de diferentes marcas'}
                                </p>
                            </div>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${hasBrands ? 'bg-green-500' : 'bg-border'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${hasBrands ? 'translate-x-6' : 'translate-x-1'}`} />
                            </div>
                        </div>

                        {hasBrands && (
                            <div className="p-4 space-y-3">
                                <div className="grid grid-cols-12 gap-2 px-1">
                                    <span className="col-span-5 text-[9px] uppercase tracking-widest font-bold text-muted">Marca / Fabricante</span>
                                    <span className="col-span-3 text-[9px] uppercase tracking-widest font-bold text-muted">Preço (R$)</span>
                                    <span className="col-span-3 text-[9px] uppercase tracking-widest font-bold text-muted">Estoque</span>
                                    <span className="col-span-1" />
                                </div>

                                {brands.map((b) => (
                                    <div key={b.tempId} className="grid grid-cols-12 gap-2 items-center">
                                        <input
                                            type="text"
                                            value={b.name}
                                            onChange={(e) => updateBrand(b.tempId, 'name', e.target.value)}
                                            placeholder="ex: Gerdau"
                                            className="col-span-5 px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                        <input
                                            type="number"
                                            value={b.price || ''}
                                            onChange={(e) => updateBrand(b.tempId, 'price', parseFloat(e.target.value) || 0)}
                                            placeholder="0,00"
                                            step="0.01"
                                            min="0"
                                            className="col-span-3 px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                        <input
                                            type="number"
                                            value={b.stock || ''}
                                            onChange={(e) => updateBrand(b.tempId, 'stock', parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                            min="0"
                                            className="col-span-3 px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeBrand(b.tempId)}
                                            className="col-span-1 flex items-center justify-center w-8 h-8 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <AppIcon name="XMarkIcon" size={15} />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addBrand}
                                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-green-200 text-green-600 text-[12px] font-bold hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <AppIcon name="PlusIcon" size={15} />
                                    Adicionar marca
                                </button>

                                <p className="text-[10px] text-muted">
                                    Preço: informe o preço individual de cada marca. Deixe 0 se for sob consulta.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Empresas */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest font-bold text-muted mb-1">
                            Empresas que vendem este produto
                        </label>
                        <p className="text-[10px] text-muted mb-2">Selecione uma ou mais empresas do Grupo HC</p>
                        <div className="grid grid-cols-3 gap-2">
                            {COMPANY_ORDER.map((id) => {
                                const co = COMPANIES[id];
                                const companies = (form as any).companies as string[] ?? [];
                                const isSelected = companies.includes(id);
                                return (
                                    <button key={id} type="button"
                                        onClick={() => {
                                            const cur = (form as any).companies as string[] ?? [];
                                            const next = isSelected
                                                ? cur.filter((x: string) => x !== id)
                                                : [...cur, id];
                                            setForm(prev => ({ ...prev, companies: next.length ? next : [id] }));
                                        }}
                                        className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all relative"
                                        style={{
                                            borderColor: isSelected ? co.primaryColor : '#dde3ed',
                                            backgroundColor: isSelected ? co.bgLight : 'white',
                                        }}>
                                        {isSelected && (
                                            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                                                style={{ backgroundColor: co.primaryColor }}>✓</span>
                                        )}
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: co.primaryColor }} />
                                        <span className="text-[11px] font-bold leading-tight text-center" style={{ color: isSelected ? co.primaryColor : '#9ca3af' }}>{co.shortName}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Destaque na homepage */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <div>
                            <p className="text-sm font-bold text-foreground">⭐ Produto em destaque</p>
                            <p className="text-[11px] text-muted">Aparece nas "Categorias Principais" da homepage</p>
                        </div>
                        <button type="button" onClick={() => setForm((prev) => ({ ...prev, is_featured: !(prev as any).is_featured }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${(form as any).is_featured ? 'bg-amber-500' : 'bg-border'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${(form as any).is_featured ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Ativo */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                        <div>
                            <p className="text-sm font-bold text-foreground">Produto ativo</p>
                            <p className="text-[11px] text-muted">Exibir no catálogo público</p>
                        </div>
                        <button type="button" onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${form.is_active ? 'bg-primary' : 'bg-border'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-surface transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving || uploading}
                            className="flex-1 py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all shadow-red-lg disabled:opacity-60 flex items-center justify-center gap-2">
                            {saving
                                ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvando...</>
                                : <><AppIcon name="CheckIcon" size={16} />{product ? 'Salvar Alterações' : 'Cadastrar Produto'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
