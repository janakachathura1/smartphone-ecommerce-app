import { Link } from 'react-router-dom';
import { RiDeleteBin6Line, RiShoppingBagLine, RiArrowRightLine } from 'react-icons/ri';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatPrice } from '../lib/utils';
import { EmptyState } from '../components/ui';

export default function CartPage() {
  const { cart, itemCount, subtotal, updateItem, removeItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const items = cart?.items || [];

  const deliveryFee = subtotal >= 50000 ? 0 : 1000;
  const total = subtotal + deliveryFee;

  if (!isAuthenticated) {
    return (
      <div className="container-custom py-20">
        <EmptyState
          icon={RiShoppingBagLine}
          title="Please sign in"
          description="You need to be logged in to view your cart."
          action={<Link to="/login" className="btn-primary">Sign In</Link>}
        />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-16 text-secondary-950">
      <div className="container-custom">
        <h1 className="text-4xl md:text-5xl font-black text-secondary-950 mb-10 tracking-tight flex items-baseline gap-4">
          Shopping Cart {itemCount > 0 && <span className="text-primary-600 font-black text-2xl tracking-tighter">({itemCount})</span>}
        </h1>

        {items.length === 0 ? (
          <EmptyState
            icon={RiShoppingBagLine}
            title="Your cart is empty"
            description="Looks like you haven't added any products yet."
            action={<Link to="/shop" className="btn-primary">Browse Products</Link>}
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = item.product;
                const image = product.images?.[0]?.url || `https://placehold.co/120x120/e2e8f0/64748b?text=${encodeURIComponent(product.name)}`;
                return (
                  <div key={item.id} className="bg-white border border-primary-100 rounded-[2.5rem] p-6 flex items-start gap-6 animate-fade-in transition-all hover:shadow-xl hover:shadow-primary-100/30 group relative">
                    <Link to={`/product/${product.slug}`} className="relative overflow-hidden rounded-3xl bg-primary-50/50 p-4 block flex-shrink-0">
                      <img src={image} alt={product.name} className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.src = 'https://placehold.co/120x120'; }} />
                    </Link>
                    <div className="flex-1 min-w-0 pt-2">
                      <Link to={`/product/${product.slug}`}>
                        <p className="text-[10px] text-primary-600 font-black uppercase tracking-[0.2em] mb-1.5">{product.brand?.name}</p>
                        <h3 className="font-black text-secondary-950 hover:text-primary-600 transition-colors line-clamp-2 text-base leading-tight mb-2">{product.name}</h3>
                      </Link>
                      <div className="flex gap-2 mb-4">
                        {item.color && <span className="text-[10px] bg-primary-50 text-secondary-600 px-3 py-1 rounded-full border border-primary-100 font-bold uppercase tracking-widest">{item.color}</span>}
                        {item.storage && <span className="text-[10px] bg-primary-50 text-secondary-600 px-3 py-1 rounded-full border border-primary-100 font-bold uppercase tracking-widest">{item.storage}</span>}
                      </div>
                      <p className="font-black text-secondary-950 text-xl tracking-tighter">{formatPrice(item.unitPrice || product.finalPrice)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <button onClick={() => removeItem(item.id)} className="p-2 text-secondary-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <RiDeleteBin6Line size={18} />
                      </button>
                      <div className="flex items-center border border-primary-100 rounded-2xl overflow-hidden bg-primary-50/50">
                        <button onClick={() => updateItem(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="w-10 h-10 flex items-center justify-center hover:bg-primary-100 text-secondary-950 disabled:opacity-40 transition-colors font-black text-lg">-</button>
                        <span className="w-8 text-center text-sm font-black text-secondary-950">{item.quantity}</span>
                        <button onClick={() => updateItem(item.id, item.quantity + 1)} disabled={item.quantity >= product.stock} className="w-10 h-10 flex items-center justify-center hover:bg-primary-100 text-secondary-950 disabled:opacity-40 transition-colors font-black text-lg">+</button>
                      </div>
                      <p className="font-black text-primary-600 text-base tracking-tighter mt-auto">{formatPrice((item.unitPrice || product.finalPrice) * item.quantity)}</p>
                    </div>
                  </div>
                );
              })}
               <Link to="/shop" className="btn-ghost w-full justify-center py-5 border-2 border-dashed border-primary-100 rounded-[2rem] hover:border-primary-600 hover:bg-primary-50 transition-all text-primary-600 font-black uppercase tracking-widest text-xs">
                + Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-primary-50 border border-primary-100 rounded-[2.5rem] p-8 sticky top-32 shadow-xl shadow-primary-100/20">
                <h2 className="font-black text-secondary-950 text-2xl mb-8 tracking-tight flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary-600 rounded-full" /> Checkout Status
                </h2>
                <div className="space-y-5 text-sm font-bold">
                  <div className="flex justify-between text-secondary-500">
                    <span className="uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="text-secondary-950 text-lg tracking-tighter">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-secondary-500">
                    <span className="uppercase tracking-widest text-[10px]">Delivery</span>
                    <span className={`text-lg tracking-tighter ${deliveryFee === 0 ? 'text-green-600' : 'text-secondary-950'}`}>
                      {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  {deliveryFee === 0 && (
                    <p className="text-[10px] text-green-600 bg-white rounded-xl px-4 py-3 border border-green-100 font-black uppercase tracking-[0.2em] text-center shadow-sm">🚀 Free Shipping Active!</p>
                  )}
                  {deliveryFee > 0 && (
                    <p className="text-[10px] text-secondary-500 bg-white rounded-xl px-4 py-3 border border-primary-100 font-black uppercase tracking-[0.2em] text-center shadow-sm">Add <span className="text-primary-600">{formatPrice(50000 - subtotal)}</span> for FREE shipping</p>
                  )}
                  <div className="border-t border-primary-100 pt-6 mt-4">
                    <div className="flex justify-between font-black text-3xl text-secondary-950">
                      <span className="text-sm uppercase tracking-widest self-center text-secondary-400">Total</span>
                      <span className="text-primary-600 tracking-tighter">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
                <Link to="/checkout" className="btn-primary w-full mt-10 py-4 text-sm uppercase tracking-[0.2em] shadow-glow">
                  Checkout Now <RiArrowRightLine size={20} className="ml-2" />
                </Link>
                <div className="mt-6 text-center text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                  🛡️ Secure Checkout & SSL Encrypted
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
