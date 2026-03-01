import "./ProductCard.css";

function resolveImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    return imageUrl;
}

export default function ProductCard({ product, onAdd, onClick }) {
    return (
        <div className="product-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="product-image">
                <img
                    src={resolveImageUrl(product.imageUrl)}
                    alt={product.name}
                />
            </div>

            <h3 className="product-title">{product.name}</h3>
            {product.category && (
                <span className="product-category">{product.category}</span>
            )}

            {onAdd && (
                <button
                    className="product-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd(product);
                    }}
                >
                    Adicionar ao Orçamento
                </button>
            )}
        </div>
    );
}