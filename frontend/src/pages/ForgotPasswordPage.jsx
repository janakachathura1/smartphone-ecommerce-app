import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Password reset link sent to your email!');
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
          <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
          <p className="text-secondary-400 mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card-hover p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5">Email Address</label>
              <input type="email" required placeholder="you@example.com" className="input" />
            </div>
            <button type="submit" className="btn-primary w-full py-3.5">Send Reset Link</button>
          </form>
          <p className="text-center text-sm text-secondary-500 mt-6">
            <Link to="/login" className="text-primary-600 hover:underline">← Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
