import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import './productDetail.css';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        api.get(`/products/${id}`)
            .then((res) => {
                setProduct(res.data.product || res.data);
            })
            .catch(() => navigate('/produtos'))
            .finally(() => setLoading(false));
    }, [id, navigate]);

    function handleAddToCart() {
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    if (loading) {
        return <div className="pd-loading">Carregando...</div>;
    }

    if (!product) return null;

    return (
        <div className="pd-container">
            <button className="pd-back" onClick={() => navigate('/produtos')}>
                &larr; Voltar aos produtos
            </button>

            <div className="pd-card">
                <div className="pd-image-wrap">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="pd-image"
                    />
                </div>

                <div className="pd-info">
                    {product.category && (
                        <span className="pd-category">{product.category}</span>
                    )}
                    <h1 className="pd-name">{product.name}</h1>

                    {product.description && (
                        <p className="pd-description">{product.description}</p>
                    )}

                    <button
                        className={`pd-add-btn${added ? ' pd-add-btn--added' : ''}`}
                        onClick={handleAddToCart}
                    >
                        {added ? 'Adicionado ao carrinho!' : 'Adicionar ao carrinho'}
                    </button>

                    <button className="pd-cart-link" onClick={() => navigate('/carrinho')}>
                        Ver carrinho
                    </button>
                </div>
            </div>
        </div>
    );
}
