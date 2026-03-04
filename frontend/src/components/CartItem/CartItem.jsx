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
                <div>
                    <svg onClick={() => onRemove(item._id)} focusable="false" aria-hidden="true" viewBox="0 0 52 52" part="icon" lwc-54ea36r85ci="" data-key="delete" class="slds-icon slds-icon-text-default"><g lwc-54ea36r85ci=""><path d="M45.5 10H33V6a4 4 0 00-4-4h-6a4 4 0 00-4 4v4H6.5c-.8 0-1.5.7-1.5 1.5v3c0 .8.7 1.5 1.5 1.5h39c.8 0 1.5-.7 1.5-1.5v-3c0-.8-.7-1.5-1.5-1.5zM23 7c0-.6.4-1 1-1h4c.6 0 1 .4 1 1v3h-6zm18.5 13h-31c-.8 0-1.5.7-1.5 1.5V45a5 5 0 005 5h24a5 5 0 005-5V21.5c0-.8-.7-1.5-1.5-1.5zM23 42c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1V28c0-.6.4-1 1-1h2c.6 0 1 .4 1 1zm10 0c0 .6-.4 1-1 1h-2c-.6 0-1-.4-1-1V28c0-.6.4-1 1-1h2c.6 0 1 .4 1 1z" lwc-54ea36r85ci=""></path></g></svg>
                </div>
            </div>
        </li>
    );
}