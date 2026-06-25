import { Link } from 'react-router-dom';
import { RiSmartphoneLine, RiArrowLeftLine } from 'react-icons/ri';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
          <RiSmartphoneLine size={44} className="text-primary-500" />
        </div>
        <h1 className="text-8xl font-black text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-secondary-900 mb-3">Page Not Found</h2>
        <p className="text-secondary-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">
          <RiArrowLeftLine size={18} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
