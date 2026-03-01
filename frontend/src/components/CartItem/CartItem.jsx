import "./cartItem.css";

export default function CartItem({ item, onRemove, onUpdateQuantity }) {
    return (
        <li className="cart-item">
            <div className="cart-item__image-wrap">
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="cart-item__image"
                />
            </div>

            <div className="cart-item__info">
                <p className="cart-item__name">{item.name}</p>
                {item.category && (
                    <span className="cart-item__category">{item.category}</span>
                )}
            </div>

            <div className="cart-item__controls">
                <div className="cart-item__qty">
                    <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Diminuir quantidade"
                    >
                        −
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button
                        className="qty-btn"
                        onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                    >
                        +
                    </button>
                </div>

                <button className="cart-item__remove" onClick={() => onRemove(item._id)} aria-label="Remover item">
                    Remover
                </button>
            </div>
        </li>
    );
}