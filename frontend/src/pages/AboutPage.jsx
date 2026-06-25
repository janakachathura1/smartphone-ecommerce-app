import { RiTeamLine, RiHistoryLine, RiCompassLine, RiShieldCheckLine } from 'react-icons/ri';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import ScrollReveal from '../components/ScrollReveal';
import { useState, useEffect, useRef } from 'react';

const stats = [
  { label: 'Trusted Customers', value: 15000, suffix: '+' },
  { label: 'Smartphones Sold', value: 25000, suffix: '+' },
  { label: 'Service Points', value: 45, suffix: '+' },
  { label: 'Years of Experience', value: 8, suffix: '+' },
];

function CountUp({ end, duration = 2500, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isVisible]);

  return <span ref={countRef}>{count.toLocaleString()}{suffix}</span>;
}

export default function AboutPage() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
  });

  return (
    <div className="bg-white min-h-screen text-secondary-950">
      {/* Hero Section */}
      <section className="py-32 lg:py-48 relative overflow-hidden flex items-center justify-center min-h-[500px] group">
        <div className="absolute inset-0 z-0 overflow-hidden">
          {settings?.aboutHeroBgImage ? (
             <img 
               src={settings.aboutHeroBgImage} 
               alt="About Our Journey Background" 
               className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-[15s] ease-out" 
             />
          ) : (
             <div className="w-full h-full bg-gradient-to-br from-secondary-900 to-secondary-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-secondary-950/80 via-secondary-900/60 to-secondary-950/90" />
        </div>

        <div className="container-custom relative z-10 text-center">
          <ScrollReveal animation="slide-up">
            <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-slow" />
              Our Story
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter text-white drop-shadow-2xl">
              About Our <span className="text-primary-400">Journey</span>
            </h1>
            <p className="text-secondary-300 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-lg">
              Empowering your digital life with the world's most innovative smartphones and accessories since 2016.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-20 -mt-20 pb-20">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <ScrollReveal key={stat.label} animation="slide-up" delay={i * 100}>
                <div className="text-center group p-8 rounded-[2rem] bg-white/90 backdrop-blur-2xl border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-primary-500/20 hover:-translate-y-2 transition-all duration-500">
                  <p className="text-4xl lg:text-5xl font-black text-secondary-950 mb-3 tracking-tighter group-hover:text-primary-600 transition-colors">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-secondary-500 text-xs font-black uppercase tracking-[0.2em]">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal animation="slide-right">
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-black mb-6 flex items-center gap-3 text-secondary-950 tracking-tight">
                    <RiHistoryLine className="text-primary-600" /> Our Story
                  </h2>
                  <p className="text-secondary-600 leading-relaxed text-lg font-medium">
                    What started as a small tech boutique in a local neighborhood has grown into a nationwide leader in smartphone e-commerce. We didn't just want to sell phones; we wanted to provide an experience that celebrates innovation and connectivity.
                  </p>
                </div>
                <div>
                  <h2 className="text-4xl font-black mb-6 flex items-center gap-3 text-secondary-950 tracking-tight">
                    <RiCompassLine className="text-primary-600" /> Our Mission
                  </h2>
                  <p className="text-secondary-600 leading-relaxed text-lg font-medium">
                    To make the latest mobile technology accessible to everyone, ensuring authenticity, competitive pricing, and world-class customer service that you can trust.
                  </p>
                </div>
                <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-2xl shadow-primary-200 flex items-center gap-8 group">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                    <RiShieldCheckLine size={40} />
                  </div>
                  <div>
                    <h4 className="font-black text-2xl tracking-tight">100% Authentic</h4>
                    <p className="text-primary-100 text-sm font-medium">We only source from official brand distributors worldwide.</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-in" delay={300}>
              <div className="relative aspect-square rounded-[3rem] overflow-hidden group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
                {settings?.aboutTeamVideoUrl ? (
                  <video 
                    src={settings.aboutTeamVideoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  />
                ) : (
                  <img src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1000" alt="Team" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 to-transparent opacity-40" />
                <div className="absolute bottom-12 left-12">
                  <p className="text-white font-black text-2xl tracking-tight mb-1">TechPulse Team</p>
                  <p className="text-primary-100 font-medium">Driven by innovation & passion.</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
