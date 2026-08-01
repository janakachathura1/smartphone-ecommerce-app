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
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center gap-3 animate-fade-in">
      <div className="w-9 h-9 border-[3.5px] border-secondary-200 border-t-primary-600 rounded-full animate-spin" />
      <span className="text-xs font-bold text-secondary-500 tracking-wider">Loading...</span>
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
