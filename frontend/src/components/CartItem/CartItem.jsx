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
                    <svg onClick={() => onRemove(item._id)} fill="#f90606" width="10px" height="10px" viewBox="-2.94 0 31.716 31.716" xmlns="http://www.w3.org/2000/svg" className="svg-icon">
                        <g transform="translate(-355.957 -579)">
                            <path d="M376.515,610.716H361.231a2.361,2.361,0,0,1-2.358-2.359V584.1a1,1,0,0,1,2,0v24.255a.36.36,0,0,0,.358.359h15.284a.36.36,0,0,0,.358-.359V584.1a1,1,0,0,1,2,0v24.255A2.361,2.361,0,0,1,376.515,610.716Z" />
                            <path d="M365.457,604.917a1,1,0,0,1-1-1v-14a1,1,0,0,1,2,0v14A1,1,0,0,1,365.457,604.917Z" />
                            <path d="M372.29,604.917a1,1,0,0,1-1-1v-14a1,1,0,0,1,2,0v14A1,1,0,0,1,372.29,604.917Z" />
                            <path d="M380.79,585.1H356.957a1,1,0,0,1,0-2H380.79a1,1,0,0,1,0,2Z" />
                            <path d="M372.79,581h-7.917a1,1,0,1,1,0-2h7.917a1,1,0,0,1,0,2Z" />
                        </g>
                    </svg>

                </div>
            </div>

        </li>
    );
}