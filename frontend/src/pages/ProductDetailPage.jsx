import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  RiHeartLine, RiHeartFill, RiShoppingCartLine, RiFlashlightLine,
  RiStarFill, RiStarLine, RiShieldCheckLine, RiTruckLine, RiArrowLeftLine,
  RiCheckLine,
} from 'react-icons/ri';
import api from '../lib/api';
import { formatPrice, parseColors, parseStorageOptions } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { PageLoader, ErrorState, SectionHeader } from '../components/ui';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToCart, isLoading: cartLoading } = useCartStore();
  const { toggle, isInWishlist } = useWishlistStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data.data.product),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ productId, rating, comment }) => api.post(`/products/${productId}/reviews`, { rating, comment }),
    onSuccess: () => {
      toast.success('Review submitted for approval!');
      setReviewForm({ rating: 5, comment: '' });
      refetch();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit review')
  });


  const { data: relatedData } = useQuery({
    queryKey: ['products', 'related', data?.brandId],
    queryFn: () => api.get('/products', { params: { brand: data?.brand?.slug, limit: 4 } }).then((r) => r.data.data.products),
    enabled: !!data?.brandId,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <ErrorState onRetry={refetch} message={isError ? "Error loading product" : "Product not found"} />;

  const product = data;
  const colors = parseColors(product?.colors);
  const rawStorageOptions = parseStorageOptions(product?.storageOptions);
  const storageOptions = rawStorageOptions.map(opt => typeof opt === 'string' ? { capacity: opt, price: null } : opt);
  
  let currentBasePrice = product?.basePrice ?? 0;
  if (selectedStorage) {
    const st = storageOptions.find(o => o.capacity === selectedStorage);
    if (st && st.price !== null && st.price !== '') {
      currentBasePrice = Number(st.price);
    }
  }
  const currentFinalPrice = currentBasePrice * (1 - (product?.discountPercent || 0) / 100);

  const inWishlist = product?.id ? isInWishlist(product.id) : false;
  
  const images = product?.images?.length > 0
    ? product.images.map((img) => img.url)
    : [`https://placehold.co/600x600/e2e8f0/64748b?text=${encodeURIComponent(product?.name || 'Product')}`];

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please sign in'); navigate('/login'); return; }
    await addToCart(product.id, quantity, selectedColor, selectedStorage);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { toast.error('Please sign in'); navigate('/login'); return; }
    await addToCart(product.id, quantity, selectedColor, selectedStorage);
    navigate('/checkout');
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please sign in'); navigate('/login'); return; }
    await toggle(product.id);
  };



  const submitReview = (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please sign in to review');
    if (!reviewForm.comment.trim()) return toast.error('Please write a comment');
    reviewMutation.mutate({ productId: product.id, ...reviewForm });
  };

  const SPEC_ROWS = [
    ['Category', product.category?.name],
    ['Brand', product.brand?.name],
    ['Operating System', product.os],
    ['Processor', product.processor],
    ['RAM', product.ram],
    ['Storage', product.storage],
    ['Display', product.display],
    ['Main Camera', product.camera],
    ['Front Camera', product.frontCamera],
    ['Battery', product.battery],
    ['5G Support', product.has5G ? 'Yes' : 'No'],
    ['Weight', product.weight],
    ['Dimensions', product.dimensions],
  ].filter(([, val]) => val);

  return (
    <div className="bg-white min-h-screen text-secondary-950">
      <div className="container-custom py-12">
        {/* Breadcrumb */}
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm mb-10 group font-bold uppercase tracking-widest text-secondary-400">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <span className="text-secondary-200">/</span>
          <Link to="/shop" className="hover:text-primary-600 transition-colors">Shop</Link>
          {product.category && (
            <>
              <span className="text-secondary-200">/</span>
              <Link to={`/shop?category=${product.category.slug}`} className="hover:text-primary-600 transition-colors uppercase">{product.category.name}</Link>
            </>
          )}
          <span className="text-secondary-200">/</span>
          <span className="text-secondary-950 truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-[2.5rem] bg-white border border-primary-100 p-10 shadow-xl shadow-primary-100/30 relative group">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                onError={(e) => { e.target.src = 'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image'; }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === selectedImage ? 'border-primary-500' : 'border-secondary-200 hover:border-secondary-300'}`}
                  >
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/64x64'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="badge-primary shadow-sm px-3 py-1.5 uppercase font-black tracking-widest text-[10px]">{product.brand?.name}</span>
                <Link 
                  to={`/shop?category=${product.category?.slug}`} 
                  className="badge bg-secondary-100 text-secondary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm px-3 py-1.5 uppercase font-black tracking-widest text-[10px]"
                >
                  {product.category?.name}
                </Link>
                {product.has5G && <span className="badge bg-primary-600 text-white px-3 py-1.5 uppercase font-black tracking-widest text-[10px]">5G</span>}
                {product.isNewArrival && <span className="badge-new shadow-sm px-3 py-1.5 uppercase font-black tracking-widest text-[10px]">New</span>}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-secondary-950 leading-tight mb-4 tracking-tight">{product.name}</h1>
              {product.shortDesc && <p className="text-secondary-600 text-lg leading-relaxed font-medium">{product.shortDesc}</p>}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s}>
                    {s <= Math.round(product.rating) ? <RiStarFill size={18} className="text-amber-400" /> : <RiStarLine size={18} className="text-secondary-200" />}
                  </span>
                ))}
              </div>
              <span className="font-semibold text-secondary-900">{product.rating}</span>
              <span className="text-secondary-400 text-sm">({product.reviewCount} reviews)</span>
              {product.soldCount > 0 && <span className="text-secondary-400 text-sm">· {product.soldCount} sold</span>}
            </div>

            {/* Price */}
            <div className="bg-primary-50 border border-primary-100 rounded-3xl p-8">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-secondary-950 tracking-tighter">{formatPrice(currentFinalPrice)}</span>
                {product.discountPercent > 0 && (
                  <>
                    <span className="text-2xl text-secondary-400 line-through mb-1 font-bold">{formatPrice(currentBasePrice)}</span>
                    <span className="badge-sale mb-2 font-black">-{Math.round(product.discountPercent)}%</span>
                  </>
                )}
              </div>
              {product.discountPercent > 0 && (
                <p className="text-primary-600 text-sm font-black uppercase tracking-widest mt-4 flex items-center gap-2">
                  <RiCheckLine size={18} /> You save {formatPrice(currentBasePrice - currentFinalPrice)}!
                </p>
              )}
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-secondary-700 mb-2.5">
                  Color: <span className="text-secondary-900">{selectedColor || 'Select color'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedColor === color ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-secondary-200 text-secondary-600 hover:border-secondary-300'}`}
                    >
                      {selectedColor === color && <RiCheckLine size={14} className="inline mr-1.5" />}
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage Selection */}
            {storageOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-secondary-700 mb-2.5">
                  Storage: <span className="text-secondary-900">{selectedStorage || 'Select storage'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {storageOptions.map((s) => (
                    <button
                      key={s.capacity}
                      onClick={() => setSelectedStorage(selectedStorage === s.capacity ? '' : s.capacity)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedStorage === s.capacity ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-secondary-200 text-secondary-600 hover:border-secondary-300'}`}
                    >
                      {s.capacity}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold text-secondary-700">Quantity:</p>
              <div className="flex items-center border border-secondary-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary-100 transition-colors text-secondary-700 font-bold text-lg">-</button>
                <span className="w-12 text-center font-semibold text-secondary-900">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary-100 transition-colors text-secondary-700 font-bold text-lg">+</button>
              </div>
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleAddToCart} disabled={cartLoading || product.stock === 0} className="flex-1 btn-outline py-3.5">
                <RiShoppingCartLine size={20} />
                Add to Cart
              </button>
              <button onClick={handleBuyNow} disabled={cartLoading || product.stock === 0} className="flex-1 btn-primary py-3.5">
                <RiFlashlightLine size={20} />
                Buy Now
              </button>
              <button onClick={handleWishlist} className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${inWishlist ? 'border-red-200 bg-red-50 text-red-500' : 'border-secondary-200 text-secondary-400 hover:border-red-200 hover:text-red-500'}`}>
                {inWishlist ? <RiHeartFill size={22} /> : <RiHeartLine size={22} />}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 p-3 bg-secondary-50 rounded-xl">
                <RiShieldCheckLine size={20} className="text-green-600" />
                <div>
                  <p className="text-xs font-semibold text-secondary-800">2-Year Warranty</p>
                  <p className="text-xs text-secondary-500">Manufacturer guaranteed</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-secondary-50 rounded-xl">
                <RiTruckLine size={20} className="text-primary-600" />
                <div>
                  <p className="text-xs font-semibold text-secondary-800">Free Shipping</p>
                  <p className="text-xs text-secondary-500">On orders over $500</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description & Specs */}
        <div className="mb-16">
          <div className="border-b border-secondary-200 mb-8 overflow-x-auto no-scrollbar">
            <div className="flex gap-8">
              {['Description', 'Specifications', 'Reviews'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => {
                    if (tab === 'Reviews') {
                      document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="pb-3 border-b-2 border-primary-600 text-primary-600 font-semibold text-sm px-1 whitespace-nowrap"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-black text-secondary-950 mb-6 tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary-600 rounded-full" />
                Product Description
              </h2>
              <p className="text-secondary-600 leading-relaxed whitespace-pre-wrap font-medium text-lg">{product.description}</p>
            </div>
            <div>
              <h2 className="text-2xl font-black text-secondary-950 mb-6 tracking-tight flex items-center gap-3">
                <div className="w-1.5 h-8 bg-secondary-950 rounded-full" />
                Specifications
              </h2>
              <div className="rounded-[2rem] border border-primary-100 overflow-hidden shadow-xl shadow-primary-100/20 bg-white">
                <table className="w-full text-base">
                  <tbody className="divide-y divide-primary-50">
                    {SPEC_ROWS.map(([label, value], i) => (
                      <tr key={label} className="group hover:bg-primary-50 transition-colors">
                        <td className="px-6 py-4 text-secondary-500 font-bold w-1/2 text-sm uppercase tracking-widest">{label}</td>
                        <td className="px-6 py-4 text-secondary-950 font-black">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section with ID for scrolling */}
        <div id="reviews-section" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-secondary-200">
            <h2 className="text-2xl font-bold text-secondary-900">Customer Reviews</h2>
            <div className="flex items-center gap-2 bg-secondary-50 px-4 py-2 rounded-xl">
              <RiStarFill className="text-amber-400" size={20} />
              <span className="font-bold text-secondary-900 text-lg">{product.rating}</span>
              <span className="text-secondary-500 text-sm">({product.reviewCount})</span>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-10">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24 bg-gradient-to-br from-white to-secondary-50 border border-secondary-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-secondary-900 mb-4">Write a Review</h3>
                <form onSubmit={submitReview} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary-700 block mb-2">Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          {s <= reviewForm.rating ? <RiStarFill size={28} className="text-amber-400 drop-shadow-sm" /> : <RiStarLine size={28} className="text-secondary-300 hover:text-amber-300" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary-700 block mb-2">Your Review</label>
                    <textarea
                      required
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="What did you like or dislike? What did you use this product for?"
                      className="input min-h-[120px] resize-none focus:ring-primary-500/20"
                    />
                  </div>
                  <button type="submit" disabled={reviewMutation.isPending} className="btn-primary w-full py-3 shadow-sm hover:shadow-glow transition-all">
                    {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>

            {/* Review List */}
            <div className="lg:col-span-2 space-y-4">
              {product.reviews?.length > 0 ? (
                product.reviews.map((review) => (
                  <div key={review.id} className="card p-6 bg-white border border-secondary-100 hover:border-primary-200 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center text-primary-700 font-bold shadow-sm">
                          {review.user?.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-secondary-900">{review.user?.firstName} {review.user?.lastName}</p>
                          <p className="text-xs text-secondary-400 font-medium">{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg">
                        {[1, 2, 3, 4, 5].map((s) => <RiStarFill key={s} size={14} className={s <= review.rating ? 'text-amber-500' : 'text-amber-200'} />)}
                      </div>
                    </div>
                    {review.title && <p className="font-bold text-secondary-900 text-sm mb-2">{review.title}</p>}
                    <p className="text-secondary-600 text-sm leading-relaxed">{review.comment || review.body}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-secondary-50 rounded-2xl border-2 border-dashed border-secondary-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-secondary-400">
                    <RiStarFill size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-secondary-900 mb-1">No reviews yet</h3>
                  <p className="text-secondary-500 text-sm max-w-sm mx-auto">Be the first to review this product and help other customers make informed decisions.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedData?.length > 1 && (
          <div>
            <SectionHeader title="Related Products" subtitle="More from the same brand" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedData.filter((p) => p.id !== product.id).slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
