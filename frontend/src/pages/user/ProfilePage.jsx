import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import UserLayout from './UserLayout';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone || '' },
  });

  const { register: registerPw, handleSubmit: handlePwSubmit, reset: resetPw, formState: { errors: pwErrors } } = useForm();

  const fileInputRef = useRef(null);

  const onProfileSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await api.put('/users/profile', data);
      updateUser(res.data.data.user);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setSaving(true);
    try {
      const uploadRes = await api.post('/upload', formData);
      const avatarUrl = uploadRes.data.data.url;
      const updateRes = await api.put('/users/profile', { avatar: avatarUrl });
      updateUser(updateRes.data.data.user);
      toast.success('Photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      await api.patch('/users/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      resetPw();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="font-bold text-secondary-900 text-lg mb-5">Profile Information</h2>
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {/* Avatar ring */}
                <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-br from-primary-400 to-primary-700 shadow-xl shadow-primary-200/40">
                  <div className="w-full h-full rounded-full bg-secondary-100 overflow-hidden flex items-center justify-center relative">
                    {saving ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                        <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : null}
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-4xl font-black text-secondary-400 capitalize select-none">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary-600/70 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a1 1 0 001 1h16a1 1 0 001-1v-2.5M16.5 8.5l-4.5-5-4.5 5M12 3.5v12" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-wider">Change</span>
                    </div>
                  </div>
                </div>

                {/* Small camera badge */}
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-primary-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleAvatarUpload}
              />

              <div className="mt-4 text-center">
                <p className="text-sm font-black text-secondary-900">{user?.firstName} {user?.lastName}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="mt-2 text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center gap-1.5 mx-auto hover:underline transition-all disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {saving ? 'Uploading...' : 'Upload Profile Photo'}
                </button>
                <p className="text-[10px] text-secondary-400 font-medium mt-1">JPG, PNG or WebP · Max 5MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1.5">First Name</label>
                <input {...register('firstName', { required: 'Required' })} className="input" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1.5">Last Name</label>
                <input {...register('lastName', { required: 'Required' })} className="input" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">Email Address</label>
              <input value={user?.email || ''} disabled className="input bg-secondary-50 text-secondary-500 cursor-not-allowed" />
              <p className="text-xs text-secondary-400 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">Phone Number</label>
              <input {...register('phone')} placeholder="+880 170 0000000" className="input" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-secondary-900 text-lg mb-5">Change Password</h2>
          <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">Current Password</label>
              <input type="password" {...registerPw('currentPassword', { required: 'Required' })} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">New Password</label>
              <input type="password" {...registerPw('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} className="input" />
              {pwErrors.newPassword && <p className="text-red-500 text-xs mt-1">{pwErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">Confirm New Password</label>
              <input type="password" {...registerPw('confirmPassword', { required: 'Required' })} className="input" />
            </div>
            <button type="submit" disabled={changingPw} className="btn-primary">
              {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
