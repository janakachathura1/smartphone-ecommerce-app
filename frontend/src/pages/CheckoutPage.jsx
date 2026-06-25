import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { CALCULATE_SHIPPING } from '../lib/lankaData';

import { ContactInformation, ShippingInformation, AccountCreation } from './checkout/CheckoutForms';
import { PAYMENT_METHODS, CardPaymentPanel, EZCashPanel, BankTransferPanel, InstallmentPanel } from './checkout/CheckoutPayments';
import { CheckoutSummary } from './checkout/CheckoutSummary';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^(?:0|0094|\+94)?(?:7\d{8})$/, 'Invalid Sri Lankan mobile number format'),
  secondaryPhone: z.string().optional().or(z.literal('')),
  email: z.string().email('Valid email is required'),
  
  country: z.string().default('Sri Lanka'),
  province: z.string().min(1, 'Province is required'),
  city: z.string().min(1, 'City is required'),
  street: z.string().min(5, 'Street address is required'),
  zipCode: z.string().min(4, 'Postal code is required'),
  landmark: z.string().optional().or(z.literal('')),

  createAccount: z.boolean().default(false),
  username: z.string().optional(),
  password: z.string().optional(),

  paymentMethod: z.string().min(1, 'Payment method is required'),
  
  ezcashNumber: z.string().optional(),
  ezcashRef: z.string().optional(),
  
  bankTransferBank: z.string().optional(),
  bankTransferSlip: z.any().optional(),

  installmentBank: z.string().optional(),
  installmentDuration: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.createAccount) {
    if (!data.username || data.username.length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Username is required (min 3 chars)", path: ["username"] });
    }
    if (!data.password || data.password.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password is required (min 6 chars)", path: ["password"] });
    }
  }

  if (data.paymentMethod === 'ezcash') {
    if (!data.ezcashNumber || !/^(?:0|0094|\+94)?(?:7\d{8})$/.test(data.ezcashNumber)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Valid mobile number required for eZ Cash", path: ["ezcashNumber"] });
    }
  }

  if (data.paymentMethod === 'bank') {
    if (!data.bankTransferBank) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a bank", path: ["bankTransferBank"] });
    }
    if (!data.bankTransferSlip) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Payment slip is required", path: ["bankTransferSlip"] });
    }
  }

  if (data.paymentMethod === 'installment') {
    if (!data.installmentBank) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select a bank", path: ["installmentBank"] });
    }
    if (!data.installmentDuration) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Select installment duration", path: ["installmentDuration"] });
    }
  }
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, subtotal, fetchCart, clearCart } = useCartStore();
  const [placing, setPlacing] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { country: 'Sri Lanka', paymentMethod: 'card' }
  });

  const selectedProvince = watch('province');
  const selectedCity = watch('city');
  const paymentMethod = watch('paymentMethod');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data.data;
    }
  });

  const calculateDynamicShipping = (province, city, settings) => {
    if (!province || !city) return 0;
    // Base logic: If no settings, use default mock data rules
    const colomboFee = Number(settings?.deliveryFeeColombo) || 350;
    const westernFee = Number(settings?.deliveryFeeWestern) || 450;
    const otherFee = Number(settings?.deliveryFeeOther) || 750;

    if (province === 'Western' && city === 'Colombo') return colomboFee;
    if (province === 'Western') return westernFee;
    return otherFee;
  };

  const deliveryFee = calculateDynamicShipping(selectedProvince, selectedCity, settings);
  const items = cart?.items || [];

  const onSubmit = async (formData) => {
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    
    setPlacing(true);
    try {
      const payload = new FormData();
      
      const payloadData = {
        paymentMethod: formData.paymentMethod,
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          secondaryPhone: formData.secondaryPhone,
          email: formData.email,
          country: formData.country,
          province: formData.province,
          city: formData.city,
          street: formData.street,
          zipCode: formData.zipCode,
          landmark: formData.landmark
        },
        createAccount: formData.createAccount,
        accountData: formData.createAccount ? {
           username: formData.username,
           password: formData.password
        } : null,
        paymentDetails: {}
      };

      if(formData.paymentMethod === 'ezcash'){
         payloadData.paymentDetails = { ezcashNumber: formData.ezcashNumber, ezcashRef: formData.ezcashRef };
      }
      if(formData.paymentMethod === 'bank'){
         payloadData.paymentDetails = { bankId: formData.bankTransferBank };
         if(formData.bankTransferSlip) {
             payload.append('bankTransferSlip', formData.bankTransferSlip);
         }
      }
      if(formData.paymentMethod === 'installment'){
         payloadData.paymentDetails = { bankId: formData.installmentBank, duration: formData.installmentDuration };
      }

      payload.append('checkoutData', JSON.stringify(payloadData));

      // Simulate API call delay for premium feel
      await new Promise(r => setTimeout(r, 1500));
      
      // Real API Call would be here:
      // const { data } = await api.post('/orders/checkout', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      // await fetchCart();
      // navigate(`/order-success/${data.data.order.id}`);
      
      await clearCart(); // Visually empty the cart using the store action
      toast.success('Order placed successfully!');
      navigate('/order-success/demo-id');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen py-10">
      <div className="container-custom">
        {/* Simple Header */}
        <div className="mb-10 text-center">
           <h1 className="text-3xl md:text-4xl font-black text-secondary-950 tracking-tighter uppercase mb-2">Secure Checkout</h1>
           <p className="text-sm font-medium text-secondary-500">Fast, easy, and secure checkout for your flagship devices.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* LEFT COLUMN: FORMS */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <ContactInformation register={register} errors={errors} />
              <ShippingInformation register={register} errors={errors} watch={watch} setValue={setValue} />
              <AccountCreation register={register} errors={errors} watch={watch} />

              {/* PAYMENT METHOD SELECTOR */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-secondary-100 mt-6">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-black flex items-center justify-center text-sm">4</div>
                    <h2 className="font-black text-secondary-950 text-xl tracking-tight">Payment Method</h2>
                 </div>

                 <div className="space-y-4">
                    {PAYMENT_METHODS.map(({ id, label, desc, icon: Icon }) => (
                      <div key={id} className={`rounded-2xl border-2 transition-all ${paymentMethod === id ? 'border-primary-500 bg-white shadow-md' : 'border-secondary-100 bg-white hover:border-secondary-300'}`}>
                         <label className="flex items-center gap-4 p-5 cursor-pointer">
                            <input type="radio" value={id} {...register('paymentMethod')} className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-secondary-300 cursor-pointer" />
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${paymentMethod === id ? 'bg-primary-100 text-primary-700' : 'bg-secondary-50 text-secondary-500'}`}>
                              <Icon size={24} />
                            </div>
                            <div className="flex-1">
                               <p className="font-black text-secondary-900 text-sm">{label}</p>
                               <p className="text-secondary-500 text-xs mt-0.5">{desc}</p>
                            </div>
                         </label>
                         
                         {/* Dynamic rendering of payment panels */}
                         <div className={`overflow-hidden transition-all duration-300 ${paymentMethod === id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {id === 'card' && <CardPaymentPanel />}
                            {id === 'ezcash' && <EZCashPanel register={register} errors={errors} />}
                            {id === 'bank' && <BankTransferPanel register={register} errors={errors} setValue={setValue} watch={watch} settings={settings} />}
                            {id === 'installment' && <InstallmentPanel register={register} errors={errors} watch={watch} itemsSubtotal={subtotal} />}
                         </div>
                      </div>
                    ))}
                 </div>
                 {errors.paymentMethod && <p className="text-red-500 text-xs mt-2 font-medium">{errors.paymentMethod.message}</p>}
              </div>

            </div>

            {/* RIGHT COLUMN: SUMMARY */}
            <div className="lg:col-span-5 xl:col-span-4">
               <CheckoutSummary 
                 items={items} 
                 subtotal={subtotal} 
                 deliveryFee={deliveryFee} 
                 placing={placing} 
               />
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
