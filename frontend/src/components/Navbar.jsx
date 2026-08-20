import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  RiShoppingCartLine, RiHeartLine, RiSearchLine, RiUserLine,
  RiMenuLine, RiCloseLine, RiArrowDownSLine, RiLogoutBoxLine,
  RiDashboardLine, RiShoppingBagLine, RiFlashlightLine,
  RiHomeLine, RiStoreLine, RiInformationLine, RiPhoneLine,
  RiArrowRightSLine, RiMapPinLine, RiScales3Line,
} from 'react-icons/ri';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCompareStore } from '../store/useCompareStore';
import { useRecentlyViewedStore } from '../store/useRecentlyViewedStore';
import { getInitials, formatPrice } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import SearchBar from './SearchBar';

const SUBCATEGORIES_MAP = {
  'mobile-phones': {
    name: 'Mobile Phones',
    subcategories: ['iPhone', 'Samsung', 'Xiaomi / Redmi', 'Honor', 'Oppo', 'Vivo', 'OnePlus', 'Realme', 'Huawei', 'Google Pixel', 'Nothing', 'Infinix', 'Tecno', 'Nokia', 'ZTE', 'Basic / Feature Phones'],
    brands: ['Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Honor', 'Oppo', 'Vivo', 'OnePlus', 'Realme', 'Huawei', 'Google', 'Nothing', 'Infinix', 'Tecno', 'Nokia', 'ZTE']
  },
  'tablets': {
    name: 'Tablets',
    subcategories: ['iPad', 'Samsung Galaxy Tab', 'Xiaomi', 'Huawei', 'Lenovo', 'Other Brands'],
    brands: ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Lenovo']
  },
  'smart-watches-wearables': {
    name: 'Smart Watches & Wearables',
    subcategories: ['Apple Watch', 'Samsung Galaxy Watch', 'Huawei Watch', 'Amazfit', 'Xiaomi', 'Fitness Bands'],
    brands: ['Apple', 'Samsung', 'Huawei', 'Amazfit', 'Xiaomi']
  },
  'audio': {
    name: 'Audio',
    subcategories: ['TWS Earbuds', 'Bluetooth Earphones', 'Wired Earphones', 'Headphones', 'Bluetooth Speakers', 'Portable Speakers'],
    brands: ['Apple', 'Samsung', 'Xiaomi', 'Sony', 'Logitech', 'Razer']
  },
  'chargers-power': {
    name: 'Chargers & Power',
    subcategories: ['Wall Chargers', 'Fast Chargers', 'Wireless Chargers', 'Car Chargers', 'Charging Cables', 'Power Banks', 'Charging Stations'],
    brands: ['Anker', 'Baseus', 'Samsung', 'Apple']
  },
  'phone-protection': {
    name: 'Phone Protection',
    subcategories: ['Phone Cases', 'Silicone Cases', 'Leather Cases', 'Clear Cases', 'Tempered Glass', 'Privacy Glass', 'Camera Lens Protectors'],
    brands: ['Spigen', 'Apple', 'Samsung']
  },
  'mobile-accessories': {
    name: 'Mobile Accessories',
    subcategories: ['Phone Holders', 'Car Mounts', 'Mobile Stands', 'OTG Adapters', 'USB Hubs', 'HDMI Adapters', 'Memory Cards', 'SIM Accessories'],
    brands: ['Anker', 'Baseus']
  },
  'laptop-computer': {
    name: 'Laptop & Computer',
    subcategories: ['Laptops', 'MacBooks', 'Laptop Bags', 'Mouse', 'Keyboard', 'USB Hubs', 'Laptop Chargers'],
    brands: ['Apple', 'Lenovo', 'Huawei', 'Logitech', 'Razer']
  },
  'smart-tech-gadgets': {
    name: 'Smart / Tech Gadgets',
    subcategories: ['Smart Glasses', 'Smart Trackers', 'Gimbals', 'Smart Devices', 'Pocket Wi-Fi', 'Mini Projectors'],
    brands: ['Apple', 'Samsung', 'Xiaomi']
  },
  'gaming': {
    name: 'Gaming',
    subcategories: ['Gaming Consoles', 'Game Controllers', 'Gaming Headsets', 'Mobile Gaming Accessories'],
    brands: ['Sony', 'Razer', 'Logitech']
  },
  'repair-spare-parts': {
    name: 'Repair & Spare Parts',
    subcategories: ['Displays', 'Batteries', 'Charging Ports', 'Camera Modules', 'Speakers', 'Back Covers', 'Other Spare Parts'],
    brands: ['Apple', 'Samsung', 'Xiaomi']
  },
  'used-pre-owned-phones': {
    name: 'Used / Pre-owned Phones',
    subcategories: ['Used iPhone', 'Used Samsung', 'Used Android', 'Refurbished Phones'],
    brands: ['Apple', 'Samsung', 'Xiaomi', 'Google']
  }
};

