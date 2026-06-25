import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RiSettings3Line, RiSaveLine, RiVideoLine, RiImageAddLine, RiStore2Line, RiSmartphoneLine, RiCloseLine } from 'react-icons/ri';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/ui';

export default function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    promoBanners: [],
    deliveryFeeColombo: 350,
    deliveryFeeWestern: 450,
    deliveryFeeOther: 750,
    bankAccountName: '',
    bankAccountNumber: '',
    bankBranch: '',
  });
  const [uploading, setUploading] = useState({ logoUrl: false, homepageVideoUrl: false, heroImageUrl: false, shopBannerImageUrl: false, banner0: false, banner1: false });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data)
  });

  useEffect(() => {
    if (settings) {
      setForm({
        shopName: settings.shopName || 'TechPulse',
        logoUrl: settings.logoUrl || '',
        homepageVideoUrl: settings.homepageVideoUrl || '',
        shopBannerImageUrl: settings.shopBannerImageUrl || '',
        aboutHeroBgImage: settings.aboutHeroBgImage || '',
        aboutTeamVideoUrl: settings.aboutTeamVideoUrl || '',
        loginImageUrl: settings.loginImageUrl || '',
        loginTitle: settings.loginTitle || 'Simplify management With Our dashboard.',
        loginSubtitle: settings.loginSubtitle || 'Simplify your e-commerce management with our user-friendly admin dashboard.',
        heroSlides: settings.heroSlides?.length > 0 ? settings.heroSlides : [{
          id: Date.now(),
          heroTag: settings.heroTag || 'NEW ARRIVALS JUST DROPPED',
          heroMainTitle: settings.heroMainTitle || 'Welcome to Mobile tech Smartphones at Best Prices',
          heroSubtitle: settings.heroSubtitle || 'Discover the latest iPhones, Galaxy phones, Xiaomi, OnePlus, and more.',
          heroBadge1Top: settings.heroBadge1Top || 'Exclusive',
          heroBadge1Main: settings.heroBadge1Main || 'Flagship Series',
          heroBadge2Top: settings.heroBadge2Top || 'Season Sale',
          heroBadge2Main: settings.heroBadge2Main || '20% OFF',
          heroImageUrl: settings.heroImageUrl || ''
        }],
        promoBanners: settings.promoBanners || [],
        footerTagline: settings.footerTagline || 'Premium Mobile Shop',
        footerDescription: settings.footerDescription || 'Your premium destination for the latest smartphones. Shop Apple, Samsung, Xiaomi, OnePlus & more.',
        footerAddress: settings.footerAddress || '123 Tech Street, Dhaka, Bangladesh 1200',
        contactPhone: settings.contactPhone || settings.adminPhone || '',
        contactEmail: settings.contactEmail || settings.adminEmail || '',
        socialFacebook: settings.socialFacebook || '#',
        socialTwitter: settings.socialTwitter || '#',
        socialInstagram: settings.socialInstagram || '#',
        socialYoutube: settings.socialYoutube || '#',
        deliveryFeeColombo: settings.deliveryFeeColombo !== undefined ? settings.deliveryFeeColombo : 350,
        deliveryFeeWestern: settings.deliveryFeeWestern !== undefined ? settings.deliveryFeeWestern : 450,
        deliveryFeeOther: settings.deliveryFeeOther !== undefined ? settings.deliveryFeeOther : 750,
        bankAccountName: settings.bankAccountName || 'Ultramobile (PVT) LTD',
        bankAccountNumber: settings.bankAccountNumber || '183 948 2901',
        bankBranch: settings.bankBranch || 'Colombo Colpetty',
        siteFeatures: settings.siteFeatures?.length > 0 ? settings.siteFeatures : [
          { title: '2-Year Warranty', desc: 'All products come with full manufacturer warranty.', iconName: 'RiShieldCheckLine' },
          { title: 'Free Shipping', desc: 'Free delivery on orders over $500 worldwide.', iconName: 'RiTruckLine' },
          { title: '24/7 Support', desc: 'Expert support team ready to help anytime.', iconName: 'RiCustomerServiceLine' },
          { title: 'Secure Payment', desc: 'Your transactions are encrypted and safe.', iconName: 'RiSecurePaymentLine' }
        ]
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (newSettings) => api.post('/settings', newSettings),
    onSuccess: () => {
      toast.success('Settings updated successfully');
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => toast.error('Failed to update settings')
  });

  const handleSave = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const uploadFile = async (e, key, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const stateKey = index !== null ? `banner${index}` : key;
    setUploading({ ...uploading, [stateKey]: true });

    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (index !== null) {
        if (typeof index === 'string' && index.startsWith('slideImg')) {
          const slideIdx = parseInt(index.replace('slideImg', ''));
          const nextSlides = [...form.heroSlides];
          nextSlides[slideIdx].heroImageUrl = data.data.url;
          setForm({ ...form, heroSlides: nextSlides });
        } else {
          const nextBanners = [...form.promoBanners];
          nextBanners[index].image = data.data.url;
          setForm({ ...form, promoBanners: nextBanners });
        }
      } else {
        setForm({ ...form, [key]: data.data.url });
      }
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('File upload failed');
    } finally {
      setUploading({ ...uploading, [stateKey]: false });
    }
  };

  const UploadField = ({ title, desc, icon: Icon, stateKey, accept }) => (
    <div>
      <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">
        <Icon /> {title}
      </label>
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={form[stateKey]}
          onChange={(e) => setForm({ ...form, [stateKey]: e.target.value })}
          placeholder={`https://...`}
          className="input text-sm py-2 flex-1"
          disabled={isLoading || mutation.isPending}
        />
        <label className="flex items-center gap-2 cursor-pointer btn-secondary text-sm py-2 px-4 shrink-0">
          {uploading[stateKey] ? <PageLoader className="w-4 h-4" /> : <RiImageAddLine size={16} />}
          {uploading[stateKey] ? 'Uploading...' : 'Upload File'}
          <input type="file" onChange={(e) => uploadFile(e, stateKey)} className="hidden" accept={accept} disabled={uploading[stateKey]} />
        </label>
      </div>
      {desc && <p className="text-xs text-secondary-500 mt-2">{desc}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-secondary-900 flex items-center gap-2 uppercase tracking-tight">
          <RiSettings3Line className="text-primary-600" /> Site Configuration
        </h1>
        <button
          onClick={handleSave}
          disabled={isLoading || mutation.isPending}
          className="btn-primary px-8 shadow-glow"
        >
          <RiSaveLine size={20} /> {mutation.isPending ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-black text-secondary-900 border-b border-secondary-50 pb-4 mb-4 flex items-center gap-2">
            <RiStore2Line className="text-primary-600" /> Identity & Hero
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">
                Shop Name
              </label>
              <input
                type="text"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="input text-sm py-2"
                disabled={isLoading || mutation.isPending}
              />
            </div>
          </div>

          <UploadField
            title="Shop Page Banner Background"
            desc="Recommended size: 1920x400px (JPG/PNG). Appears at the top of the /shop page."
            icon={RiImageAddLine}
            stateKey="shopBannerImageUrl"
            accept="image/*"
          />

          <UploadField
            title="About Page Hero Background"
            desc="Recommended size: 1920x800px (JPG/PNG). Appears at the top of the /about page."
            icon={RiImageAddLine}
            stateKey="aboutHeroBgImage"
            accept="image/*"
          />

          <UploadField
            title="About Page Team Video"
            desc="Background video for the Our Story section on the /about page."
            icon={RiVideoLine}
            stateKey="aboutTeamVideoUrl"
            accept="video/*"
          />

          <div className="border-t border-secondary-50 pt-6 mt-6">
            <h3 className="text-md font-black text-secondary-900 mb-4 flex items-center gap-2">
              Login Page Configuration
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Login Title</label>
                <input type="text" value={form.loginTitle} onChange={(e) => setForm({ ...form, loginTitle: e.target.value })} className="input text-sm py-2" disabled={isLoading || mutation.isPending} />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Login Subtitle</label>
                <textarea value={form.loginSubtitle} onChange={(e) => setForm({ ...form, loginSubtitle: e.target.value })} className="input text-sm py-2 h-16" disabled={isLoading || mutation.isPending} />
              </div>
            </div>

            <UploadField
              title="Login Page Side Image"
              desc="Image displayed on the left side of the login page."
              icon={RiImageAddLine}
              stateKey="loginImageUrl"
              accept="image/*"
            />
          </div>

          <div className="flex items-center justify-between border-b border-secondary-50 pb-4 mt-8 mb-4">
            <h3 className="text-sm font-black text-secondary-900 flex items-center gap-2 uppercase tracking-tight">
              Hero Slider
            </h3>
            <button
              type="button"
              onClick={() => {
                const nextSlides = [
                  ...form.heroSlides,
                  {
                    id: Date.now(),
                    heroTag: 'NEW OFFER',
                    heroMainTitle: 'Amazing Deal',
                    heroSubtitle: 'Buy now and get 50% off.',
                    heroBadge1Top: 'Hot',
                    heroBadge1Main: 'Sale',
                    heroBadge2Top: 'Discount',
                    heroBadge2Main: '50% OFF',
                    heroImageUrl: ''
                  }
                ];
                setForm({ ...form, heroSlides: nextSlides });
              }}
              className="px-3 py-1.5 bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 hover:text-white transition-all flex items-center gap-2"
            >
              Add Slide
            </button>
          </div>

          <div className="space-y-6">
            {form.heroSlides?.map((slide, idx) => (
              <div key={slide.id || idx} className="p-4 bg-secondary-50 border border-secondary-100 rounded-xl relative group/card">
                {form.heroSlides?.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, heroSlides: form.heroSlides.filter((_, i) => i !== idx) });
                    }}
                    className="absolute top-4 right-4 text-secondary-400 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
                  >
                    <RiCloseLine size={18} />
                  </button>
                )}
                <h4 className="text-xs font-black text-secondary-400 uppercase tracking-widest mb-4">Slide #{idx + 1}</h4>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Tagline</label>
                    <input type="text" value={slide.heroTag} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroTag = e.target.value; setForm({ ...form, heroSlides: next }); }} className="input text-sm py-2" placeholder="NEW ARRIVALS..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Badge 1 Top / Main</label>
                    <div className="flex gap-2">
                      <input type="text" value={slide.heroBadge1Top} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroBadge1Top = e.target.value; setForm({ ...form, heroSlides: next }); }} className="input text-xs py-2 w-1/3" placeholder="Exclusive" />
                      <input type="text" value={slide.heroBadge1Main} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroBadge1Main = e.target.value; setForm({ ...form, heroSlides: next }); }} className="input text-xs py-2 w-2/3" placeholder="Flagship Series" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Main Title</label>
                    <textarea value={slide.heroMainTitle} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroMainTitle = e.target.value; setForm({ ...form, heroSlides: next }); }} className="input text-sm py-2 h-16" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-secondary-700 block mb-1.5 flex items-center gap-2 text-primary-600">Subtitle</label>
                    <textarea value={slide.heroSubtitle} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroSubtitle = e.target.value; setForm({ ...form, heroSlides: next }); }} className="input text-sm py-2 h-16" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Slide Image URL</label>
                    <div className="flex gap-2 items-center">
                      <input type="text" value={slide.heroImageUrl} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroImageUrl = e.target.value; setForm({ ...form, heroSlides: next }); }} placeholder="Image URL" className="input text-xs py-2 flex-1" />
                      <label className="flex items-center gap-2 cursor-pointer btn-secondary text-xs py-2 px-3 shrink-0">
                        {uploading[`slideImg${idx}`] ? <PageLoader className="w-3 h-3" /> : <RiImageAddLine size={14} />} Upload
                        <input type="file" onChange={(e) => uploadFile(e, null, `slideImg${idx}`)} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Badge 2 Top / Main</label>
                    <div className="flex gap-2">
                      <input type="text" value={slide.heroBadge2Top} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroBadge2Top = e.target.value; setForm({ ...form, heroSlides: next }); }} className="input text-xs py-2 w-1/3" placeholder="Season Sale" />
                      <input type="text" value={slide.heroBadge2Main} onChange={(e) => { const next = [...form.heroSlides]; next[idx].heroBadge2Main = e.target.value; setForm({ ...form, heroSlides: next }); }} className="input text-xs py-2 w-2/3" placeholder="20% OFF" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <UploadField
            title="Shop Logo"
            desc="Logo for navigation bar."
            icon={RiImageAddLine}
            stateKey="logoUrl"
            accept="image/*"
          />



          <UploadField
            title="Background Video"
            desc="Animated background for hero."
            icon={RiVideoLine}
            stateKey="homepageVideoUrl"
            accept="video/*"
          />
        </div>

        <div className="card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-secondary-50 pb-4 mb-4">
            <h2 className="text-lg font-black text-secondary-900 flex items-center gap-2 uppercase tracking-tight">
              <RiSmartphoneLine className="text-primary-600" /> Promotional Banners
            </h2>
            <button
              type="button"
              onClick={() => {
                const nextBanners = [
                  ...form.promoBanners,
                  {
                    id: Date.now(),
                    title: 'New Promo',
                    subtitle: 'Up to 10% off',
                    badge: 'New',
                    buttonText: 'Shop Now',
                    link: '/shop',
                    image: '',
                    bgColor: 'from-primary-600 to-primary-800'
                  }
                ];
                setForm({ ...form, promoBanners: nextBanners });
              }}
              className="px-3 py-1.5 bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 hover:text-white transition-all flex items-center gap-2"
            >
              Add New
            </button>
          </div>

          <div className="space-y-8">
            {form.promoBanners.map((banner, idx) => (
              <div key={banner.id || idx} className="p-4 bg-secondary-50 rounded-2xl border border-secondary-100 space-y-4 relative group/card">
                <button
                  type="button"
                  onClick={() => {
                    const next = form.promoBanners.filter((_, i) => i !== idx);
                    setForm({ ...form, promoBanners: next });
                  }}
                  className="absolute top-4 right-4 text-secondary-400 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
                >
                  <RiCloseLine size={18} />
                </button>

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black text-secondary-400 uppercase tracking-widest">Banner #{idx + 1}</h3>
                  <div className={`w-3 h-3 rounded-full ${idx % 2 === 0 ? 'bg-primary-500' : 'bg-secondary-950'}`} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-secondary-500 mb-1 block">Title</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => {
                        const next = [...form.promoBanners];
                        next[idx].title = e.target.value;
                        setForm({ ...form, promoBanners: next });
                      }}
                      className="input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-secondary-500 mb-1 block">Badge</label>
                    <input
                      type="text"
                      value={banner.badge}
                      onChange={(e) => {
                        const next = [...form.promoBanners];
                        next[idx].badge = e.target.value;
                        setForm({ ...form, promoBanners: next });
                      }}
                      className="input text-xs py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-secondary-500 mb-1 block">Subtitle</label>
                  <input
                    type="text"
                    value={banner.subtitle}
                    onChange={(e) => {
                      const next = [...form.promoBanners];
                      next[idx].subtitle = e.target.value;
                      setForm({ ...form, promoBanners: next });
                    }}
                    className="input text-xs py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-secondary-500 mb-1 block">Button Text</label>
                    <input
                      type="text"
                      value={banner.buttonText}
                      onChange={(e) => {
                        const next = [...form.promoBanners];
                        next[idx].buttonText = e.target.value;
                        setForm({ ...form, promoBanners: next });
                      }}
                      className="input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-secondary-500 mb-1 block">Link</label>
                    <input
                      type="text"
                      value={banner.link}
                      onChange={(e) => {
                        const next = [...form.promoBanners];
                        next[idx].link = e.target.value;
                        setForm({ ...form, promoBanners: next });
                      }}
                      className="input text-xs py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-secondary-500 mb-1 block">Banner Product Image</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="text"
                      value={banner.image}
                      onChange={(e) => {
                        const next = [...form.promoBanners];
                        next[idx].image = e.target.value;
                        setForm({ ...form, promoBanners: next });
                      }}
                      placeholder="Image URL"
                      className="input text-xs py-2 flex-1"
                    />
                    <label className="flex items-center gap-2 cursor-pointer btn-secondary text-xs py-2 px-3 shrink-0">
                      {uploading[`banner${idx}`] ? <PageLoader className="w-3 h-3" /> : <RiImageAddLine size={14} />}
                      Upload
                      <input type="file" onChange={(e) => uploadFile(e, null, idx)} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-6 lg:col-span-2">
          <h2 className="text-lg font-black text-secondary-900 border-b border-secondary-50 pb-4 mb-4 flex items-center gap-2">
            Footer Configuration
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Footer Tagline</label>
              <input type="text" value={form.footerTagline} onChange={(e) => setForm({ ...form, footerTagline: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Footer Address</label>
              <input type="text" value={form.footerAddress} onChange={(e) => setForm({ ...form, footerAddress: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Footer Description</label>
              <textarea value={form.footerDescription} onChange={(e) => setForm({ ...form, footerDescription: e.target.value })} className="input text-sm py-2 w-full h-20" disabled={isLoading || mutation.isPending} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Contact Phone</label>
              <input type="text" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} placeholder="+880 170 000 0000" />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} placeholder="support@domain.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Facebook URL</label>
              <input type="url" value={form.socialFacebook} onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Twitter/X URL</label>
              <input type="url" value={form.socialTwitter} onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">Instagram URL</label>
              <input type="url" value={form.socialInstagram} onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} />
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-700 block mb-1.5 flex items-center gap-2">YouTube URL</label>
              <input type="url" value={form.socialYoutube} onChange={(e) => setForm({ ...form, socialYoutube: e.target.value })} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} />
            </div>
          </div>
        </div>

        <div className="card p-6 md:p-8 border border-secondary-200 lg:col-span-2">
          <h3 className="text-sm font-bold text-secondary-900 border-b border-secondary-100 pb-3 mb-5 flex items-center gap-2">
            🚚 Delivery Fees
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-medium text-secondary-700 block mb-1">Colombo Area (LKR)</label>
              <input type="number" value={form.deliveryFeeColombo} onChange={(e) => setForm({ ...form, deliveryFeeColombo: e.target.value })} className="input text-sm py-2.5 w-full" disabled={isLoading || mutation.isPending} />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-700 block mb-1">Western Province (LKR)</label>
              <input type="number" value={form.deliveryFeeWestern} onChange={(e) => setForm({ ...form, deliveryFeeWestern: e.target.value })} className="input text-sm py-2.5 w-full" disabled={isLoading || mutation.isPending} />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-700 block mb-1">Other Provinces (LKR)</label>
              <input type="number" value={form.deliveryFeeOther} onChange={(e) => setForm({ ...form, deliveryFeeOther: e.target.value })} className="input text-sm py-2.5 w-full" disabled={isLoading || mutation.isPending} />
            </div>
          </div>
          <p className="text-xs text-secondary-500 mt-4 bg-secondary-50 p-3 rounded-lg">
            These rates will dynamically apply at checkout based on the customer's selected Province and City.
          </p>
        </div>

        <div className="card p-6 md:p-8 border border-secondary-200 lg:col-span-2">
          <h3 className="text-sm font-bold text-secondary-900 border-b border-secondary-100 pb-3 mb-5 flex items-center gap-2">
            🏦 Bank Transfer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-medium text-secondary-700 block mb-1">Company Account Name</label>
              <input type="text" value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} className="input text-sm py-2.5 w-full uppercase" disabled={isLoading || mutation.isPending} placeholder="Ultramobile (PVT) LTD" />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-700 block mb-1">Account Number</label>
              <input type="text" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="input text-sm py-2.5 w-full font-mono font-bold" disabled={isLoading || mutation.isPending} placeholder="183 948 2901" />
            </div>
            <div>
              <label className="text-xs font-medium text-secondary-700 block mb-1">Branch Name</label>
              <input type="text" value={form.bankBranch} onChange={(e) => setForm({ ...form, bankBranch: e.target.value })} className="input text-sm py-2.5 w-full" disabled={isLoading || mutation.isPending} placeholder="Colombo Colpetty" />
            </div>
          </div>
          <p className="text-xs text-secondary-500 mt-4 bg-secondary-50 p-3 rounded-lg">
            These details will be displayed to the customer during checkout when they select Bank Transfer as the payment method.
          </p>
        </div>

        <div className="card p-6 space-y-6 lg:col-span-2">
          <h2 className="text-lg font-black text-secondary-900 border-b border-secondary-50 pb-4 mb-4 flex items-center gap-2">
            Site Features (Services)
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {form.siteFeatures?.map((feature, idx) => (
              <div key={idx} className="p-4 bg-secondary-50 border border-secondary-100 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-primary-600 uppercase tracking-widest">Feature #{idx + 1}</h4>
                <div>
                  <label className="text-xs font-medium text-secondary-700 block mb-1">Icon</label>
                  <select value={feature.iconName || ''} onChange={(e) => { const next = [...form.siteFeatures]; next[idx].iconName = e.target.value; setForm({ ...form, siteFeatures: next }); }} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending}>
                    <option value="RiShieldCheckLine">Shield (Warranty)</option>
                    <option value="RiTruckLine">Truck (Shipping)</option>
                    <option value="RiCustomerServiceLine">Headset (Support)</option>
                    <option value="RiSecurePaymentLine">Card (Payment)</option>
                    <option value="RiGlobalLine">Globe (Worldwide)</option>
                    <option value="RiMoneyDollarCircleLine">Money (Price)</option>
                    <option value="RiGiftLine">Gift (Offers)</option>
                    <option value="RiSmartphoneLine">Smartphone</option>
                    <option value="RiStarFill">Star</option>
                    <option value="RiFlashlightLine">Lightning</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary-700 block mb-1">Title</label>
                  <input type="text" value={feature.title} onChange={(e) => { const next = [...form.siteFeatures]; next[idx].title = e.target.value; setForm({ ...form, siteFeatures: next }); }} className="input text-sm py-2 w-full" disabled={isLoading || mutation.isPending} />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary-700 block mb-1">Description</label>
                  <textarea value={feature.desc} onChange={(e) => { const next = [...form.siteFeatures]; next[idx].desc = e.target.value; setForm({ ...form, siteFeatures: next }); }} className="input text-sm py-2 h-20 w-full" disabled={isLoading || mutation.isPending} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-4 bg-white border border-secondary-100 shadow-sm col-span-2">
          <h2 className="font-black text-[10px] uppercase tracking-widest text-secondary-400 mb-4 flex items-center gap-2">
            Live Video Preview
          </h2>
          <div className="aspect-video bg-secondary-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
            {form.homepageVideoUrl ? (
              <video key={form.homepageVideoUrl} src={form.homepageVideoUrl} autoPlay muted loop className="w-full h-full object-contain" />
            ) : (
              <div className="text-secondary-500 text-xs italic">No Video</div>
            )}
          </div>
        </div>

        <div className="card p-4 bg-white border border-secondary-100 shadow-sm col-span-2">
          <h2 className="font-black text-[10px] uppercase tracking-widest text-secondary-400 mb-4 flex items-center gap-2">
            Hero Slide #1 Image Preview
          </h2>
          <div className="aspect-video bg-secondary-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-4">
            {form.heroSlides?.[0]?.heroImageUrl ? (
              <img src={form.heroSlides[0].heroImageUrl} alt="Hero preview" className="max-w-full max-h-full object-contain drop-shadow-xl" />
            ) : (
              <div className="text-secondary-500 text-xs italic">No Hero Image for Slide #1</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
