import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP & new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
      }
      toast.success(res.data.message || 'Verification code sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error('Please fill in all fields');
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        resetToken,
        otp,
        newPassword,
      });
      toast.success(res.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-primary-700 font-black text-lg">T</span>
            </div>
            <span className="font-black text-2xl text-white">TechPulse</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
          </h1>
          <p className="text-secondary-400 mt-1 text-sm">
            {step === 1
              ? 'Enter your email and we will send you a verification code'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card-hover p-8">
          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex justify-center items-center gap-2">
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1.5">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="input tracking-widest text-center text-lg font-bold"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="input"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex justify-center items-center gap-2">
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-secondary-500 hover:text-primary-600 font-medium"
              >
                Resend Code / Change Email
              </button>
            </form>
          )}

          <p className="text-center text-sm text-secondary-500 mt-6">
            <Link to="/login" className="text-primary-600 hover:underline">
              ← Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
