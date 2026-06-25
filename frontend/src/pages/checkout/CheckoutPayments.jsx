import React, { useState } from 'react';
import { RiBankCardLine, RiBankLine, RiMoneyDollarCircleLine, RiSmartphoneLine, RiShieldCheckFill, RiUploadCloud2Line } from 'react-icons/ri';
import { BANKS, INSTALLMENT_DURATIONS } from '../../lib/lankaData';

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', desc: 'Secure payment via Visa, Mastercard, Amex', icon: RiBankCardLine },
  { id: 'ezcash', label: 'eZ Cash', desc: 'Pay using your Dialog, Hutch, or Airtel mobile', icon: RiSmartphoneLine },
  { id: 'bank', label: 'Bank Transfer', desc: 'Direct transfer to our Sri Lankan bank accounts', icon: RiBankLine },
  { id: 'installment', label: 'Installment Plan', desc: 'Pay in 4, 6, 12, or 24 months (Selected Banks)', icon: RiMoneyDollarCircleLine },
];

export const CardPaymentPanel = () => (
  <div className="p-6 bg-secondary-50 border-t border-secondary-100 rounded-b-2xl animate-fade-in space-y-5">
    <div className="flex items-center gap-2 mb-2">
       <RiShieldCheckFill className="text-green-500" size={18} />
       <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Secure 256-bit Encrypted Checkout</p>
    </div>
    <div className="relative">
      <label className="text-xs font-bold text-secondary-800 mb-1.5 block">Card Number *</label>
      <input type="text" placeholder="0000 0000 0000 0000" className="input text-sm py-3 font-mono tracking-widest" />
      <div className="absolute top-[34px] right-3 flex gap-1 opacity-50">
         <div className="w-8 h-5 bg-secondary-300 rounded" />
         <div className="w-8 h-5 bg-secondary-300 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-bold text-secondary-800 mb-1.5 block">Expiry Date *</label>
        <input type="text" placeholder="MM/YY" className="input text-sm py-3 font-mono" />
      </div>
      <div>
        <label className="text-xs font-bold text-secondary-800 mb-1.5 block">CVV *</label>
        <input type="text" placeholder="123" className="input text-sm py-3 font-mono" />
      </div>
    </div>
    <div>
      <label className="text-xs font-bold text-secondary-800 mb-1.5 block">Cardholder Name *</label>
      <input type="text" placeholder="JOHN DOE" className="input text-sm py-3 uppercase" />
    </div>
    <p className="text-[11px] text-secondary-500 leading-relaxed">
       * This is a visual representation of a secure payment gateway. In a live environment, this will be securely processed by Stripe or PayHere.
    </p>
  </div>
);

export const EZCashPanel = ({ register, errors }) => (
  <div className="p-6 bg-secondary-50 border-t border-secondary-100 rounded-b-2xl animate-fade-in space-y-5">
    <div className="bg-white p-4 rounded-xl border border-orange-200">
       <h4 className="font-bold text-orange-600 text-sm mb-2 flex items-center gap-2">
          Instructions for eZ Cash Payment
       </h4>
       <ol className="list-decimal list-inside text-xs text-secondary-600 space-y-1.5 mb-4">
         <li>Dial #111# from your Dialog, Hutch or Airtel mobile.</li>
         <li>Select "Pay Merchant".</li>
         <li>Enter our Merchant Code: <b>ULTRAMOBILE</b></li>
         <li>Enter the exact Grand Total amount.</li>
         <li>Enter your PIN to confirm.</li>
       </ol>
       <p className="text-[10px] text-secondary-500 italic">Merchant parameters can be updated via Admin Dashboard.</p>
    </div>
    
    <div>
      <label className="text-sm font-bold text-secondary-800 mb-1.5 block">eZ Cash Mobile Number *</label>
      <input type="text" placeholder="07X XXX XXXX" {...register('ezcashNumber')} className={`input text-sm py-3 ${errors.ezcashNumber ? 'border-red-500' : ''}`} />
      {errors.ezcashNumber && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.ezcashNumber.message}</p>}
    </div>
    <div>
      <label className="text-sm font-bold text-secondary-800 mb-1.5 block">Payment Reference ID (Optional)</label>
      <input type="text" placeholder="Ref ID received via SMS" {...register('ezcashRef')} className="input text-sm py-3" />
    </div>
  </div>
);

