import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { RiSecurePaymentLine, RiBankCardFill } from 'react-icons/ri';

export default function PaymentPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { fetchCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });

  // Redirect if no checkout data was provided
  useEffect(() => {
    if (!state?.checkoutData) {
      toast.error('Invalid checkout session');
      navigate('/checkout');
    }
  }, [state, navigate]);

  if (!state?.checkoutData) return null;

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 1500));

    try {
      // Send the order to backend since "card" was authorized locally
      const { data } = await api.post('/orders', state.checkoutData);
      await fetchCart();
      toast.success('Payment successful!');
      navigate(`/order-success/${data.data.order.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary-50 min-h-[80vh] flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-card p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary-50 text-primary-600 flex items-center justify-center rounded-2xl mb-4">
            <RiSecurePaymentLine size={32} />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Secure Payment</h1>
          <p className="text-secondary-500 text-sm mt-1">Enter your credit or debit card details below</p>
        </div>

        <form onSubmit={handlePayment} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">
              <RiBankCardFill /> Card Number
            </label>
            <input 
              type="text" 
              maxLength="19"
              placeholder="0000 0000 0000 0000" 
              required
              className="input tracking-widest font-mono"
              value={card.number}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
                setCard({ ...card, number: formatted });
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-secondary-700 block mb-1.5">Cardholder Name</label>
            <input 
              type="text" 
              placeholder="John Doe" 
              required
              className="input uppercase"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">Expiry Date</label>
              <input 
                type="text" 
                maxLength="5"
                placeholder="MM/YY" 
                required
                className="input font-mono"
                value={card.expiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                  setCard({ ...card, expiry: val });
                }} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">CVC</label>
              <input 
                type="text" 
                maxLength="4"
                placeholder="123" 
                required
                className="input font-mono"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-secondary-100">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 text-lg font-bold shadow-glow flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing Payment...
                </>
              ) : (
                'Pay Now'
              )}
            </button>
            <p className="text-xs text-center text-secondary-400 mt-4 flex items-center justify-center gap-1">
              <RiSecurePaymentLine /> 256-bit SSL encryption. Your data is secure.
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}
