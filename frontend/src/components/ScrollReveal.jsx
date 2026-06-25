import { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({
  children,
  className = '',
  animation = 'slide-up', // slide-up, slide-left, slide-right, fade-in
  duration = '700ms',
  delay = 0,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const baseStyles = `transition-all ease-out`;
  const durationStyle = { transitionDuration: duration, transitionDelay: `${delay}ms` };
  
  const getHiddenStyles = () => {
    switch (animation) {
      case 'slide-up': return 'opacity-0 translate-y-12';
      case 'slide-down': return 'opacity-0 -translate-y-12';
      case 'slide-left': return 'opacity-0 translate-x-12';
      case 'slide-right': return 'opacity-0 -translate-x-12';
      case 'fade-in': return 'opacity-0 scale-95';
      default: return 'opacity-0';
    }
  };

  const getVisibleStyles = () => {
    switch (animation) {
      case 'slide-up':
      case 'slide-down': return 'opacity-100 translate-y-0';
      case 'slide-left':
      case 'slide-right': return 'opacity-100 translate-x-0';
      case 'fade-in': return 'opacity-100 scale-100';
      default: return 'opacity-100';
    }
  };

  return (
    <div
      ref={ref}
      style={durationStyle}
      className={`${className} ${baseStyles} ${isVisible ? getVisibleStyles() : getHiddenStyles()}`}
    >
      {children}
    </div>
  );
}
