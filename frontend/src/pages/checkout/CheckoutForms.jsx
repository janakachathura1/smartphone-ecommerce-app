import React from 'react';
import { PROVINCES, CITIES_BY_PROVINCE } from '../../lib/lankaData';

export const InputField = ({ name, label, placeholder, register, errors, type = 'text', half = false, optional = false }) => (
  <div className={half ? 'col-span-1' : 'col-span-2'}>
    <label className="text-sm font-bold text-secondary-800 mb-1.5 block">
      {label} {!optional && <span className="text-red-500">*</span>}
      {optional && <span className="text-secondary-400 font-normal ml-2">(Optional)</span>}
    </label>
    <input type={type} placeholder={placeholder} {...register(name)} className={`input text-sm py-2.5 bg-white border-secondary-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all ${errors[name] ? 'border-red-500 ring-2 ring-red-100' : ''}`} />
    {errors[name] && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors[name].message}</p>}
  </div>
);

export const ContactInformation = ({ register, errors }) => (
  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-secondary-100">
    <div className="flex items-center gap-3 mb-6">
       <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-black flex items-center justify-center text-sm">1</div>
       <h2 className="font-black text-secondary-950 text-xl tracking-tight">Contact Information</h2>
    </div>
    <div className="grid grid-cols-2 gap-5">
      <InputField name="fullName" label="Full Name" placeholder="John Doe" register={register} errors={errors} />
      <InputField name="phone" label="Mobile Number" placeholder="07X XXX XXXX" register={register} errors={errors} half />
      <InputField name="secondaryPhone" label="Alt Number" placeholder="07X XXX XXXX" register={register} errors={errors} half optional />
      <InputField name="email" label="Email Address" placeholder="john@example.com" type="email" register={register} errors={errors} />
    </div>
  </div>
);

export const ShippingInformation = ({ register, errors, watch, setValue }) => {
  const selectedProvince = watch('province');
  
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-secondary-100 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-black flex items-center justify-center text-sm">2</div>
        <h2 className="font-black text-secondary-950 text-xl tracking-tight">Shipping Address</h2>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className="text-sm font-bold text-secondary-800 mb-1.5 block">Country <span className="text-red-500">*</span></label>
          <select {...register('country')} className="input text-sm py-2.5 bg-secondary-50 cursor-not-allowed">
            <option value="Sri Lanka">Sri Lanka</option>
          </select>
        </div>
        
        <div className="col-span-1">
          <label className="text-sm font-bold text-secondary-800 mb-1.5 block">Province <span className="text-red-500">*</span></label>
          <select 
            {...register('province')} 
            className={`input text-sm py-2.5 bg-white border-secondary-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all ${errors.province ? 'border-red-500' : ''}`}
            onChange={(e) => {
               register('province').onChange(e);
               setValue('city', ''); // reset city when province changes
            }}
          >
            <option value="">Select Province</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p} Province</option>)}
          </select>
          {errors.province && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.province.message}</p>}
        </div>

        <div className="col-span-1">
          <label className="text-sm font-bold text-secondary-800 mb-1.5 block">City <span className="text-red-500">*</span></label>
          <select 
            {...register('city')} 
            disabled={!selectedProvince}
            className={`input text-sm py-2.5 bg-white border-secondary-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all ${errors.city ? 'border-red-500' : ''} ${!selectedProvince ? 'bg-secondary-50 cursor-not-allowed' : ''}`}
          >
            <option value="">Select City</option>
            {selectedProvince && CITIES_BY_PROVINCE[selectedProvince]?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.city.message}</p>}
        </div>

        <InputField name="street" label="Street Address" placeholder="123 Main Street, Apt 4B" register={register} errors={errors} />
        <InputField name="zipCode" label="Postal Code" placeholder="00100" register={register} errors={errors} half />
        <InputField name="landmark" label="Landmark" placeholder="Near the supermarket" register={register} errors={errors} half optional />
      </div>
    </div>
  );
};

export const AccountCreation = ({ register, errors, watch }) => {
  const createAccount = watch('createAccount');
  
  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-secondary-100 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-black flex items-center justify-center text-sm">3</div>
        <h2 className="font-black text-secondary-950 text-xl tracking-tight">Account Creation</h2>
      </div>
      
      <label className="flex items-center gap-3 cursor-pointer mb-5 p-4 rounded-xl border border-secondary-100 bg-secondary-50 hover:bg-secondary-100 transition-colors">
        <input type="checkbox" {...register('createAccount')} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 cursor-pointer" />
        <div>
           <p className="font-bold text-secondary-900 text-sm">Create an account for later</p>
           <p className="text-secondary-500 text-xs">Track orders securely and checkout faster next time.</p>
        </div>
      </label>

      {createAccount && (
        <div className="grid grid-cols-2 gap-5 animate-fade-in p-5 rounded-xl border border-primary-100 bg-primary-50/30">
          <InputField name="username" label="Account Username" placeholder="johndoe123" register={register} errors={errors} half />
          <InputField name="password" label="Account Password" type="password" placeholder="••••••••" register={register} errors={errors} half />
        </div>
      )}
    </div>
  );
};
