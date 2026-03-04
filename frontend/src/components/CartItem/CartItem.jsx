import "./cartItem.css";

export default function CartItem({ item, onRemove, onUpdateQuantity }) {

    const handleQtyInput = (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1) {
            onUpdateQuantity(item._id, val);
        }
    };

    return (
        <li className="cart-item">

            {/* IMAGEM */}
            <div className="cart-item__image-wrap">
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="cart-item__image"
                />
            </div>

            {/* INFORMAÇÕES */}
            <div className="cart-item__info">
                <p className="cart-item__name">{item.name}</p>
                {item.category && (
                    <span className="cart-item__category">{item.category}</span>
                )}
            </div>

            {/* CONTROLES */}
            <div className="cart-item__controls">

                {/* QUANTIDADE */}
                <div className="cart-item__qty">
                    <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Diminuir quantidade"
                    >
                        −
                    </button>

                    <input
                        className="qty-input"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={handleQtyInput}
                        aria-label="Quantidade"
                    />

                    <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                    >
                        +
                    </button>
                </div>

                {/* REMOVER */}
                <button
                    className="cart-item__remove"
                    onClick={() => onRemove(item._id)}
                    aria-label="Remover item"
                    title="Remover item"
                >
                    🗑
                </button>
            </div>

        </li>
    );
}