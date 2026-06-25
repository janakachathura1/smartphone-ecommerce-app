import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  RiArrowRightLine, RiShieldCheckLine, RiTruckLine, RiCustomerServiceLine,
  RiSecurePaymentLine, RiStarFill, RiSmartphoneLine, RiFlashlightLine,
  RiGlobalLine, RiMoneyDollarCircleLine, RiGiftLine
} from 'react-icons/ri';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton, SectionHeader } from '../components/ui';
import ScrollReveal from '../components/ScrollReveal';

const FEATURES = [
  { iconName: 'RiShieldCheckLine', title: '2-Year Warranty', desc: 'All products come with full manufacturer warranty.' },
  { iconName: 'RiTruckLine', title: 'Free Shipping', desc: 'Free delivery on orders over $500 worldwide.' },
  { iconName: 'RiCustomerServiceLine', title: '24/7 Support', desc: 'Expert support team ready to help anytime.' },
  { iconName: 'RiSecurePaymentLine', title: 'Secure Payment', desc: 'Your transactions are encrypted and safe.' },
];

const ICONS_MAP = {
  RiShieldCheckLine, RiTruckLine, RiCustomerServiceLine, RiSecurePaymentLine,
  RiStarFill, RiSmartphoneLine, RiFlashlightLine, RiGlobalLine, RiMoneyDollarCircleLine, RiGiftLine
};

