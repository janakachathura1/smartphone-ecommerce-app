import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RiSearchLine,
  RiBankCardLine, RiBankLine, RiCloseLine, RiPrinterLine,
  RiSmartphoneLine, RiDeleteBin6Line, RiMoneyDollarCircleLine, RiCheckLine,
  RiUser3Line, RiStore2Line, RiBarcodeLine,
  RiRefreshLine, RiGridLine, RiListCheck2, RiPriceTag3Line, RiAppsLine,
} from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Cash',     icon: RiMoneyDollarCircleLine, color: '#16a34a', border: '#bbf7d0', bg: '#f0fdf4', textColor: '#14532d' },
  { id: 'card',     label: 'Card',     icon: RiBankCardLine,          color: '#2563eb', border: '#bfdbfe', bg: '#eff6ff', textColor: '#1e3a8a' },
  { id: 'transfer', label: 'Transfer', icon: RiBankLine,              color: '#7c3aed', border: '#ddd6fe', bg: '#f5f3ff', textColor: '#4c1d95' },
];

const QUICK_CASH = [100, 200, 500, 1000, 2000, 5000];
const VAT_RATE = 0.05;

// ─── Colour Palette (light theme) ─────────────────────────────────────────────
const C = {
  bg:          '#f1f5f9',   // page background
  surface:     '#ffffff',   // cards / panels
  surfaceAlt:  '#f8fafc',   // subtle secondary surfaces
  border:      '#e2e8f0',   // borders
  borderFocus: '#3b82f6',   // focus rings
  text:        '#0f172a',   // primary text
  textSub:     '#475569',   // secondary text
  textMuted:   '#94a3b8',   // muted text
  accent:      '#3b82f6',   // blue accent
  accentBg:    '#eff6ff',   // blue soft bg
  green:       '#16a34a',   // price / positive
  greenBg:     '#f0fdf4',
  red:         '#dc2626',   // danger / discount
  redBg:       '#fef2f2',
  orange:      '#ea580c',   // low-stock
  orangeBg:    '#fff7ed',
  topbar:      '#ffffff',
  topbarBorder:'#e2e8f0',
  catBar:      '#f8fafc',
  catBarBorder:'#e2e8f0',
  spinner:     '#3b82f6',
};

// ─── Utility ──────────────────────────────────────────────────────────────────
function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function Clock() {
  const now = useTime();
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums' }}>
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
        {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}

// ─── Stock badge ──────────────────────────────────────────────────────────────
function StatusBadge({ stock }) {
  if (stock <= 0) return (
    <span style={{ background: C.redBg, color: C.red, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>OUT</span>
  );
  if (stock <= 5) return (
    <span style={{ background: C.orangeBg, color: C.orange, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: 0.5 }}>LOW</span>
  );
  return null;
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, viewMode }) {
  const outOfStock = product.stock <= 0;

  if (viewMode === 'list') {
    return (
      <button
        onClick={() => onAdd(product)}
        disabled={outOfStock}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          cursor: outOfStock ? 'not-allowed' : 'pointer',
          opacity: outOfStock ? 0.55 : 1, transition: 'all 0.15s', textAlign: 'left', width: '100%',
        }}
        onMouseEnter={e => { if (!outOfStock) { e.currentTarget.style.borderColor = C.borderFocus; e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.12)'; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {product.images?.[0]?.url
            ? <img src={product.images[0].url} alt={product.name} style={{ maxWidth: '88%', maxHeight: '88%', objectFit: 'contain' }} />
            : <RiSmartphoneLine size={20} color={C.textMuted} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
          <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>SKU: {product.sku || product.id?.slice(0, 8)}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{formatPrice(product.finalPrice)}</div>
          <div style={{ fontSize: 10, color: C.textMuted }}>{product.stock} left</div>
        </div>
        <div style={{ marginLeft: 4 }}><StatusBadge stock={product.stock} /></div>
      </button>
    );
  }

  // Grid
  return (
    <button
      onClick={() => onAdd(product)}
      disabled={outOfStock}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14,
        cursor: outOfStock ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', textAlign: 'left',
        position: 'relative', opacity: outOfStock ? 0.55 : 1, transition: 'all 0.18s',
      }}
      onMouseEnter={e => { if (!outOfStock) { e.currentTarget.style.borderColor = C.borderFocus; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.12)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ position: 'absolute', top: 9, right: 9 }}><StatusBadge stock={product.stock} /></div>
      <div style={{ height: 64, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.surfaceAlt, borderRadius: 10, border: `1px solid ${C.border}` }}>
        {product.images?.[0]?.url
          ? <img src={product.images[0].url} alt={product.name} style={{ maxHeight: '80%', maxWidth: '80%', objectFit: 'contain' }} />
          : <RiSmartphoneLine size={26} color={C.textMuted} />}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.4, marginBottom: 6, flex: 1 }}>{product.name}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.green, marginBottom: 3 }}>{formatPrice(product.finalPrice)}</div>
      <div style={{ fontSize: 10, color: C.textMuted }}>{product.stock} in stock</div>
    </button>
  );
}