export default function Navbar() {
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  const { itemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { compareItems } = useCompareStore();
  const compareCount = compareItems.length;
  const wishlistCount = wishlistItems?.length || 0;
  const navigate = useNavigate();
  const location = useLocation();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
  });
  const shopName = settings?.shopName || 'TechPulse';

  const [activeNavCategory, setActiveNavCategory] = useState('mobile-phones');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showShopMenu, setShowShopMenu] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const shopMenuTimeoutRef = useRef(null);

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['nav-categories'],
    queryFn: () => api.get('/categories').then((r) => r.data?.data?.categories || []),
  });
  const navCategories = categoriesData || [];

  const { data: arrivalsData, isLoading: loadingArrivals } = useQuery({
    queryKey: ['nav-new-arrivals'],
    queryFn: () => api.get('/products/new-arrivals').then((r) => r.data?.data?.products || []),
    enabled: showShopMenu,
  });
  const navNewArrivals = arrivalsData || [];

  const { recentlyViewed } = useRecentlyViewedStore();
  const recentBrandIds = [...new Set(recentlyViewed.map((p) => p.brandId || p.brand?.id).filter(Boolean))];

  const { data: recommendedData } = useQuery({
    queryKey: ['nav-recommended-products', recentBrandIds],
    queryFn: () => api.get('/products', {
      params: {
        limit: 2,
        isFeatured: true,
        brandId: recentBrandIds[0] || undefined,
      }
    }).then((r) => r.data?.data?.products || []),
    enabled: showShopMenu,
  });
  const navRecommended = recommendedData || [];

  const { data: brandsData } = useQuery({
    queryKey: ['nav-brands'],
    queryFn: () => api.get('/brands').then((r) => r.data?.data?.brands || []),
    enabled: showShopMenu,
  });
  const navBrands = brandsData || [];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileCatsOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleShopMouseEnter = () => {
    if (shopMenuTimeoutRef.current) clearTimeout(shopMenuTimeoutRef.current);
    setShowShopMenu(true);
  };
  const handleShopMouseLeave = () => {
    shopMenuTimeoutRef.current = setTimeout(() => setShowShopMenu(false), 200);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/', { replace: true });
    logout();
  };

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white transition-all duration-500 ${scrolled ? 'shadow-[0_1px_20px_rgba(0,0,0,0.08)]' : ''}`}>
        {/* Top accent line */}
        <div className="h-[3px] bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400" />

        {/* ───── MAIN ROW ───── */}
        <div className="border-b border-secondary-100">
          <div className="container-custom">
            <div className="flex items-center h-16 sm:h-20 gap-2">

              {/* ── Hamburger (mobile only) ── */}
              <button
                id="mobile-menu-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                className="lg:hidden flex-shrink-0 p-2 text-secondary-600 hover:text-secondary-950 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
              </button>

              {/* ── Logo ── */}
              <a
                href="/"
                className={`flex items-center gap-2 group ${isLoading ? 'opacity-50' : ''} flex-shrink-0`}
              >
                {settings?.logoUrl && !logoFailed ? (
                  <div className="relative">
                    <img 
                      src={settings.logoUrl} 
                      alt={shopName} 
                      onError={() => setLogoFailed(true)}
                      className="h-9 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-primary-400/10 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : null}
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[8px] sm:text-[10px] font-bold text-primary-600 tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-0.5">Official</span>
                  <span className="text-sm sm:text-lg font-black text-secondary-950 tracking-wide uppercase group-hover:text-primary-600 transition-colors duration-300">
                    {shopName.split('').map((char, i) => (
                      <span key={i} className="inline-block hover:-translate-y-0.5 transition-transform cursor-default">{char}</span>
                    ))}
                  </span>
                </div>
              </a>

              {/* ── Desktop Nav Links ── */}
              <nav className="hidden lg:flex items-center ml-8 gap-0 h-full">
                {[
                  { to: '/', label: 'Home' },
                  { label: 'Shop', hasMenu: true },
                  { to: '/about', label: 'About' },
                  { to: '/contact', label: 'Contact' },
                ].map((link) => (
                  <div
                    key={link.label}
                    className="relative h-full flex items-center"
                    onMouseEnter={link.hasMenu ? handleShopMouseEnter : undefined}
                    onMouseLeave={link.hasMenu ? handleShopMouseLeave : undefined}
                  >
                    {link.hasMenu ? (
                      <button
                        className={`relative px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-1.5 transition-all duration-300 group/nav
                          ${showShopMenu ? 'bg-primary-50 text-primary-700' : 'text-secondary-500 hover:bg-secondary-50 hover:text-secondary-900 hover:-translate-y-0.5'}`}
                      >
                        {link.label}
                        <RiArrowDownSLine size={14} className={`transition-transform duration-300 ${showShopMenu ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <NavLink
                        to={link.to}
                        end={link.label === 'Home'}
                        className={({ isActive }) =>
                          `relative px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center transition-all duration-300 group/nav
                          ${isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-500 hover:bg-secondary-50 hover:text-secondary-900 hover:-translate-y-0.5'}`
                        }
                      >
                        {link.label}
                      </NavLink>
                    )}

                    {/* Mega menu */}
                    {link.hasMenu && showShopMenu && (
                      <div
                        className="absolute top-full left-0 mt-0.5 w-[940px] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.12)] rounded-3xl border border-secondary-100/80 z-50 animate-fade-in-up"
                        onMouseEnter={handleShopMouseEnter}
                        onMouseLeave={handleShopMouseLeave}
                      >
                        <div className="p-6">
                          <div className="grid grid-cols-12 gap-6">
                            {/* Left Categories Sidebar (4 cols) */}
                            <div className="col-span-4 border-r border-secondary-50 pr-4">
                              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary-400 mb-4 px-2">Categories</h4>
                              <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                                {navCategories.map((cat) => {
                                  const isActive = activeNavCategory === cat.slug;
                                  return (
                                    <button
                                      key={cat.id}
                                      onMouseEnter={() => setActiveNavCategory(cat.slug)}
                                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 border border-transparent
                                        ${isActive 
                                          ? 'bg-gradient-to-r from-primary-50 to-primary-100/30 text-primary-700 font-bold border-primary-100/50' 
                                          : 'text-secondary-650 hover:bg-secondary-50/70 hover:text-secondary-900'
                                        }`}
                                    >
                                      <span className="text-xs tracking-wide">{cat.name}</span>
                                      <RiArrowRightSLine 
                                        size={14} 
                                        className={`transition-all duration-300 ${isActive ? 'translate-x-0.5 text-primary-600 opacity-100' : 'opacity-0 -translate-x-1'}`} 
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right Content Area (8 cols) */}
                            <div className="col-span-8 flex flex-col justify-between pl-2">
                              {(() => {
                                const currentCatInfo = SUBCATEGORIES_MAP[activeNavCategory] || SUBCATEGORIES_MAP['mobile-phones'];
                                return (
                                  <>
                                    <div className="grid grid-cols-12 gap-6">
                                      {/* Subcategories column (7 cols) */}
                                      <div className="col-span-8">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary-400 mb-4">
                                          {currentCatInfo.name} Subcategories
                                        </h4>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                          {currentCatInfo.subcategories.map((sub) => (
                                            <Link
                                              key={sub}
                                              to={`/shop?category=${activeNavCategory}&search=${encodeURIComponent(sub)}`}
                                              onClick={() => setShowShopMenu(false)}
                                              className="group/sub flex items-center gap-1.5 py-1 text-xs text-secondary-650 hover:text-primary-700 transition-colors"
                                            >
                                              <span className="w-1 h-1 rounded-full bg-secondary-300 group-hover/sub:bg-primary-500 group-hover/sub:scale-125 transition-all" />
                                              <span className="font-semibold line-clamp-1">{sub}</span>
                                            </Link>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Quick brands column (4 cols) */}
                                      <div className="col-span-4">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-secondary-400 mb-4">
                                          Popular Brands
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5 max-h-[280px] overflow-y-auto">
                                          {currentCatInfo.brands.map((brand) => (
                                            <Link
                                              key={brand}
                                              to={`/shop?brand=${brand.toLowerCase()}`}
                                              onClick={() => setShowShopMenu(false)}
                                              className="text-[10px] font-bold text-secondary-650 bg-secondary-50 hover:bg-primary-600 hover:text-white px-2.5 py-1 rounded-full transition-all duration-300 hover:-translate-y-0.5"
                                            >
                                              {brand}
                                            </Link>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bottom Features Info Bar */}
                                    <div className="flex items-center justify-between pt-4 border-t border-secondary-100 mt-6 flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider text-secondary-400">
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Genuine Products Only
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        1-Year Shop Warranty
                                      </span>
                                      <span className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Safe Card Checkout
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="flex-1" />

              {/* ── Right Section (Search + Icons) ── */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Search (desktop) — now on the right before icons */}
                <div className="hidden lg:flex items-center w-64 xl:w-80 mr-2">
                  <SearchBar placeholder="Search products…" />
                </div>

                {/* Search icon (mobile only, opens mobile menu to search) */}
                <button
                  onClick={() => { setMobileOpen(true); }}
                  className="lg:hidden p-2 text-secondary-500 hover:text-secondary-900 rounded-lg hover:bg-secondary-50 transition-colors"
                  aria-label="Search"
                >
                  <RiSearchLine size={20} />
                </button>

                {/* Compare */}
                <Link
                  to="/compare"
                  className="relative p-2 sm:p-2.5 text-secondary-500 hover:text-secondary-900 transition-colors rounded-lg hover:bg-secondary-50"
                  title="Compare Phones"
                >
                  <RiScales3Line size={20} />
                  {compareCount > 0 && (
                    <span className="absolute top-1 right-1 w-[14px] h-[14px] bg-primary-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {compareCount}
                    </span>
                  )}
                </Link>

                {/* Wishlist */}
                <Link
                  to="/account/wishlist"
                  className="relative p-2 sm:p-2.5 text-secondary-500 hover:text-secondary-900 transition-colors rounded-lg hover:bg-secondary-50"
                  title="Wishlist"
                >
                  <RiHeartLine size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 w-[14px] h-[14px] bg-primary-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link
                  to="/cart"
                  className="relative p-2 sm:p-2.5 text-secondary-500 hover:text-secondary-900 transition-colors rounded-lg hover:bg-secondary-50"
                  title="Cart"
                >
                  <RiShoppingCartLine size={20} />
                  {itemCount > 0 && (
                    <span className="absolute top-1 right-1 w-[14px] h-[14px] bg-primary-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {/* Account (desktop dropdown) */}
                {isAuthenticated ? (
                  <div className="relative hidden lg:block" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="relative p-2.5 text-secondary-500 hover:text-secondary-900 transition-colors rounded-lg hover:bg-secondary-50"
                      title="Account"
                    >
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <RiUserLine size={20} />
                      )}
                      <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full border border-white" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-secondary-100 py-2 z-50">
                        <div className="px-4 py-3 border-b border-secondary-50 mb-1">
                          <p className="text-sm font-black text-secondary-950">{user?.firstName} {user?.lastName}</p>
                          <p className="text-[10px] text-secondary-400 font-medium mt-0.5">{user?.email}</p>
                          <span className="inline-block mt-2 px-2.5 py-0.5 bg-primary-50 text-primary-600 text-[9px] font-black uppercase tracking-widest rounded-full">
                            {user?.role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        </div>
                        {[
                          { to: '/admin', icon: RiDashboardLine, label: 'Admin Panel', hide: user?.role !== 'admin' },
                          { to: '/account/orders', icon: RiShoppingBagLine, label: 'My Orders' },
                          { to: '/account/wishlist', icon: RiHeartLine, label: 'Wishlist' },
                        ].filter(i => !i.hide).map(item => (
                          <Link
                            key={item.label}
                            to={item.to}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:text-secondary-950 hover:bg-secondary-50 transition-all group/item"
                          >
                            <item.icon size={15} className="text-secondary-400 group-hover/item:text-primary-600 flex-shrink-0 transition-colors" />
                            {item.label}
                          </Link>
                        ))}
                        <div className="mt-1 pt-1 border-t border-secondary-50">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-all"
                          >
                            <RiLogoutBoxLine size={15} /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="hidden lg:flex p-2.5 text-secondary-500 hover:text-secondary-900 transition-colors rounded-lg hover:bg-secondary-50"
                    title="Sign In"
                  >
                    <RiUserLine size={20} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* ───── MOBILE DRAWER OVERLAY ───── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative z-10 w-[85vw] max-w-sm h-full bg-white flex flex-col shadow-2xl animate-slide-in-left overflow-y-auto">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-secondary-100 flex-shrink-0">
              <a href="/" className="flex items-center gap-2.5">
                {settings?.logoUrl && !logoFailed && (
                  <img 
                    src={settings.logoUrl} 
                    alt={shopName} 
                    onError={() => setLogoFailed(true)}
                    className="h-9 w-auto object-contain" 
                  />
                )}
                <div className="flex flex-col leading-none">
                  <span className="text-[8px] font-bold text-primary-600 tracking-[0.3em] uppercase">Official</span>
                  <span className="text-base font-black text-secondary-950 tracking-wide uppercase">{shopName}</span>
                </div>
              </a>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-secondary-500 hover:text-secondary-900 hover:bg-secondary-50 transition-colors"
                aria-label="Close menu"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            {/* Search bar */}
            <div className="px-4 py-3 border-b border-secondary-100 flex-shrink-0">
              <SearchBar
                autoFocus
                placeholder="Search smartphones, brands…"
                onClose={() => setMobileOpen(false)}
              />
            </div>

            {/* User info (when logged in) */}
            {isAuthenticated && (
              <div className="px-5 py-4 border-b border-secondary-100 bg-secondary-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-sm">{getInitials(`${user?.firstName} ${user?.lastName}`)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-secondary-950 truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[11px] text-secondary-500 truncate">{user?.email}</p>
                  </div>
                  <span className="ml-auto flex-shrink-0 px-2.5 py-0.5 bg-primary-100 text-primary-700 text-[9px] font-black uppercase tracking-widest rounded-full">
                    {user?.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex-1 px-3 py-3">
              <div className="space-y-0.5">

                {/* Home */}
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                    ${isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950'}`
                  }
                >
                  <RiHomeLine size={18} className="flex-shrink-0" />
                  Home
                </NavLink>

                {/* Shop with categories accordion */}
                <div>
                  <button
                    onClick={() => setMobileCatsOpen(!mobileCatsOpen)}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950 transition-all"
                  >
                    <RiStoreLine size={18} className="flex-shrink-0" />
                    <span className="flex-1 text-left">Shop</span>
                    <RiArrowDownSLine
                      size={18}
                      className={`text-secondary-400 transition-transform duration-300 ${mobileCatsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {mobileCatsOpen && (
                    <div className="mt-1 ml-4 pl-4 border-l-2 border-secondary-100 pb-1 space-y-0.5">
                      <Link
                        to="/shop"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all"
                      >
                        <RiFlashlightLine size={15} />
                        All Products
                      </Link>
                      {loadingCategories ? (
                        <div className="py-4 flex justify-center">
                          <div className="w-5 h-5 border-2 border-secondary-300 border-t-secondary-700 rounded-full animate-spin" />
                        </div>
                      ) : (
                        navCategories.slice(0, 10).map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/shop?category=${cat.slug}`}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-950 transition-all"
                          >
                            {cat.name}
                            <RiArrowRightSLine size={14} className="text-secondary-400" />
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* About */}
                <NavLink
                  to="/about"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                    ${isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950'}`
                  }
                >
                  <RiInformationLine size={18} className="flex-shrink-0" />
                  About
                </NavLink>

                {/* Contact */}
                <NavLink
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                    ${isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950'}`
                  }
                >
                  <RiPhoneLine size={18} className="flex-shrink-0" />
                  Contact
                </NavLink>

                {/* Divider */}
                <div className="h-px bg-secondary-100 my-2" />

                {/* Cart */}
                <Link
                  to="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950 transition-all"
                >
                  <RiShoppingCartLine size={18} className="flex-shrink-0" />
                  <span className="flex-1">Cart</span>
                  {itemCount > 0 && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-full">{itemCount}</span>
                  )}
                </Link>

                {/* Wishlist */}
                <Link
                  to="/account/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950 transition-all"
                >
                  <RiHeartLine size={18} className="flex-shrink-0" />
                  <span className="flex-1">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-black rounded-full">{wishlistCount}</span>
                  )}
                </Link>

                {/* Account links (when logged in) */}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-secondary-100 my-2" />
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950 transition-all"
                      >
                        <RiDashboardLine size={18} className="flex-shrink-0" />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/account/orders"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950 transition-all"
                    >
                      <RiShoppingBagLine size={18} className="flex-shrink-0" />
                      My Orders
                    </Link>
                    <Link
                      to="/account/addresses"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-950 transition-all"
                    >
                      <RiMapPinLine size={18} className="flex-shrink-0" />
                      My Addresses
                    </Link>
                  </>
                )}
              </div>
            </nav>

            {/* Bottom CTA */}
            <div className="px-5 pb-6 pt-3 border-t border-secondary-100 flex-shrink-0 space-y-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-black text-red-500 border border-red-100 hover:bg-red-50 transition-all"
                >
                  <RiLogoutBoxLine size={18} />
                  Sign Out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center py-3 bg-secondary-950 text-white text-sm font-black rounded-xl uppercase tracking-widest hover:bg-secondary-800 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center py-3 border-2 border-secondary-200 text-secondary-700 text-sm font-black rounded-xl uppercase tracking-widest hover:border-secondary-950 hover:text-secondary-950 transition-all"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