const TESTIMONIALS = [
  { name: 'Ahmed K.', rating: 5, text: 'Incredible service! My iPhone 15 Pro arrived within 2 days, perfectly packaged. Will definitely order again.', avatar: 'A' },
  { name: 'Sarah M.', rating: 5, text: 'Amazing prices and authentic products. The Samsung Galaxy S24 Ultra is exactly as described. Highly recommended!', avatar: 'S' },
  { name: 'Rafi H.', rating: 5, text: 'Best smartphone store online. Got my OnePlus 12 at a great discount with fast delivery. 10/10 experience!', avatar: 'R' },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: featuredData, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => api.get('/products/featured').then((r) => r.data.data.products),
  });

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => api.get('/products/new-arrivals').then((r) => r.data.data.products),
  });

  const { data: bestSellers, isLoading: loadingBest } = useQuery({
    queryKey: ['best-sellers'],
    queryFn: () => api.get('/products/best-sellers').then((r) => r.data.data.products),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
  });

  const { data: brandsList } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/brands').then((r) => r.data.data.brands),
  });

  const heroSlides = settings?.heroSlides?.length > 0 ? settings.heroSlides : [{
    id: 1,
    heroTag: settings?.heroTag || 'New Arrivals Just Dropped',
    heroMainTitle: settings?.heroMainTitle || (settings?.shopName ? `Welcome to \n ${settings.shopName}` : 'Shop Premium \n Smartphones \n at Best Prices'),
    heroSubtitle: settings?.heroSubtitle || 'Discover the latest iPhones, Galaxy phones, Xiaomi, OnePlus, and more. Free shipping on orders over $500. 2-year warranty guaranteed.',
    heroBadge1Top: settings?.heroBadge1Top || 'Exclusive',
    heroBadge1Main: settings?.heroBadge1Main || 'Flagship \n Series',
    heroBadge2Top: settings?.heroBadge2Top || 'Season Sale',
    heroBadge2Main: settings?.heroBadge2Main || '20% OFF',
    heroImageUrl: settings?.heroImageUrl || ''
  }];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 text-secondary-950 min-h-[500px] lg:min-h-[680px] flex items-center">
        {settings?.homepageVideoUrl ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden opacity-40">
            <video
              autoPlay
              loop
              muted
              playsInline
              key={settings.homepageVideoUrl}
              src={settings.homepageVideoUrl}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/20 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/40 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-primary-100/50 rounded-full blur-2xl animate-pulse-slow" />
          </div>
        )}

        <div className="container-custom py-10 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative min-h-[400px] lg:min-h-[500px]">

            {/* LEFT SIDE - Text remains unchanged and static */}
            <div className="relative z-20">
              <ScrollReveal animation="slide-right">
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-100 border border-primary-200 text-primary-700 text-xs font-black uppercase tracking-widest mb-8"
                >
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-slow font-black" />
                  {heroSlides[currentSlide]?.heroTag || 'New Arrivals Just Dropped'}
                </div>
                <h1
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-6 lg:mb-8 text-secondary-950 tracking-tight whitespace-pre-line"
                >
                  {heroSlides[currentSlide]?.heroMainTitle || 'Shop Premium \n Smartphones'}
                </h1>
                <p
                  className="text-secondary-600 text-base lg:text-lg mb-8 lg:mb-10 max-w-lg leading-relaxed font-medium whitespace-pre-line"
                >
                  {heroSlides[currentSlide]?.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5">
                  <Link to="/shop" className="btn-primary text-sm sm:text-base px-8 py-3 sm:px-10 sm:py-4 shadow-lg hover:shadow-primary-200 text-center">
                    Shop Now <RiArrowRightLine size={20} />
                  </Link>
                  <Link to="/shop?isFeatured=true" className="px-8 py-3 sm:px-10 sm:py-4 rounded-xl border-2 border-secondary-200 text-secondary-900 font-bold hover:bg-white hover:border-primary-400 transition-all inline-flex items-center justify-center gap-2 text-sm sm:text-base">
                    View Featured
                  </Link>
                </div>

                <div className="flex items-center gap-6 sm:gap-10 mt-8 lg:mt-12 pt-6 lg:pt-10 border-t border-secondary-200">
                  {[
                    { value: '10K+', label: 'Happy Customers' },
                    { value: '500+', label: 'Products' },
                    { value: '4.9★', label: 'Avg Rating' },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <p className="text-3xl font-black text-secondary-900">{value}</p>
                      <p className="text-primary-600 text-xs font-bold uppercase tracking-widest">{label}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>

            {/* RIGHT SIDE - Smooth slider for images without clipping badges */}
            <div className="relative w-full h-[620px] hidden lg:flex">
              {heroSlides.map((slide, idx) => {
                let slideCss = '';
                if (idx === currentSlide) {
                  slideCss = 'opacity-100 translate-x-0 z-20 pointer-events-auto';
                } else if (idx < currentSlide) {
                  slideCss = 'opacity-0 -translate-x-[20%] z-0 pointer-events-none scale-95';
                } else {
                  slideCss = 'opacity-0 translate-x-[20%] z-0 pointer-events-none scale-95';
                }

                return (
                  <div
                    key={slide.id || idx}
                    className={`absolute inset-0 flex justify-center items-center transition-all duration-[1200ms] ease-out ${slideCss}`}
                  >
                    <div className="relative w-full max-w-[640px] aspect-square flex items-center justify-center">
                      {/* Advanced Background Aura */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary-500/10 via-blue-400/5 to-transparent blur-[120px] animate-pulse-slow" />
                      <div className="absolute w-[80%] h-[80%] rounded-full bg-white/20 blur-3xl" />

                      {slide.heroImageUrl ? (
                        <div className="relative z-10 w-full h-full flex items-center justify-center group">
                          {/* Sub-glow behind the phone */}
                          <div className="absolute inset-0 bg-primary-400/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                          <img
                            src={slide.heroImageUrl}
                            alt="Hero Featured"
                            className="max-h-full max-w-full object-contain drop-shadow-[0_45px_70px_rgba(37,99,235,0.25)] animate-float scale-125 group-hover:scale-[1.35] transition-transform duration-1000"
                          />
                        </div>
                      ) : (
                        <div className="relative z-10 w-72 h-72 rounded-[3.5rem] bg-white/40 backdrop-blur-3xl border border-white/60 flex items-center justify-center shadow-2xl animate-spin-slow">
                          <RiSmartphoneLine size={120} className="text-primary-600/40 animate-float" />
                        </div>
                      )}

                      {/* Glassmorphic Floating Badges */}
                      <div className="absolute -top-10 -left-10 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-6 animate-float z-20" style={{ animationDelay: '0.3s' }}>
                        <p className="text-[10px] text-primary-600 font-black uppercase tracking-[0.4em] mb-2">{slide.heroBadge1Top || 'Exclusive'}</p>
                        <p className="text-xl font-black text-secondary-950 tracking-tighter leading-none whitespace-pre-line">{slide.heroBadge1Main || 'Flagship \n Series'}</p>
                      </div>

                      <div className="absolute -bottom-6 -right-10 bg-secondary-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-glow p-7 animate-float z-20" style={{ animationDelay: '0.7s' }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform">
                            <RiFlashlightLine size={24} className="text-white" />
                          </div>
                          <div>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">{slide.heroBadge2Top || 'Season Sale'}</p>
                            <p className="text-white text-3xl font-black tracking-tighter">{slide.heroBadge2Main || '20% OFF'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Decorative Elements */}
                      <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-primary-500 animate-ping" />
                      <div className="absolute bottom-1/4 right-0 w-3 h-3 rounded-full bg-blue-400 blur-sm animate-pulse-slow" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slider Navigation Dots placed inside container but aligned bottom or spanning the parent */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex gap-3 z-30">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-primary-600 w-8' : 'bg-primary-600/20 hover:bg-primary-600/50'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary-50 py-12 border-b border-secondary-100">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(settings?.siteFeatures?.length === 4 ? settings.siteFeatures : FEATURES).map((feature, idx) => {
              const Icon = ICONS_MAP[feature.iconName] || ICONS_MAP[FEATURES[idx]?.iconName] || RiShieldCheckLine;
              return (
                <ScrollReveal key={`${feature.title}-${idx}`} animation="slide-up" delay={idx * 100}>
                  <div className="flex items-start gap-4 p-5 rounded-2xl hover:bg-white transition-all hover:shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={24} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary-950 text-sm tracking-tight">{feature.title}</h3>
                      <p className="text-secondary-500 text-xs mt-1 leading-relaxed font-medium">{feature.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container-custom">
          <ScrollReveal animation="slide-up">
            <SectionHeader
              title="Featured Smartphones"
              subtitle="Handpicked best phones from top brands"
              action={
                <Link to="/shop?isFeatured=true" className="btn-ghost text-primary-600">
                  View All <RiArrowRightLine size={16} />
                </Link>
              }
            />
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loadingFeatured
              ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : featuredData?.map((product, i) => (
                <ScrollReveal key={product.id} animation="slide-up" delay={(i % 4) * 100}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))
            }
          </div>
        </div>
      </section>

      {/* Promo Banners Section - Enhanced Tech-Luxe Design */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {settings?.promoBanners?.length > 0 ? (
              settings.promoBanners.map((banner, idx) => (
                <ScrollReveal key={banner.id || idx} animation={idx % 2 === 0 ? "slide-right" : "slide-left"}>
                  <div className={`group relative h-[280px] sm:h-[360px] lg:h-[420px] rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden bg-gradient-to-br ${banner.bgColor || 'from-secondary-900 to-secondary-950'} shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-glow-primary transition-all duration-700 hover:-translate-y-2`}>

                    {/* Dynamic Background Effects */}
                    <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white/10 blur-[120px] animate-pulse-slow" />
                      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/20 blur-[100px]" />
                    </div>

                    {/* Content Layer */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 md:p-16">
                      <div className="space-y-6 max-w-[65%]">
                        {banner.badge && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-inner">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.25em]">{banner.badge}</span>
                          </div>
                        )}

                        <h3 className="text-4xl md:text-5xl font-black text-white leading-[0.95] tracking-tighter">
                          {banner.title.split(' ').map((word, i) => (
                            <span key={i} className="block">{word}</span>
                          ))}
                        </h3>

                        <p className="text-white/70 text-base md:text-lg font-medium leading-tight max-w-[280px]">
                          {banner.subtitle}
                        </p>
                      </div>

                      <div>
                        <Link
                          to={banner.link || '/shop'}
                          className="inline-flex items-center gap-4 px-10 py-4.5 bg-white text-secondary-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-50 hover:scale-105 active:scale-95 transition-all shadow-[0_15px_30px_-5px_rgba(255,255,255,0.3)] group/btn"
                        >
                          {banner.buttonText || 'Discover Now'}
                          <div className="w-6 h-6 rounded-full bg-secondary-950 flex items-center justify-center -mr-2 group-hover/btn:translate-x-1 transition-transform">
                            <RiArrowRightLine size={14} className="text-white" />
                          </div>
                        </Link>
                      </div>

                      {/* Floating Product Image */}
                      <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[55%] h-[90%] pointer-events-none">
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Advanced Glow behind image */}
                          <div className="absolute w-[80%] h-[80%] bg-primary-500/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-all duration-1000 scale-50 group-hover:scale-100" />

                          {banner.image ? (
                            <img
                              src={banner.image}
                              alt=""
                              className="w-full h-full object-contain filter drop-shadow-[0_40px_80px_rgba(0,0,0,0.5)] animate-float scale-110 group-hover:scale-125 transition-all duration-1000 origin-center"
                            />
                          ) : (
                            <RiSmartphoneLine
                              size={280}
                              className="text-white/10 -mr-16 rotate-12 group-hover:rotate-0 transition-all duration-1000"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            ) : (
              // Enhanced Fallback Banners
              <>
                <ScrollReveal animation="slide-right">
                  <div className="group relative h-[280px] sm:h-[360px] lg:h-[420px] rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden bg-gradient-to-br from-primary-800 to-primary-950 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-glow-primary transition-all duration-700 hover:-translate-y-2">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 md:p-16">
                      <div className="space-y-6 max-w-[65%]">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                          <span className="text-white text-[10px] font-black uppercase tracking-[0.25em]">Limited Offer</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-white leading-[0.95] tracking-tighter">
                          <span className="block">iPhone 17</span>
                          <span className="block text-primary-400">Series</span>
                        </h3>
                        <p className="text-white/70 text-base md:text-lg font-medium leading-tight max-w-[280px]">
                          Master the new pro workflow. Up to 8% off on all models.
                        </p>
                      </div>
                      <div>
                        <Link to="/shop?brand=apple" className="inline-flex items-center gap-4 px-10 py-4.5 bg-white text-secondary-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-50 transition-all shadow-[0_15px_30px_-5px_rgba(255,255,255,0.3)] group/btn">
                          Shop Apple
                          <div className="w-6 h-6 rounded-full bg-secondary-950 flex items-center justify-center -mr-2 group-hover/btn:translate-x-1 transition-transform">
                            <RiArrowRightLine size={14} className="text-white" />
                          </div>
                        </Link>
                      </div>
                      <div className="absolute right-[-12%] top-1/2 -translate-y-1/2 w-[70%] h-full pointer-events-none">
                        {/* Image container with shadow and glow */}
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute w-[80%] h-[80%] bg-primary-500/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-all duration-1000 scale-50 group-hover:scale-100" />
                          <img
                            src="/images/iphone_promo.png"
                            alt="iPhone 17"
                            className="w-full h-full object-contain filter drop-shadow-[0_45px_70px_rgba(0,0,0,0.4)] animate-float group-hover:scale-110 transition-all duration-1000 origin-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
                <ScrollReveal animation="slide-left">
                  <div className="group relative h-[280px] sm:h-[360px] lg:h-[420px] rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden bg-gradient-to-br from-secondary-800 to-secondary-950 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-glow transition-all duration-700 hover:-translate-y-2">
                    <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 md:p-16">
                      <div className="space-y-6 max-w-[65%]">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-white text-[10px] font-black uppercase tracking-[0.25em]">Galaxy AI</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black text-white leading-[0.95] tracking-tighter">
                          <span className="block">Samsung</span>
                          <span className="block text-blue-400">S26 Ultra</span>
                        </h3>
                        <p className="text-white/70 text-base md:text-lg font-medium leading-tight max-w-[280px]">
                          Intelligence in every touch. Experience the future today.
                        </p>
                      </div>
                      <div>
                        <Link to="/shop?brand=samsung" className="inline-flex items-center gap-4 px-10 py-4.5 bg-white text-secondary-950 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-50 transition-all shadow-[0_15px_30px_-5px_rgba(255,255,255,0.3)] group/btn">
                          Shop Samsung
                          <div className="w-6 h-6 rounded-full bg-secondary-950 flex items-center justify-center -mr-2 group-hover/btn:translate-x-1 transition-transform">
                            <RiArrowRightLine size={14} className="text-white" />
                          </div>
                        </Link>
                      </div>
                      <div className="absolute right-[-12%] top-1/2 -translate-y-1/2 w-[70%] h-full pointer-events-none">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-all duration-1000 scale-50 group-hover:scale-100" />
                          <img
                            src="/images/samsung_promo.png"
                            alt="Samsung S26 Ultra"
                            className="w-full h-full object-contain filter drop-shadow-[0_45px_70px_rgba(0,0,0,0.4)] animate-float-reverse group-hover:scale-110 transition-all duration-1000 origin-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </>
            )}
          </div>
        </div>
      </section>


      {/* New Arrivals */}
      <section className="py-16 bg-secondary-50">
        <div className="container-custom">
          <ScrollReveal animation="slide-up">
            <SectionHeader
              title="New Arrivals"
              subtitle="The freshest phones just landed"
              action={
                <Link to="/shop?isNewArrival=true" className="btn-ghost text-primary-600">
                  View All <RiArrowRightLine size={16} />
                </Link>
              }
            />
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loadingNew
              ? Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : newArrivals?.slice(0, 4).map((product, i) => (
                <ScrollReveal key={product.id} animation="slide-up" delay={i * 100}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))
            }
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16">
        <div className="container-custom">
          <ScrollReveal animation="slide-up">
            <SectionHeader
              title="Best Sellers"
              subtitle="Our most loved phones by our customers"
              action={
                <Link to="/shop?isBestSeller=true" className="btn-ghost text-primary-600">
                  View All <RiArrowRightLine size={16} />
                </Link>
              }
            />
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {loadingBest
              ? Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : bestSellers?.slice(0, 4).map((product, i) => (
                <ScrollReveal key={product.id} animation="slide-up" delay={i * 100}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))
            }
          </div>
        </div>
      </section>

      {/* Shop by Brand - Premium Glass Gallery */}
      <section className="py-28 bg-gradient-to-b from-white to-secondary-50 overflow-hidden relative">
        <div className="container-custom relative z-10 mb-20 text-center">
          <ScrollReveal animation="slide-up">
            <div className="flex flex-col items-center gap-4">
              <span className="px-5 py-1.5 bg-primary-100 text-primary-700 text-[10px] font-black uppercase tracking-[0.4em] rounded-full">
                Our Partners
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-secondary-950 tracking-tight uppercase leading-none">
                Elite Brands <span className="text-primary-600">.</span>
              </h2>
            </div>
          </ScrollReveal>
        </div>

        <div className="relative flex overflow-hidden group py-10">
          <div className="flex animate-marquee gap-12 whitespace-nowrap group-hover:[animation-play-state:paused] py-4 items-center">
            {[...(brandsList || []), ...(brandsList || []), ...(brandsList || [])].map((brand, i) => (
              <Link
                key={`${brand.slug}-${i}`}
                to={`/shop?brand=${brand.slug}`}
                className="group relative flex items-center justify-center"
              >
                {/* Glassmorphism Capsule with vibrant hover fill */}
                <div className="px-14 py-7 rounded-2xl bg-white border border-secondary-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:bg-primary-600 hover:border-primary-600 hover:shadow-glow-primary hover:scale-110 transition-all duration-500 relative overflow-hidden group/pill">
                  {/* Background light pulse on hover */}
                  <div className="absolute inset-x-0 -bottom-full h-full bg-white/10 group-hover/pill:bottom-0 transition-all duration-700 pointer-events-none" />

                  <span className="text-3xl md:text-4xl font-black text-secondary-900 uppercase tracking-tighter group-hover/pill:text-white transition-all duration-500">
                    {brand.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Premium Fade Overlays */}
          <div className="absolute inset-y-0 left-0 w-16 sm:w-40 lg:w-80 bg-gradient-to-r from-white via-white/50 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-40 lg:w-80 bg-gradient-to-l from-white via-white/50 to-transparent z-10" />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container-custom">
          <ScrollReveal animation="slide-up">
            <div className="text-center mb-10">
              <h2 className="section-title">What Our Customers Say</h2>
              <p className="section-subtitle">Trusted by thousands of happy shoppers</p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, rating, text, avatar }, i) => (
              <ScrollReveal key={name} animation="slide-up" delay={i * 150}>
                <div className="card p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <RiStarFill key={star} size={16} className={star <= rating ? 'text-amber-400' : 'text-secondary-200'} />
                    ))}
                  </div>
                  <p className="text-secondary-700 text-sm leading-relaxed mb-6">"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center text-white font-bold">
                      {avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">{name}</p>
                      <p className="text-secondary-400 text-xs">Verified Customer</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
