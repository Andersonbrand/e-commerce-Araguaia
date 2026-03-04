import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { toast } from 'react-toastify';
import CartItem from '../../components/CartItem/CartItem';
import './cart.css';

export default function Cart() {
    const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
    const navigate = useNavigate();

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleCheckout = () => {
        navigate('/orcamento');
        toast.success('Adicione suas informações para envio!');
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-empty">
                <div className="cart-empty__icon">🛒</div>
                <h2>Seu carrinho está vazio</h2>
                <p>Explore nossos produtos e adicione itens ao carrinho.</p>
                <button className="cart-empty__btn" onClick={() => navigate('/produtos')}>
                    Ver produtos
                </button>
            </div>
        );
    }

    return (
        <div className="cart-page">

            {/* LISTA DE ITENS */}
            <div className="cart-content">
                <div className="cart-header">
                    <div className="cart-header__left">
                        <h1 className="cart-title">Meu Carrinho</h1>
                        <span className="cart-badge">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
                    </div>
                    <button className="cart-clear" onClick={clearCart}>
                        Limpar tudo
                    </button>
                </div>

                <ul className="cart-list">
                    {cartItems.map((item) => (
                        <CartItem
                            key={item._id}
                            item={item}
                            onRemove={removeFromCart}
                            onUpdateQuantity={updateQuantity}
                        />
                    ))}
                </ul>
            </div>

            {/* RESUMO LATERAL */}
            <aside className="cart-summary">
                <h2 className="cart-summary__title">Resumo do pedido</h2>

                <div className="cart-summary__rows">
                    {cartItems.map((item) => (
                        <div key={item._id} className="cart-summary__row">
                            <span className="cart-summary__row-name">{item.name}</span>
                            <span className="cart-summary__row-qty">x{item.quantity}</span>
                        </div>
                    ))}
                </div>

                <div className="cart-summary__divider" />

                <div className="cart-summary__total-row">
                    <span>Total de itens</span>
                    <span className="cart-summary__total-value">{totalItems}</span>
                </div>

                <div className="cart-summary__divider" />

                <button className="cart-checkout" onClick={handleCheckout}>
                    Continuar
                </button>

                <button className="cart-back" onClick={() => navigate('/produtos')}>
                    Adicionar mais produtos
                </button>
            </aside>

        </div>
    );
}