// ─── Cart Item ────────────────────────────────────────────────────────────────
function CartItem({ item, onUpdate, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {item.image
          ? <img src={item.image} alt={item.name} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} />
          : <RiSmartphoneLine size={17} color={C.textMuted} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginTop: 2 }}>{formatPrice(item.price)} × {item.quantity}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => onUpdate(item.productId, -1)} style={{ width: 24, height: 24, background: C.surfaceAlt, color: C.textSub, borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>−</button>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.text, minWidth: 22, textAlign: 'center' }}>{item.quantity}</span>
        <button onClick={() => onUpdate(item.productId, +1)} style={{ width: 24, height: 24, background: C.surfaceAlt, color: C.textSub, borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>+</button>
        <button onClick={() => onRemove(item.productId)} style={{ width: 24, height: 24, background: C.redBg, color: C.red, borderRadius: 6, border: `1px solid #fecaca`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
          <RiDeleteBin6Line size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ total, cashGiven, setCashGiven, onCancel, onConfirm, isSubmitting }) {
  const change = Math.max((parseFloat(cashGiven) || 0) - total, 0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, width: 430, padding: 36, boxShadow: '0 24px 60px rgba(15,23,42,0.18)', position: 'relative' }}>
        <button onClick={onCancel} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RiCloseLine size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 42, height: 42, background: C.greenBg, border: '1px solid #bbf7d0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiMoneyDollarCircleLine size={22} color={C.green} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Cash Payment</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Enter amount received from customer</div>
          </div>
        </div>

        {/* Amount due */}
        <div style={{ textAlign: 'center', background: C.greenBg, border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '18px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.green, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Amount Due</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: C.green, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
            {formatPrice(total)}
          </div>
        </div>

        {/* Cash input */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cash Received</label>
          <input
            ref={inputRef}
            type="number"
            value={cashGiven}
            onChange={e => setCashGiven(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && cashGiven) onConfirm(); }}
            placeholder="0.00"
            style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: `2px solid ${C.borderFocus}`, outline: 'none', fontSize: 24, color: C.text, background: C.surface, fontWeight: 700, textAlign: 'center' }}
          />
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
          {QUICK_CASH.map(v => {
            const selected = cashGiven === String(v);
            return (
              <button key={v} onClick={() => setCashGiven(String(v))}
                style={{ padding: '9px 4px', background: selected ? C.accentBg : C.surfaceAlt, border: `1.5px solid ${selected ? C.accent : C.border}`, borderRadius: 9, color: selected ? C.accent : C.textSub, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                {formatPrice(v)}
              </button>
            );
          })}
        </div>

        {/* Change */}
        <div style={{ display: 'flex', justifyContent: 'space-between', background: change > 0 ? C.greenBg : C.surfaceAlt, border: `1px solid ${change > 0 ? '#bbf7d0' : C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: C.textSub, fontWeight: 600 }}>Change to Return</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: change > 0 ? C.green : C.textSub }}>{formatPrice(change)}</span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '13px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, fontWeight: 700, color: C.textSub, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting || !cashGiven}
            style={{ flex: 2, padding: '13px', background: (!cashGiven || isSubmitting) ? '#86efac' : '#16a34a', border: 'none', borderRadius: 12, fontWeight: 700, color: '#fff', fontSize: 14, cursor: (!cashGiven || isSubmitting) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: !cashGiven ? 0.5 : 1 }}
          >
            <RiCheckLine size={18} />{isSubmitting ? 'Processing...' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ order, shopName, shopPhone, onClose }) {
  const printRef = useRef(null);
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const w = window.open('', '_blank', 'width=400,height=700');
    w.document.write(`
      <html><head><title>Receipt</title><style>
        body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; padding: 20px; max-width: 320px; margin: 0 auto; }
        .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .divider { border-top: 1px dashed #999; margin: 12px 0; }
        .total-row { font-weight: bold; font-size: 15px; }
        @media print { body { padding: 0; } }
      </style></head><body>${content}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, width: 460, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(15,23,42,0.18)', position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, background: C.accentBg, border: `1px solid #bfdbfe`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiPrinterLine size={18} color={C.accent} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Receipt</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>#{order.receiptNo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiCloseLine size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div ref={printRef}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.accent, fontFamily: 'monospace' }}>📱 {shopName || 'PhoneHub'}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Mobile Shop & Repair Centre</div>
              {shopPhone && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>📞 {shopPhone}</div>}
            </div>
            <div style={{ borderTop: `1px dashed ${C.border}`, margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
              <span>Receipt #: {order.receiptNo}</span><span>{order.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
              <span>Customer: Walk-in</span><span style={{ textTransform: 'capitalize' }}>Pay: {order.paymentMethod}</span>
            </div>
            <div style={{ borderTop: `1px dashed ${C.border}`, margin: '14px 0' }} />

            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: C.text }}>
                <span style={{ flex: 1, paddingRight: 8 }}>{item.quantity}× {item.name}</span>
                <span style={{ fontWeight: 600, flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}

            <div style={{ borderTop: `1px dashed ${C.border}`, margin: '14px 0' }} />
            {[
              { label: 'Subtotal', value: formatPrice(order.subtotal), color: C.textSub },
              { label: 'Discount', value: `−${formatPrice(order.discountAmt)}`, color: C.red },
              { label: 'VAT (5%)', value: formatPrice(order.vat), color: C.textSub },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: C.textMuted }}>{label}</span><span style={{ color }}>{value}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px dashed ${C.border}`, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 14 }}>
              <span>TOTAL</span><span style={{ color: C.green }}>{formatPrice(order.total)}</span>
            </div>
            {order.cashGiven > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
                <span>Cash Given</span><span>{formatPrice(order.cashGiven)}</span>
              </div>
            )}
            {order.cashGiven > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 14 }}>
                <span>Change</span><span>{formatPrice(Math.max(order.cashGiven - order.total, 0))}</span>
              </div>
            )}
            <div style={{ borderTop: `1px dashed ${C.border}`, margin: '12px 0' }} />
            <div style={{ textAlign: 'center', fontSize: 12, color: C.textMuted }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Thank you for shopping with us!</div>
              <div>Warranty: 30 days on all products</div>
              <div style={{ marginTop: 8, fontSize: 11 }}>— {shopName || 'PhoneHub'} —</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, fontWeight: 700, color: C.textSub, fontSize: 14, cursor: 'pointer' }}>
            New Sale
          </button>
          <button onClick={handlePrint} style={{ flex: 2, padding: '12px', background: C.accent, border: 'none', borderRadius: 12, fontWeight: 700, color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <RiPrinterLine size={18} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick, color = C.accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
        border: `1.5px solid ${active ? color : C.border}`,
        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
        background: active ? color : C.surface,
        color: active ? '#fff' : C.textSub,
        boxShadow: active ? `0 2px 8px ${color}30` : 'none',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main POS ─────────────────────────────────────────────────────────────────
export default function AdminCheckout() {
  const [search, setSearch]               = useState('');
  const [cart, setCart]                   = useState(() => { try { return JSON.parse(localStorage.getItem('pos-cart')) || []; } catch { return []; } });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountType, setDiscountType]   = useState('%');
  const [discountInput, setDiscountInput] = useState('');
  const [cashGiven, setCashGiven]         = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [showPaymentModal, setShowPaymentModal]   = useState(false);
  const [showReceiptModal, setShowReceiptModal]   = useState(false);
  const [lastOrder, setLastOrder]         = useState(null);
  const [activeFilter, setActiveFilter]   = useState({ type: 'all', value: 'All' });
  const [viewMode, setViewMode]           = useState('grid');
  const searchRef = useRef(null);

  // Persist cart
  useEffect(() => { localStorage.setItem('pos-cart', JSON.stringify(cart)); }, [cart]);

  // Keyboard shortcuts
  useEffect(() => {
    searchRef.current?.focus();
    const handleKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setShowPaymentModal(false); setShowReceiptModal(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data),
    staleTime: Infinity,
  });

  // Products – refetch when search changes; also auto-refresh every 30s
  const { data: productsData, isLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['pos-products', search],
    queryFn: () => api.get('/products', { params: { search, limit: 200 } }).then(r => r.data.data.products),
    placeholderData: prev => prev,
    refetchInterval: 30_000,
  });

  // Categories – auto-refresh every 15s so new ones appear without manual reload
  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: () => api.get('/categories').then(r => r.data.data.categories),
    placeholderData: prev => prev,
    refetchInterval: 15_000,
  });

  // Brands – same auto-refresh
  const { data: brandsData, refetch: refetchBrands } = useQuery({
    queryKey: ['pos-brands'],
    queryFn: () => api.get('/brands').then(r => r.data.data.brands),
    placeholderData: prev => prev,
    refetchInterval: 15_000,
  });

  const shopName  = settings?.shopName || 'PhoneHub';
  const shopPhone = settings?.phone    || '';

  const categories = categoriesData || [];
  const brands     = brandsData     || [];

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filteredProducts = (productsData || []).filter(p => {
    if (activeFilter.type === 'all')     return true;
    if (activeFilter.type === 'cat')     return p.category?.name === activeFilter.value;
    if (activeFilter.type === 'brand')   return p.brand?.name    === activeFilter.value;
    return true;
  });

  const handleRefreshAll = () => {
    refetchProducts();
    refetchCategories();
    refetchBrands();
    toast.success('Refreshed!', { duration: 1200, id: 'refresh' });
  };

  // ── Cart ops ───────────────────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error('Max stock reached', { id: 'stock' }); return prev; }
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (product.stock <= 0) { toast.error('Out of stock', { id: 'out' }); return prev; }
      return [...prev, { productId: product.id, name: product.name, price: product.finalPrice, quantity: 1, stock: product.stock, image: product.images?.[0]?.url, sku: product.sku || product.id?.slice(0, 10) }];
    });
  }, []);

  const updateQuantity = (id, delta) => setCart(prev => prev.map(i => {
    if (i.productId !== id) return i;
    const q = i.quantity + delta;
    return (q < 1 || q > i.stock) ? i : { ...i, quantity: q };
  }));

  const removeFromCart = id => setCart(prev => prev.filter(i => i.productId !== id));
  const clearCart = () => { setCart([]); setDiscountInput(''); };

  // ── Calculations ───────────────────────────────────────────────────────────
  const subtotal        = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const dVal            = parseFloat(discountInput) || 0;
  const discountAmt     = discountType === '%' ? subtotal * (dVal / 100) : dVal;
  const afterDisc       = Math.max(subtotal - discountAmt, 0);
  const vat             = Math.round(afterDisc * VAT_RATE);
  const total           = Math.round(afterDisc + vat);
  const itemCount       = cart.reduce((a, c) => a + c.quantity, 0);

  const handleChargeClick = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    paymentMethod === 'cash' ? setShowPaymentModal(true) : processSale();
  };

  const processSale = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/orders/admin/create', {
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        paymentMethod, paymentStatus: 'paid', discount: discountAmt,
      });
      setLastOrder({
        items: cart, subtotal, discountAmt, vat, total, paymentMethod,
        cashGiven: parseFloat(cashGiven) || 0,
        receiptNo: res.data?.data?.orderId || `R${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleString(),
      });
      toast.success('✅ Sale completed!');
      clearCart(); setCashGiven('');
      setShowPaymentModal(false); setShowReceiptModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: '"Inter", system-ui, sans-serif', color: C.text, overflow: 'hidden' }}>

      {/* ───────── OUTER WRAPPER ───────── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        {/* ══ TOP BAR ══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 62, background: C.topbar, borderBottom: `1px solid ${C.topbarBorder}`, flexShrink: 0, boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
              <RiStore2Line size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1 }}>{shopName}</div>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase' }}>POS Terminal</div>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 500, margin: '0 28px', position: 'relative' }}>
            <RiSearchLine size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
            <RiBarcodeLine size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product or scan barcode... (Ctrl+F)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 38px', fontSize: 13, borderRadius: 10, border: `1.5px solid ${C.border}`, outline: 'none', background: C.surfaceAlt, color: C.text, transition: 'border 0.15s' }}
              onFocus={e => e.target.style.borderColor = C.borderFocus}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Clock />
            <button onClick={handleRefreshAll} title="Refresh all data"
              style={{ width: 34, height: 34, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 9, color: C.textSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RiRefreshLine size={16} />
            </button>
            <button onClick={() => window.close()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 9, color: C.textSub, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <RiCloseLine size={14} /> Close POS
            </button>
          </div>
        </div>

        {/* ══ MAIN BODY ══ */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ══ LEFT: CATALOG ══ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* ── Filter bar (Categories + Brands, two rows) ── */}
            <div style={{ background: C.catBar, borderBottom: `1px solid ${C.catBarBorder}`, padding: '10px 18px', flexShrink: 0 }}>

              {/* Row 1: All + Categories */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: categories.length > 0 ? 8 : 0, overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  <RiAppsLine size={13} /> Cat
                </div>
                <FilterChip label="All" active={activeFilter.type === 'all'} onClick={() => setActiveFilter({ type: 'all', value: 'All' })} />
                {categories.map(c => (
                  <FilterChip key={c.id} label={c.name}
                    active={activeFilter.type === 'cat' && activeFilter.value === c.name}
                    onClick={() => setActiveFilter({ type: 'cat', value: c.name })}
                    color="#3b82f6"
                  />
                ))}
              </div>

              {/* Row 2: Brands */}
              {brands.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    <RiPriceTag3Line size={13} /> Brand
                  </div>
                  {brands.map(b => (
                    <FilterChip key={b.id} label={b.name}
                      active={activeFilter.type === 'brand' && activeFilter.value === b.name}
                      onClick={() => setActiveFilter({ type: 'brand', value: b.name })}
                      color="#7c3aed"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* View mode toggle + count */}
            <div style={{ padding: '8px 18px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>{filteredProducts.length} products</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {[{ mode: 'grid', Icon: RiGridLine }, { mode: 'list', Icon: RiListCheck2 }].map(({ mode, Icon }) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    style={{ width: 28, height: 28, background: viewMode === mode ? C.accent : C.surfaceAlt, border: `1px solid ${viewMode === mode ? C.accent : C.border}`, borderRadius: 7, color: viewMode === mode ? '#fff' : C.textSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Product area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                  <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.spinner, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: C.textMuted, fontSize: 13 }}>Loading products…</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
                  <RiSearchLine size={42} color={C.border} />
                  <p style={{ color: C.textMuted, fontSize: 14 }}>No products found</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, paddingBottom: 20 }}>
                  {filteredProducts.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} viewMode="grid" />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 20 }}>
                  {filteredProducts.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} viewMode="list" />)}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div style={{ padding: '7px 18px', background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 20, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: C.textMuted }}>Cart: {itemCount} items</span>
              <span style={{ fontSize: 11, color: C.accent, marginLeft: 'auto' }}>Ctrl+F to search</span>
            </div>
          </div>

          {/* ══ RIGHT: CART & CHECKOUT ══ */}
          <div style={{ width: 380, background: C.surface, display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${C.border}`, flexShrink: 0 }}>

            {/* Cart header */}
            <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surface, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Current Sale</span>
                {itemCount > 0 && (
                  <span style={{ background: C.accent, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, minWidth: 20, textAlign: 'center' }}>{itemCount}</span>
                )}
              </div>
              <button onClick={clearCart} disabled={cart.length === 0}
                style={{ fontSize: 11, fontWeight: 700, color: C.red, background: 'transparent', border: 'none', cursor: 'pointer', opacity: cart.length === 0 ? 0.3 : 1 }}>
                Clear All
              </button>
            </div>

            {/* Customer */}
            <div style={{ padding: '9px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <RiUser3Line size={14} color={C.accent} />
              <select style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: C.textSub, fontWeight: 500 }}>
                <option>Walk-in Customer</option>
              </select>
            </div>

            {/* Cart items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                  <div style={{ width: 64, height: 64, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RiStore2Line size={30} color={C.border} />
                  </div>
                  <p style={{ color: C.textMuted, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                    Cart is empty<br />
                    <span style={{ fontWeight: 400, fontSize: 11 }}>Click any product to add</span>
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cart.map(item => (
                    <CartItem key={item.productId} item={item} onUpdate={updateQuantity} onRemove={removeFromCart} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Totals & Payment ── */}
            <div style={{ padding: '16px 18px', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.surfaceAlt }}>

              {/* Discount row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select value={discountType} onChange={e => setDiscountType(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, outline: 'none', fontSize: 12, background: C.surface, color: C.text, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  <option value="%">% Off</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input type="number" value={discountInput} onChange={e => setDiscountInput(e.target.value)}
                  placeholder={discountType === '%' ? 'Discount %' : 'Amount off'}
                  style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, outline: 'none', fontSize: 13, background: C.surface, color: C.text }} />
              </div>

              {/* Lines */}
              {[
                { label: 'Subtotal',   value: formatPrice(subtotal),    color: C.textSub },
                { label: `Discount${discountType === '%' ? ` (${dVal}%)` : ''}`, value: `−${formatPrice(discountAmt)}`, color: C.red },
                { label: 'VAT (5%)',   value: formatPrice(vat),         color: C.textSub },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.textSub, marginBottom: 5, fontWeight: 500 }}>
                  <span>{label}</span><span style={{ color }}>{value}</span>
                </div>
              ))}

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900, color: C.text, margin: '12px 0', padding: '12px 0', borderTop: `1.5px solid ${C.border}`, borderBottom: `1.5px solid ${C.border}` }}>
                <span>TOTAL</span>
                <span style={{ color: C.green }}>{formatPrice(total)}</span>
              </div>

              {/* Payment methods */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {PAYMENT_METHODS.map(m => {
                  const active = paymentMethod === m.id;
                  const Icon = m.icon;
                  return (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                      style={{ flex: 1, padding: '10px 0', border: `1.5px solid ${active ? m.color : C.border}`, borderRadius: 10, cursor: 'pointer', background: active ? m.bg : C.surface, color: active ? m.textColor : C.textSub, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s', boxShadow: active ? `0 2px 8px ${m.color}25` : 'none' }}>
                      <Icon size={18} color={active ? m.color : C.textMuted} />
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Charge button */}
              <button
                onClick={handleChargeClick}
                disabled={cart.length === 0 || isSubmitting}
                style={{ width: '100%', padding: '15px', background: cart.length === 0 ? C.border : 'linear-gradient(135deg,#16a34a,#15803d)', borderRadius: 12, border: 'none', color: cart.length === 0 ? C.textMuted : '#fff', fontSize: 16, fontWeight: 800, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, boxShadow: cart.length > 0 ? '0 4px 20px rgba(22,163,74,0.35)' : 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (cart.length > 0) e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <RiCheckLine size={20} />
                {isSubmitting ? 'Processing…' : `Charge ${formatPrice(total)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal total={total} cashGiven={cashGiven} setCashGiven={setCashGiven}
          onCancel={() => setShowPaymentModal(false)} onConfirm={processSale} isSubmitting={isSubmitting} />
      )}
      {showReceiptModal && lastOrder && (
        <ReceiptModal order={lastOrder} shopName={shopName} shopPhone={shopPhone} onClose={() => setShowReceiptModal(false)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { scrollbar-width: thin; scrollbar-color: ${C.border} ${C.surfaceAlt}; }
        *::-webkit-scrollbar { width: 5px; height: 5px; }
        *::-webkit-scrollbar-track { background: ${C.surfaceAlt}; }
        *::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}
