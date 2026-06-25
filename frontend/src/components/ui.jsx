import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export function ProductCardSkeleton() {
  return (
    <div className="card-primary overflow-hidden animate-pulse border border-primary-50">
      <div className="aspect-square bg-primary-50/50" />
      <div className="p-8 space-y-4">
        <div className="h-2 bg-primary-100 rounded-full w-1/4" />
        <div className="h-6 bg-primary-50 rounded-lg w-full" />
        <div className="h-4 bg-primary-50 rounded-lg w-2/3" />
        <div className="flex justify-between items-center pt-4">
          <div className="h-8 bg-primary-100 rounded-xl w-24" />
          <div className="h-10 bg-primary-200 rounded-xl w-10" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
    staleTime: Infinity
  });
  const shopName = settings?.shopName || 'TechPulse';

  return (
    <div className="fixed inset-0 z-[999] bg-primary-50 flex flex-col items-center justify-center animate-fade-in">
      {/* Top Loading Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-[1000] overflow-hidden">
        <div className="h-full bg-primary-600 w-1/3 rounded-full animate-marquee-load shadow-[0_0_10px_rgba(2,132,199,0.5)]" />
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-6xl font-black text-secondary-950 tracking-tighter uppercase italic shimmer-text opacity-90">
          {shopName}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
          <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] opacity-60">Professional Syncing</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-secondary-100 flex items-center justify-center mb-6">
          <Icon size={36} className="text-secondary-400" />
        </div>
      )}
      <h3 className="text-xl font-bold text-secondary-900 mb-2">{title}</h3>
      {description && <p className="text-secondary-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

import { RiStarFill, RiStarHalfFill, RiStarLine } from 'react-icons/ri';

export function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= Math.floor(rating) ? (
            <RiStarFill size={size} className="text-amber-400" />
          ) : star - 0.5 <= rating ? (
            <RiStarHalfFill size={size} className="text-amber-400" />
          ) : (
            <RiStarLine size={size} className="text-secondary-200" />
          )}
        </span>
      ))}
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Badge({ children, variant = 'primary' }) {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
  };
  return <span className={variants[variant] || 'badge-primary'}>{children}</span>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <span className="text-red-500 text-2xl">!</span>
      </div>
      <h3 className="text-lg font-bold text-secondary-900 mb-2">Something went wrong</h3>
      <p className="text-secondary-500 mb-6">{message || 'An error occurred. Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
}
