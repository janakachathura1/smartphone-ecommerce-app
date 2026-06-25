import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
  });
  
  const shopName = settings?.shopName || 'TechPulse';
  const loginTitle = settings?.loginTitle || 'Simplify management With Our dashboard.';
  const loginSubtitle = settings?.loginSubtitle || 'Simplify your e-commerce management with our user-friendly admin dashboard.';
  const loginImageUrl = settings?.loginImageUrl || '';

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ confirmPassword, ...data }) => {
    const result = await registerUser(data);
    if (result.success) navigate('/');
  };

  const handleSocialRegister = (provider) => {
    toast.error(`${provider} registration is not configured yet.`);
  };

  const Field = ({ name, type = 'text', placeholder, toggle, onToggle }) => (
    <div>
      <div className="relative">
        <input 
          type={type} 
          {...register(name)} 
          placeholder={placeholder} 
          className={`w-full bg-secondary-50 border border-secondary-100 rounded-xl px-4 py-3.5 text-secondary-900 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none text-sm placeholder:text-secondary-400 ${toggle ? 'pr-12' : ''} ${errors[name] ? 'border-red-400 ring-red-50' : ''}`} 
        />
        {toggle && (
          <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-primary-600 p-1 transition-colors">
            {type === 'text' ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
          </button>
        )}
      </div>
      {errors[name] && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side (Blue Banner) */}
        <div 
          className="hidden md:flex md:w-1/2 bg-primary-600 p-12 text-white flex-col justify-center rounded-[2rem] m-2 relative overflow-hidden"
          style={loginImageUrl ? { backgroundImage: `url(${loginImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {/* Overlay to ensure text remains readable */}
          {loginImageUrl && <div className="absolute inset-0 bg-primary-800/60 transition-all" />}
          
          {/* Subtle background circles for depth */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 z-0" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 z-0" />
          
          <div className="relative z-10">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 drop-shadow-lg">
              {loginTitle}
            </h1>
            <p className="text-white/90 text-sm mb-12 max-w-sm drop-shadow-md">
              {loginSubtitle}
            </p>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center gap-3 mb-6">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={shopName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">{shopName.charAt(0)}</span>
                </div>
              )}
              <span className="font-bold text-2xl text-secondary-900">{shopName}</span>
            </Link>
            <h2 className="text-3xl font-bold text-secondary-900 mb-2">Create Account</h2>
            <p className="text-secondary-500 text-sm">Join our community today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field name="firstName" placeholder="First Name" />
              <Field name="lastName" placeholder="Last Name" />
            </div>
            
            <Field name="email" type="email" placeholder="Email address" />
            
            <div className="grid grid-cols-2 gap-4">
              <Field name="phone" placeholder="Primary Phone" />
              <Field name="whatsapp" placeholder="WhatsApp (optional)" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field name="password" type={showPass ? 'text' : 'password'} placeholder="Password" toggle onToggle={() => setShowPass(!showPass)} />
              <Field name="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password" toggle onToggle={() => setShowConfirm(!showConfirm)} />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-primary-600 text-white rounded-xl py-3.5 font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/30 active:scale-[0.98] mt-2">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering...</span>
                </div>
              ) : 'Register'}
            </button>
          </form>

          <div className="my-8 relative flex items-center justify-center">
            <div className="absolute inset-x-0 border-t border-secondary-200" />
            <span className="relative bg-white px-4 text-xs text-secondary-400 uppercase tracking-wider font-semibold">Or register with</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => handleSocialRegister('Google')}
              className="flex items-center justify-center gap-2 border border-secondary-200 rounded-xl py-3 hover:bg-secondary-50 transition-colors"
            >
              <FcGoogle size={20} />
              <span className="text-sm font-semibold text-secondary-700">Google</span>
            </button>
            <button 
              type="button" 
              onClick={() => handleSocialRegister('Facebook')}
              className="flex items-center justify-center gap-2 border border-secondary-200 rounded-xl py-3 hover:bg-secondary-50 transition-colors"
            >
              <FaFacebook size={20} className="text-[#1877F2]" />
              <span className="text-sm font-semibold text-secondary-700">Facebook</span>
            </button>
          </div>

          <p className="text-center text-secondary-500 text-sm mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
