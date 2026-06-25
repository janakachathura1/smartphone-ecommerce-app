import React from 'react';
import { formatPrice } from '../../lib/utils';
import { RiTruckLine, RiSecurePaymentLine } from 'react-icons/ri';

export const CheckoutSummary = ({ items, subtotal, deliveryFee, placing }) => {
  const total = subtotal + deliveryFee;

  return (
    <div className="card p-6 md:p-8 sticky top-24 shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-secondary-100 bg-white">
      <h2 className="font-black text-secondary-950 text-xl tracking-tight mb-6 pb-4 border-b border-secondary-100">Order Summary</h2>

      {/* Cart Items List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-2 hover:bg-secondary-50 rounded-xl transition-colors">
            <div className="w-16 h-16 rounded-xl bg-secondary-100 border border-secondary-200 p-1 flex-shrink-0">
               <img
                  src={item.product.images?.[0]?.url || 'https://placehold.co/64x64'}
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => { e.target.src = 'https://placehold.co/64x64'; }}
               />
            </div>
            <div className="flex-1 min-w-0 py-1">
               <h3 className="text-sm font-bold text-secondary-900 line-clamp-2 leading-tight">{item.product.name}</h3>
               {(item.color || item.storage) && (
                 <p className="text-[10px] uppercase font-bold text-secondary-500 mt-1 tracking-widest">
                   {item.storage && `${item.storage}`} {item.color && `| ${item.color}`}
                 </p>
               )}
               <div className="flex justify-between items-center mt-2">
                 <p className="text-xs text-secondary-500 font-medium">Qty: {item.quantity}</p>
                 <p className="text-sm font-black text-secondary-950">{formatPrice((item.unitPrice || item.product.finalPrice) * item.quantity)}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Estimate Box */}
      <div className="mt-6 bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-start gap-3">
         <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600">
           <RiTruckLine size={16} />
         </div>
         <div>
           <p className="text-xs font-bold text-primary-900 leading-tight">Estimated Delivery</p>
           <p className="text-[10px] text-primary-700 mt-0.5">2 - 5 Working Days via Courier</p>
         </div>
      </div>

      {/* Calculation Totals */}
      <div className="space-y-4 text-sm mt-6">
        <div className="flex justify-between items-center text-secondary-600 font-medium">
          <span>Cart Subtotal</span>
          <span className="text-secondary-900">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between items-center text-secondary-600 font-medium">
          <span>Shipping Fee</span>
          {deliveryFee === 0 ? (
             <span className="text-green-600 font-black uppercase text-xs tracking-widest bg-green-50 px-2 py-0.5 rounded">Free</span>
          ) : (
             <span className="text-secondary-900">{formatPrice(deliveryFee)}</span>
          )}
        </div>

        <div className="border-t border-secondary-200 pt-5 mt-5">
           <div className="flex justify-between items-end">
             <span className="text-base font-black text-secondary-950 uppercase tracking-tight line-clamp-1">Grand Total</span>
             <span className="text-2xl font-black tracking-tighter text-primary-700 leading-none">
               {formatPrice(total)}
             </span>
           </div>
        </div>
      </div>

      <button type="submit" disabled={placing || items.length === 0} className="w-full mt-8 py-4 bg-secondary-950 hover:bg-primary-600 focus:ring-4 focus:ring-primary-500/20 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_20px_rgb(0,0,0,0.1)] hover:shadow-[0_15px_30px_rgb(37,99,235,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
        {placing ? 'Processing...' : (
          <>
            <RiSecurePaymentLine size={18} /> Pay {formatPrice(total)}
          </>
        )}
      </button>
      
      <p className="text-center text-[10px] uppercase font-bold tracking-widest text-secondary-400 mt-4 flex items-center justify-center gap-1">
        Your information is safe
      </p>
    </div>
  );
};
