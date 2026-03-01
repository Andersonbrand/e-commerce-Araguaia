import { useEffect, useState } from 'react';
import api, { createProduct, updateProduct, deleteProduct } from '../../services/api';
import './admin.css';

const EMPTY_FORM = {
    name: '',
    category: '',
    description: '',
    image: null,
};

export default function Admin() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        const res = await api.get('/products');
        setProducts(res.data.products || []);
    }

    function handleChange(e) {
        const { name, value, files } = e.target;
        if (name === 'image') {
            const file = files[0];
            setForm((f) => ({ ...f, image: file }));
            setPreview(file ? URL.createObjectURL(file) : null);
        } else {
            setForm((f) => ({ ...f, [name]: value }));
        }
    }

    function startEdit(product) {
        setEditingId(product._id);
        setForm({
            name: product.name,
            category: product.category || '',
            description: product.description || '',
            image: null,
        });
        setPreview((product.imageUrl));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setPreview(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.name.trim()) {
            alert('Nome é obrigatório.');
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('category', form.category);
        formData.append('description', form.description);
        if (form.image) formData.append('image', form.image);

        setLoading(true);
        try {
            if (editingId) {
                await updateProduct(editingId, formData);
            } else {
                await createProduct(formData);
            }
            await fetchProducts();
            cancelEdit();
        } catch {
            alert('Erro ao salvar produto. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p._id !== id));
        } catch {
            alert('Erro ao excluir produto.');
        }
    }

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="admin-page">
            <h1 className="admin-title">Painel do Administrador</h1>

            {/* FORMULÁRIO */}
            <section className="admin-form-section">
                <h2 className="admin-section-title">
                    {editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h2>

                <form className="admin-form" onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="admin-form__fields">
                        <div className="admin-form__group">
                            <label>Nome *</label>
                            <input name="name" value={form.name} onChange={handleChange} placeholder="Nome do produto" required />
                        </div>

                        <div className="admin-form__group">
                            <label>Categoria</label>
                            <input name="category" value={form.category} onChange={handleChange} placeholder="Ex: Cimento, Tijolos..." />
                        </div>

                        <div className="admin-form__group admin-form__group--full">
                            <label>Descrição</label>
                            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descrição breve do produto..." rows={3} />
                        </div>

                        <div className="admin-form__group admin-form__group--full">
                            <label>Imagem {editingId ? '(deixe em branco para manter a atual)' : ''}</label>
                            <input name="image" type="file" accept="image/*" onChange={handleChange} />
                            {preview && (
                                <div className="admin-form__preview">
                                    <img src={preview} alt="Preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="admin-form__actions">
                        <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
                            {loading ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar produto'}
                        </button>
                        {editingId && (
                            <button type="button" className="admin-btn admin-btn--secondary" onClick={cancelEdit}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* LISTA */}
            <section className="admin-list-section">
                <div className="admin-list-header">
                    <h2 className="admin-section-title">Produtos cadastrados ({products.length})</h2>
                    <input
                        className="admin-search"
                        placeholder="Buscar por nome ou categoria..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {filtered.length === 0 ? (
                    <p className="admin-empty">Nenhum produto encontrado.</p>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Imagem</th>
                                    <th>Nome</th>
                                    <th>Categoria</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p) => (
                                    <tr key={p._id}>
                                        <td data-label="Imagem">
                                            <img
                                                src={(p.imageUrl)}
                                                alt={p.name}
                                                className="admin-table__thumb"
                                            />
                                        </td>
                                        <td data-label="Nome">{p.name}</td>
                                        <td data-label="Categoria">{p.category || '—'}</td>
                                        <td data-label="Ações">
                                            <div className="admin-table__actions">
                                                <button
                                                    className="admin-btn admin-btn--edit"
                                                    onClick={() => startEdit(p)}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="admin-btn admin-btn--delete"
                                                    onClick={() => handleDelete(p._id)}
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