export const BankTransferPanel = ({ register, errors, setValue, watch }) => {
  const selectedBank = watch('bankTransferBank');
  const [slipName, setSlipName] = useState('');
  
  const handleFileChange = (e) => {
    if(e.target.files?.[0]) {
       setSlipName(e.target.files[0].name);
       setValue('bankTransferSlip', e.target.files[0]);
    }
  };

  return (
    <div className="p-6 bg-secondary-50 border-t border-secondary-100 rounded-b-2xl animate-fade-in space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {BANKS.map((b) => (
          <label key={b.id} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${selectedBank === b.id ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-secondary-200 bg-white hover:border-primary-200'}`}>
             <input type="radio" value={b.id} {...register('bankTransferBank')} className="sr-only" />
             <span className="text-2xl">{b.icon}</span>
             <span className="text-xs font-bold text-center text-secondary-900">{b.name}</span>
          </label>
        ))}
      </div>
      {errors.bankTransferBank && <p className="text-red-500 text-xs mt-1 font-medium">{errors.bankTransferBank.message}</p>}

      {selectedBank && (
        <div className="bg-white p-5 rounded-xl border border-secondary-200 space-y-3">
           <h4 className="font-bold text-secondary-900 text-sm border-b pb-2">Account Details</h4>
           <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-secondary-500">Bank:</span>
              <span className="font-bold text-secondary-900">{BANKS.find(b=>b.id===selectedBank)?.name}</span>
              <span className="text-secondary-500">Account Name:</span>
              <span className="font-bold text-secondary-900 uppercase">Ultramobile (PVT) LTD</span>
              <span className="text-secondary-500">Account No:</span>
              <span className="font-mono font-bold text-primary-700 text-sm">183 948 2901</span>
              <span className="text-secondary-500">Branch:</span>
              <span className="font-bold text-secondary-900">Colombo Colpetty</span>
           </div>
           
           <div className="mt-5 pt-4 border-t border-secondary-100">
             <label className="text-xs font-bold text-secondary-800 mb-2 block">Upload Transfer Slip *</label>
             <label className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-secondary-50 transition-colors ${errors.bankTransferSlip ? 'border-red-400 bg-red-50' : 'border-secondary-300'}`}>
               <RiUploadCloud2Line size={32} className="text-secondary-400 mb-2" />
               <span className="text-xs font-medium text-secondary-600">
                 {slipName ? slipName : 'Click to upload PDF, JPG, PNG'}
               </span>
               <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
             </label>
             {errors.bankTransferSlip && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.bankTransferSlip.message}</p>}
           </div>
        </div>
      )}
    </div>
  );
};

export const InstallmentPanel = ({ register, errors, watch, itemsSubtotal }) => {
  const selectedBank = watch('installmentBank');
  const selectedDuration = watch('installmentDuration');

  return (
    <div className="p-6 bg-secondary-50 border-t border-secondary-100 rounded-b-2xl animate-fade-in space-y-5">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-5">
         <p className="text-xs text-blue-800 font-medium">Installments are only available for selected credit cards. A processing fee of 2-5% may apply depending on the bank.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
         <div className="col-span-2 md:col-span-1">
            <label className="text-xs font-bold text-secondary-800 mb-1.5 block">Select Bank *</label>
            <select {...register('installmentBank')} className={`input text-sm py-2.5 bg-white ${errors.installmentBank ? 'border-red-500' : ''}`}>
              <option value="">- Bank -</option>
              {BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.installmentBank && <p className="text-red-500 text-[10px] mt-1">{errors.installmentBank.message}</p>}
         </div>
         <div className="col-span-2 md:col-span-1">
            <label className="text-xs font-bold text-secondary-800 mb-1.5 block">Duration *</label>
            <select {...register('installmentDuration')} className={`input text-sm py-2.5 bg-white ${errors.installmentDuration ? 'border-red-500' : ''}`}>
              <option value="">- Months -</option>
              {INSTALLMENT_DURATIONS.map(d => <option key={d} value={d}>{d} Months</option>)}
            </select>
            {errors.installmentDuration && <p className="text-red-500 text-[10px] mt-1">{errors.installmentDuration.message}</p>}
         </div>
      </div>

      {selectedBank && selectedDuration && (
         <div className="p-5 mt-4 border border-secondary-200 rounded-xl bg-white shadow-sm">
            <h4 className="text-sm font-black text-secondary-900 mb-3 border-b pb-2">Calculation Preview</h4>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center text-secondary-600">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-secondary-900">LKR {itemsSubtotal.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-secondary-600">
                  <span>Processing Handling (0%)</span>
                  <span className="font-bold text-secondary-900">LKR 0.00</span>
               </div>
               <div className="flex justify-between items-center text-primary-700 bg-primary-50 p-2 rounded-lg mt-2">
                  <span className="font-bold">Estimated Monthly</span>
                  <span className="font-black text-lg">LKR {(itemsSubtotal / parseInt(selectedDuration)).toFixed(2)}</span>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
