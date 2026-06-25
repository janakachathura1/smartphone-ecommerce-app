import { Link } from 'react-router-dom';
import { RiHeartLine, RiHeartFill, RiShoppingCartLine, RiStarFill } from 'react-icons/ri';
import { formatPrice } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuthStore();
  const { addToCart, isLoading } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();
  const navigate = useNavigate();

  const primaryImage = product.images?.[0]?.url || `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(product.name)}`;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      navigate('/login');
      return;
    }
    await addToCart(product.id);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to save items');
      navigate('/login');
      return;
    }
    await toggle(product.id);
  };

  return (
    <Link to={`/product/${product.slug}`} className="group card-hover flex flex-col">
      {/* Image */}
      <div className="relative overflow-hidden bg-white aspect-square p-2">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => { e.target.src = `https://placehold.co/400x400/e2e8f0/64748b?text=No+Image`; }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.discountPercent > 0 && (
            <span className="badge-sale">-{Math.round(product.discountPercent)}%</span>
          )}
          {product.isNewArrival && (
            <span className="badge-new">New</span>
          )}
          {product.isBestSeller && !product.isNewArrival && (
            <span className="badge bg-amber-500 text-white">Bestseller</span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {inWishlist ? (
            <RiHeartFill size={16} className="text-red-500" />
          ) : (
            <RiHeartLine size={16} className="text-secondary-400 group-hover:text-secondary-700" />
          )}
        </button>

        {/* Add to cart overlay */}
        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={isLoading || product.stock === 0}
            className="w-full btn-primary text-sm py-2 shadow-lg"
          >
            <RiShoppingCartLine size={16} />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">{product.brand?.name}</p>
          <span className="text-secondary-300 text-[10px]">•</span>
          <p className="text-xs text-secondary-500 font-semibold">{product.category?.name}</p>
        </div>
        <h3 className="text-base font-black text-secondary-950 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors tracking-tight">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((star) => (
              <RiStarFill
                key={star}
                size={12}
                className={star <= Math.round(product.rating) ? 'text-amber-400' : 'text-secondary-200'}
              />
            ))}
          </div>
          <span className="text-xs text-secondary-400">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-lg font-bold text-secondary-900">{formatPrice(product.finalPrice)}</span>
          {product.discountPercent > 0 && (
            <span className="text-sm text-secondary-400 line-through">{formatPrice(product.basePrice)}</span>
          )}
        </div>

        {/* Stock status */}
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-amber-600 font-medium mt-1.5">Only {product.stock} left!</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 font-medium mt-1.5">Out of Stock</p>
        )}
      </div>
    </Link>
  );
}
