import { Link } from 'react-router-dom';
import { RiHeartLine, RiDeleteBin6Line, RiShoppingCartLine } from 'react-icons/ri';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';
import { formatPrice } from '../../lib/utils';
import { EmptyState } from '../../components/ui';
import UserLayout from './UserLayout';

export default function WishlistPage() {
  const { items, toggle } = useWishlistStore();
  const { addToCart } = useCartStore();

  return (
    <UserLayout>
      <div className="card">
        <div className="p-6 border-b border-secondary-100">
          <h1 className="text-xl font-bold text-secondary-900">My Wishlist</h1>
          <p className="text-secondary-500 text-sm mt-1">{items.length} saved items</p>
        </div>

        {items.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={RiHeartLine}
              title="Your wishlist is empty"
              description="Save products you love to find them easily later."
              action={<Link to="/shop" className="btn-primary">Browse Products</Link>}
            />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 p-6">
            {items.map((item) => {
              const product = item.product;
              const image = product.images?.[0]?.url;
              return (
                <div key={item.id} className="border border-secondary-100 rounded-2xl p-4 flex gap-4 hover:shadow-card transition-shadow">
                  <Link to={`/product/${product.slug}`} className="flex-shrink-0">
                    <img src={image || 'https://placehold.co/80x80'} alt={product.name} className="w-20 h-20 rounded-xl object-cover bg-secondary-100" onError={(e) => { e.target.src = 'https://placehold.co/80x80'; }} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary-600 font-medium">{product.brand?.name}</p>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-semibold text-secondary-900 text-sm hover:text-primary-600 transition-colors line-clamp-2">{product.name}</h3>
                    </Link>
                    <p className="font-bold text-secondary-900 mt-1">{formatPrice(product.finalPrice)}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => addToCart(product.id)}
                        className="flex items-center gap-1.5 text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <RiShoppingCartLine size={13} /> Add to Cart
                      </button>
                      <button
                        onClick={() => toggle(product.id)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RiDeleteBin6Line size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
