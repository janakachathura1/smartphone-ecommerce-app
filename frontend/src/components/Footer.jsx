import { Link } from 'react-router-dom';
import { RiSmartphoneLine, RiMailLine, RiPhoneLine, RiMapPinLine, RiTwitterXLine, RiFacebookCircleLine, RiInstagramLine, RiYoutubeLine } from 'react-icons/ri';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(res => res.data.data)
  });
  return (
    <footer className="bg-secondary-950 text-secondary-300 border-t border-white/5">
      {/* Newsletter */}
      <div className="bg-secondary-900">
        <div className="container-custom py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white text-2xl font-bold">Stay Updated</h3>
              <p className="text-blue-200 mt-1">Get the latest deals, new arrivals & tech news.</p>
            </div>
            <form className="flex items-center gap-3 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 md:w-72 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button type="submit" className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors flex-shrink-0">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="container-custom py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={settings?.shopName || 'TechPulse'} className="h-10 w-auto object-contain brightness-0 invert" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-black text-lg">{(settings?.shopName || 'TechPulse').charAt(0)}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-xl text-white tracking-wider uppercase leading-none group-hover:text-primary-400 transition-colors">
                  {settings?.shopName || 'TechPulse'}
                </span>
                <span className="text-[9px] font-bold text-secondary-500 tracking-[0.3em] uppercase mt-1">{settings?.footerTagline || 'Premium Mobile Shop'}</span>
              </div>
            </Link>
            <p className="text-secondary-400 text-sm leading-relaxed mb-4">
              {settings?.footerDescription || 'Your premium destination for the latest smartphones. Shop Apple, Samsung, Xiaomi, OnePlus & more.'}
            </p>
            <div className="flex gap-3">
              {[
                { Icon: RiTwitterXLine, url: settings?.socialTwitter },
                { Icon: RiFacebookCircleLine, url: settings?.socialFacebook },
                { Icon: RiInstagramLine, url: settings?.socialInstagram },
                { Icon: RiYoutubeLine, url: settings?.socialYoutube }
              ].map(({ Icon, url }, i) => (
                <a key={i} href={url || '#'} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-secondary-800 hover:bg-primary-600 flex items-center justify-center text-secondary-400 hover:text-white transition-all">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/shop', label: 'All Phones' },
                { to: '/about', label: 'About Us' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/shop?isFeatured=true', label: 'Featured' },
                { to: '/shop?isNewArrival=true', label: 'New Arrivals' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-secondary-400 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-white font-semibold mb-4">My Account</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/account/orders', label: 'Track Orders' },
                { to: '/account/wishlist', label: 'Wishlist' },
                { to: '/account/addresses', label: 'Addresses' },
                { to: '/account/profile', label: 'Profile Settings' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-secondary-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <RiMapPinLine size={18} className="text-primary-400 flex-shrink-0 mt-0.5" />
                <span className="text-secondary-400 text-sm">{settings?.footerAddress || '123 Tech Street, Dhaka, Bangladesh 1200'}</span>
              </li>
              <li className="flex items-center gap-3">
                <RiPhoneLine size={18} className="text-primary-400 flex-shrink-0" />
                <a href={`tel:${(settings?.adminPhone || '+8801700000000').replace(/[^+\d]/g, '')}`} className="text-secondary-400 hover:text-white text-sm transition-colors">{settings?.adminPhone || '+880 170 000 0000'}</a>
              </li>
              <li className="flex items-center gap-3">
                <RiMailLine size={18} className="text-primary-400 flex-shrink-0" />
                <a href={`mailto:${settings?.adminEmail || 'support@techpulse.com'}`} className="text-secondary-400 hover:text-white text-sm transition-colors">{settings?.adminEmail || 'support@techpulse.com'}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-secondary-500 text-sm">© {new Date().getFullYear()} TechPulse. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-secondary-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
