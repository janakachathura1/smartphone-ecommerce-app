import { useState } from 'react';
import { 
  RiMailLine, RiPhoneLine, RiMapPinLine, RiWhatsappLine, 
  RiSendPlane2Line, RiTimeLine, RiQuestionLine, 
  RiArrowDownSLine, RiCheckboxCircleLine, RiCustomerService2Line,
  RiMapPin2Line, RiGlobalLine, RiShieldCheckLine
} from 'react-icons/ri';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ScrollReveal from '../components/ScrollReveal';

const faqs = [
  {
    q: 'How long does shipping take?',
    a: 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery within metropolitan areas.'
  },
  {
    q: 'What is your return policy?',
    a: 'We offer a 7-day return policy on all products. Items must be in original packaging and unused condition.'
  },
  {
    q: 'Do you offer warranty on smartphones?',
    a: 'Yes! All smartphones come with a minimum 1-year manufacturer warranty. Extended warranty plans are also available at checkout.'
  },
  {
    q: 'Can I track my order?',
    a: 'Absolutely. Once your order is shipped, you\'ll receive a tracking link via email and SMS to monitor your delivery in real-time.'
  },
];

function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(false);
  return (
    <ScrollReveal animation="slide-up" delay={index * 80}>
      <div 
        className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
          open 
            ? 'bg-primary-50/60 border-primary-200 shadow-lg shadow-primary-100/40' 
            : 'bg-white border-secondary-100 hover:border-primary-200 hover:shadow-md'
        }`}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between gap-4 p-6 text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
              open ? 'bg-primary-600 text-white rotate-0' : 'bg-primary-50 text-primary-600'
            }`}>
              <RiQuestionLine size={20} />
            </div>
            <span className="font-bold text-secondary-900 text-[15px]">{faq.q}</span>
          </div>
          <RiArrowDownSLine
            size={22}
            className={`text-secondary-400 shrink-0 transition-transform duration-500 ${open ? 'rotate-180 text-primary-600' : ''}`}
          />
        </button>
        <div className={`transition-all duration-500 ease-in-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <p className="px-6 pb-6 pl-20 text-secondary-500 text-sm leading-relaxed font-medium">
            {faq.a}
          </p>
        </div>
      </div>
    </ScrollReveal>
  );
}

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [focusedField, setFocusedField] = useState(null);
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(res => res.data.data)
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/contact', data),
    onSuccess: () => {
      toast.success('Your message has been sent!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    },
    onError: () => toast.error('Failed to send message.')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      return toast.error('Name, email, and message are required.');
    }
    mutation.mutate(formData);
  };

  const contactMethods = [
    {
      icon: RiMailLine,
      title: 'Email Support',
      desc: settings?.adminEmail || 'support@techpulse.com',
      subtitle: 'We reply within 24 hours',
      link: `mailto:${settings?.adminEmail || 'support@techpulse.com'}`,
      gradient: 'from-blue-500 to-cyan-400',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: RiPhoneLine,
      title: 'Call Us',
      desc: settings?.adminPhone || '+880 170 000 0000',
      subtitle: 'Mon-Fri, 9AM-8PM',
      link: `tel:${(settings?.adminPhone || '+8801700000000').replace(/[^+\d]/g, '')}`,
      gradient: 'from-emerald-500 to-teal-400',
      bgLight: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: RiWhatsappLine,
      title: 'WhatsApp',
      desc: settings?.adminPhone || '+880 170 000 0000',
      subtitle: 'Instant messaging support',
      link: `https://wa.me/${(settings?.adminPhone || '8801700000000').replace(/[^+\d]/g, '')}`,
      gradient: 'from-green-500 to-lime-400',
      bgLight: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: RiMapPinLine,
      title: 'Visit Our Store',
      desc: '123 Tech Street, Dhaka',
      subtitle: 'Bangladesh 1200',
      link: '#map-section',
      gradient: 'from-violet-500 to-purple-400',
      bgLight: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ];

  const FormField = ({ label, type = 'text', value, onChange, placeholder, isTextarea = false, fieldName }) => {
    const isFocused = focusedField === fieldName;
    const hasValue = value.length > 0;
    
    return (
      <div className="relative group">
        <label className={`absolute left-4 transition-all duration-300 pointer-events-none z-10 font-semibold ${
          isFocused || hasValue 
            ? '-top-2.5 text-[11px] px-2 bg-white rounded-full text-primary-600' 
            : 'top-4 text-sm text-secondary-400'
        }`}>
          {label}
        </label>
        {isTextarea ? (
          <textarea
            rows={5}
            value={value}
            onChange={onChange}
            onFocus={() => setFocusedField(fieldName)}
            onBlur={() => setFocusedField(null)}
            placeholder={isFocused ? placeholder : ''}
            className={`input resize-none pt-4 transition-all duration-300 ${
              isFocused 
                ? 'border-primary-400 bg-white shadow-lg shadow-primary-100/30 ring-4 ring-primary-50' 
                : hasValue 
                  ? 'border-primary-200 bg-primary-50/20' 
                  : 'bg-secondary-50/50 border-secondary-200 hover:border-secondary-300'
            }`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocusedField(fieldName)}
            onBlur={() => setFocusedField(null)}
            placeholder={isFocused ? placeholder : ''}
            className={`input py-4 transition-all duration-300 ${
              isFocused 
                ? 'border-primary-400 bg-white shadow-lg shadow-primary-100/30 ring-4 ring-primary-50' 
                : hasValue 
                  ? 'border-primary-200 bg-primary-50/20' 
                  : 'bg-secondary-50/50 border-secondary-200 hover:border-secondary-300'
            }`}
          />
        )}
        {/* Animated bottom border accent */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500 ${
          isFocused ? 'w-[calc(100%-2rem)]' : 'w-0'
        }`} />
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen text-secondary-950">
      {/* ───── Hero Section ───── */}
      <section className="py-32 lg:py-44 relative overflow-hidden flex items-center justify-center min-h-[520px]">
        {/* Dark gradient background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-secondary-950 via-secondary-900 to-primary-950" />
        
        {/* Animated decorative orbs */}
        <div className="absolute top-20 -left-20 w-80 h-80 bg-primary-600/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-primary-400/15 rounded-full blur-[120px] animate-float-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[80px]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 z-[1] opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        <div className="container-custom relative z-10 text-center">
          <ScrollReveal animation="slide-up">
            <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse-slow" />
              Get In Touch
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter text-white drop-shadow-2xl">
              Contact <span className="text-primary-400">Us</span>
            </h1>
            <p className="text-secondary-300 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-lg">
              Have questions or need help? Our team of experts is ready to assist you with anything — from product inquiries to after-sales support.
            </p>
          </ScrollReveal>

          {/* Scrolling indicator */}
          <ScrollReveal animation="fade-in" delay={800}>
            <div className="mt-12 flex flex-col items-center gap-2 opacity-60">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em]">Scroll Down</span>
              <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce-slow" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ───── Contact Methods Grid ───── */}
      <section className="relative z-20 -mt-16 pb-8">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactMethods.map((method, i) => (
              <ScrollReveal key={method.title} animation="slide-up" delay={i * 100}>
                <a
                  href={method.link}
                  className="group relative block p-7 rounded-[2rem] bg-white/95 backdrop-blur-2xl border border-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] hover:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.18)] hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                >
                  {/* Gradient hover overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-[2rem]`} />
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl ${method.bgLight} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                      <method.icon size={26} className={`${method.iconColor} transition-colors`} />
                    </div>
                    <h4 className="font-black text-secondary-950 text-lg mb-1 tracking-tight">{method.title}</h4>
                    <p className="text-secondary-700 text-sm font-semibold">{method.desc}</p>
                    <p className="text-secondary-400 text-xs font-medium mt-1">{method.subtitle}</p>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Main Content: Form + Sidebar ───── */}
      <section className="py-20">
        <div className="container-custom">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Contact Form — 3 cols */}
            <div className="lg:col-span-3">
              <ScrollReveal animation="slide-right">
                <div className="relative p-10 md:p-14 rounded-[3rem] bg-white border border-secondary-100 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
                  {/* Subtle decorative corner gradient */}
                  <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-100/40 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center">
                        <RiSendPlane2Line size={22} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black tracking-tight text-secondary-950">Send us a Message</h3>
                      </div>
                    </div>
                    <p className="text-secondary-500 text-sm font-medium mb-10 ml-16">Fill out the form below and we'll get back to you as soon as possible.</p>

                    <form className="space-y-7" onSubmit={handleSubmit}>
                      <div className="grid md:grid-cols-2 gap-7">
                        <FormField
                          label="Full Name"
                          fieldName="name"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="John Doe"
                        />
                        <FormField
                          label="Email Address"
                          fieldName="email"
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          placeholder="john@example.com"
                        />
                      </div>
                      <FormField
                        label="Subject"
                        fieldName="subject"
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        placeholder="Inquiry about iPhone 16 Pro"
                      />
                      <FormField
                        label="Your Message"
                        fieldName="message"
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        placeholder="Tell us how we can help you..."
                        isTextarea
                      />
                      
                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="group/btn relative w-full py-5 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-black text-base uppercase tracking-[0.15em] shadow-xl shadow-primary-200/50 hover:shadow-2xl hover:shadow-primary-300/50 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
                      >
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        <RiSendPlane2Line size={22} className="relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                        <span className="relative z-10">{mutation.isPending ? 'Sending...' : 'Send Message'}</span>
                      </button>

                      {/* Success checkmarks */}
                      {mutation.isSuccess && (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold animate-slide-up">
                          <RiCheckboxCircleLine size={20} />
                          Message sent successfully! We'll respond within 24 hours.
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Sidebar — 2 cols */}
            <div className="lg:col-span-2 space-y-7">
              {/* Support hours card */}
              <ScrollReveal animation="slide-left">
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-secondary-900 to-secondary-950 text-white shadow-2xl shadow-secondary-900/30 overflow-hidden relative">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-600/15 rounded-full blur-[50px]" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <RiTimeLine size={22} className="text-primary-400" />
                      </div>
                      <h4 className="font-black text-lg tracking-tight">Support Hours</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                          <span className="text-secondary-300 text-sm font-medium">Monday — Friday</span>
                        </div>
                        <span className="text-white font-bold text-sm">9:00 AM – 8:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow" />
                          <span className="text-secondary-300 text-sm font-medium">Saturday — Sunday</span>
                        </div>
                        <span className="text-white font-bold text-sm">10:00 AM – 6:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-secondary-300 text-sm font-medium">Public Holidays</span>
                        </div>
                        <span className="text-secondary-400 font-bold text-sm">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Why choose us card */}
              <ScrollReveal animation="slide-left" delay={150}>
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-2xl shadow-primary-200/40 overflow-hidden relative group">
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-[40px] group-hover:bg-white/15 transition-all duration-700" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <RiCustomerService2Line size={22} className="text-white" />
                      </div>
                      <h4 className="font-black text-lg tracking-tight">Why Choose Us</h4>
                    </div>
                    <div className="space-y-4">
                      {[
                        { icon: RiShieldCheckLine, text: '100% Authentic Products' },
                        { icon: RiGlobalLine, text: 'Nationwide Delivery' },
                        { icon: RiCustomerService2Line, text: '24/7 Customer Support' },
                        { icon: RiCheckboxCircleLine, text: 'Easy Returns & Warranty' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                            <item.icon size={16} />
                          </div>
                          <span className="text-sm font-semibold text-primary-50">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Quick connect */}
              <ScrollReveal animation="slide-left" delay={300}>
                <div className="p-8 rounded-[2.5rem] bg-white border border-secondary-100 shadow-card">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                      <RiMapPin2Line size={22} className="text-primary-600" />
                    </div>
                    <h4 className="font-black text-lg tracking-tight text-secondary-950">Store Location</h4>
                  </div>
                  <p className="text-secondary-500 text-sm font-medium leading-relaxed mb-5">
                    123 Tech Street, Gulshan-2<br />
                    Dhaka, Bangladesh 1200
                  </p>
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group/link"
                  >
                    <RiMapPinLine size={16} />
                    Open in Google Maps
                    <span className="inline-block transition-transform duration-300 group-hover/link:translate-x-1">→</span>
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Map Section ───── */}
      <section id="map-section" className="py-0">
        <ScrollReveal animation="fade-in">
          <div className="container-custom">
            <div className="rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.1)] border border-secondary-100">
              <iframe
                title="Store Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.902756038!2d90.4125!3d23.7808!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ2JzUxLjAiTiA5MMKwMjQnNDUuMCJF!5e0!3m2!1sen!2sbd!4v1234567890"
                className="w-full h-[350px] md:h-[420px] border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ───── FAQ Section ───── */}
      <section className="py-24">
        <div className="container-custom">
          <ScrollReveal animation="slide-up">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-xs font-black uppercase tracking-widest mb-4">
                <RiQuestionLine size={14} />
                Help Center
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-secondary-950">
                Frequently Asked <span className="text-primary-600">Questions</span>
              </h2>
              <p className="text-secondary-500 text-base font-medium mt-4 max-w-xl mx-auto">
                Can't find the answer you're looking for? Send us a message and we'll get back to you.
              </p>
            </div>
          </ScrollReveal>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Newsletter ───── */}
      <section className="py-20">
        <div className="container-custom">
          <ScrollReveal animation="slide-up">
            <div className="relative p-12 md:p-16 rounded-[3rem] bg-gradient-to-br from-secondary-900 via-secondary-950 to-primary-950 overflow-hidden text-center">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-60 h-60 bg-primary-600/15 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-400/10 rounded-full blur-[100px]" />
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }}
              />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary-600/20 backdrop-blur-md border border-primary-400/20 flex items-center justify-center mx-auto mb-6">
                  <RiMailLine size={28} className="text-primary-400" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                  Stay Updated
                </h3>
                <p className="text-secondary-400 text-base font-medium max-w-lg mx-auto mb-8">
                  Subscribe to our newsletter for the latest smartphone deals, tech news, and exclusive offers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400/50 transition-all font-medium text-sm"
                  />
                  <button className="px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm uppercase tracking-wider transition-all duration-300 shadow-lg shadow-primary-600/30 hover:shadow-primary-500/40 shrink-0 cursor-pointer">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
