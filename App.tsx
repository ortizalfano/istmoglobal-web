
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, Search, ShoppingBag, ArrowRight, Instagram, Facebook,
  Globe2, Mail, Phone, MapPin, ChevronRight, Star, Truck, Shield,
  Zap, BarChart2, Users, Package, Settings, LogOut, Plus, Trash2,
  AlertTriangle, // Added for deletion warning modal
  Edit, Filter, LayoutGrid, Award, ShoppingCart, MessageSquare, Edit3, CheckCircle, Minus, Trash, List,
  Ship, Container, Globe, Target, Activity, Lock, FileUp, Download // Added FileUp and Download
} from 'lucide-react';
import Papa from 'papaparse';
import ImageUpload from './ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from './translations';
import { Language, Product, ProductVariant, Prospect, Category, Brand, User, SiteSettings } from './types';
import { getProducts, getProspects, saveProducts, saveProspects, addProspect, getCategories, saveCategories, getBrands, saveBrands } from './store';
import { fetchBrands, fetchProducts, fetchCategories, createBrand, updateBrand, deleteBrand, createCategory, updateCategory, deleteCategory, createProduct, updateProduct, deleteProduct, loginUser, createUser, createOrder, fetchOrders, fetchUsers, fetchProspects, updateUser, deleteUser, updateProspect, deleteProspect, fetchSettings, updateSettings } from './dataService';
import { Order } from './types';
import { CartProvider, useCart } from './CartContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
// Duplicate imports removed

// --- Contexts ---
const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}>({ lang: 'en', setLang: () => { }, t: (k) => k });

const AuthContext = createContext<{
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (user: Omit<User, 'id'>) => Promise<boolean>;
}>({ user: null, login: async () => false, logout: () => { }, register: async () => false });

const SettingsContext = createContext<{
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
  refreshSettings: () => Promise<void>;
}>({
  settings: { show_prices: true },
  setSettings: () => { },
  refreshSettings: async () => { }
});

// --- Components: UI ---
const CartDrawer = () => {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!isOpen) return null;

  const handleWhatsAppGuest = () => {
    const message = `*Nueva Orden de Pedido (Invitado)*\n\n` +
      items.map(i => `- ${i.quantity}x ${i.size} (${(i.price && settings.show_prices) ? '$' + i.price : 'Consultar'})`).join('\n') +
      (settings.show_prices ? `\n\n*Total Estimado: $${total.toFixed(2)}*` : '');
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShowLoginPrompt(false);
  };

  const handleGoToLogin = () => {
    setIsOpen(false);
    setShowLoginPrompt(false);
    navigate('/login');
  };

  const handleCheckout = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // Create Order in DB
    const orderData = {
      userId: user.id,
      userName: user.name,
      items: JSON.stringify(items),
      total: total
    };

    await createOrder(orderData);
    clearCart();
    setIsOpen(false);
    alert("¡Pedido realizado con éxito! Un agente te contactará pronto.");
  };

  <>
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-900">{t('cartTitle')}</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium">{t('cartEmpty')}</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4">
                <img src={item.image} className="w-20 h-20 object-cover rounded-xl bg-slate-100" />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{item.size}</h4>
                  {settings.show_prices && <p className="text-blue-600 font-bold">${item.price}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200"><Minus size={14} /></button>
                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200"><Plus size={14} /></button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 self-start"><Trash size={18} /></button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 pt-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-bold">{t('cartEstimatedTotal')}</span>
            <span className="text-3xl font-black text-blue-900">{settings.show_prices ? `$${total.toFixed(2)}` : t('priceInquire')}</span>
          </div>
          <button onClick={handleCheckout} disabled={items.length === 0} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-green-600/20">
            {user ? 'Confirmar Pedido' : 'Continuar Compra'}
          </button>
        </div>
      </div>
    </div>

    {/* Login Prompt Modal */}
    <AnimatePresence>
      {showLoginPrompt && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowLoginPrompt(false)}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-blue-900" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Inicia Sesión</h3>
              <p className="text-slate-500 font-medium font-bold">Para procesar tu pedido y tener un seguimiento detallado, te sugerimos iniciar sesión como cliente.</p>
            </div>
            <div className="space-y-4">
              <button
                onClick={handleGoToLogin}
                className="w-full py-4 bg-blue-900 text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 font-bold flex items-center justify-center gap-2"
              >
                Ir al Login <ArrowRight size={18} />
              </button>
              <button
                onClick={handleWhatsAppGuest}
                className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all font-bold"
              >
                Continuar por WhatsApp (Sin registro)
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors pt-2"
              >
                Seguir Comprando
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
};

const FadeIn: React.FC<{ children?: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

const Navbar = () => {
  const { lang, setLang, t } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const { user, logout } = useContext(AuthContext);

  if (isAdminPath) return null;

  const linkOrProfile = user ? (
    <div className="flex items-center gap-3">
      <div className="text-right hidden xl:block">
        <div className="text-sm font-bold text-slate-900">{user.name}</div>
        <div className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{user.role === 'b2b' ? t('roleWholesale') : user.role === 'admin' ? t('roleAdmin') : t('roleCustomer')}</div>
      </div>
      <button onClick={logout} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors" title={t('btnLogout')}>
        <LogOut size={18} />
      </button>
    </div>
  ) : (
    <Link to="/login" className="px-6 py-2.5 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20 text-sm">
      Login / Registro
    </Link>
  );

  return (
    <nav className="fixed w-full z-50 glass-nav border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group">
            <div className="bg-blue-900 p-1.5 sm:p-2 rounded-lg sm:rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-900/20">
              <Globe2 className="text-white" size={18} />
            </div>
            <span className="text-lg sm:text-2xl font-extrabold text-blue-900 tracking-tighter">
              ISTMO<span className="text-blue-500">GLOBAL</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-slate-600 hover:text-blue-900 transition-colors font-semibold text-sm uppercase tracking-wide">{t('navHome')}</Link>
            <Link to="/about" className="text-slate-600 hover:text-blue-900 transition-colors font-semibold text-sm uppercase tracking-wide">{t('navAbout')}</Link>
            <Link to="/catalog" className="text-slate-600 hover:text-blue-900 transition-colors font-semibold text-sm uppercase tracking-wide">{t('navCatalog')}</Link>
            <Link to="/markets" className="text-slate-600 hover:text-blue-900 transition-colors font-semibold text-sm uppercase tracking-wide">{t('navMarkets')}</Link>

            <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
              {linkOrProfile}
              <CartButton />
              {(!user || user.role === 'admin') && (
                <Link to="/admin/login" className="p-2.5 bg-blue-50 text-blue-900 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2 group" title="Admin Portal">
                  <Lock size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Admin</span>
                </Link>
              )}
            </div>

            <div className="flex items-center bg-slate-100 rounded-full p-1 ml-2 border border-slate-200">
              <button onClick={() => setLang('en')} className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${lang === 'en' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}>EN</button>
              <button onClick={() => setLang('es')} className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${lang === 'es' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}>ES</button>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            {/* Language Selector - Mobile */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
              <button onClick={() => setLang('en')} className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${lang === 'en' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}>EN</button>
              <button onClick={() => setLang('es')} className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${lang === 'es' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}>ES</button>
            </div>
            <CartButton />
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2 bg-slate-100 rounded-lg">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-white border-t border-slate-100 overflow-hidden">
            <div className="p-6 space-y-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="block text-xl font-bold text-slate-800">{t('navHome')}</Link>
              <Link to="/about" onClick={() => setIsOpen(false)} className="block text-xl font-bold text-slate-800">{t('navAbout')}</Link>
              <Link to="/catalog" onClick={() => setIsOpen(false)} className="block text-xl font-bold text-slate-800">{t('navCatalog')}</Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} className="block text-xl font-bold text-blue-900">{t('navContact')}</Link>
              <Link to="/admin/login" onClick={() => setIsOpen(false)} className="block text-xl font-bold text-slate-400">{t('navAdmin')}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const CartButton = () => {
  const { setIsOpen, items } = useCart();
  return (
    <button onClick={() => setIsOpen(true)} className="relative p-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-all">
      <ShoppingCart size={20} />
      {items.length > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
          {items.length}
        </span>
      )}
    </button>
  );
};

const Footer = () => {
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Globe2 className="text-white" size={28} />
              <span className="text-xl font-black text-white tracking-tighter uppercase">ISTMO<span className="text-blue-500">GLOBAL</span></span>
            </div>
            <p className="text-sm leading-relaxed">Pioneering global trade and high-performance tire logistics since 2008.</p>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Navigation</h4>
            <Link to="/about" className="hover:text-blue-400 text-sm">{t('navAbout')}</Link>
            <Link to="/catalog" className="hover:text-blue-400 text-sm">{t('navCatalog')}</Link>
            <Link to="/contact" className="hover:text-blue-400 text-sm">{t('navContact')}</Link>
            <Link to="/admin/login" className="hover:text-blue-400 text-sm flex items-center gap-2"><Lock size={12} /> Admin Portal</Link>
          </div>
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4">Contact</h4>
            <p className="text-sm">Miami, FL | Madrid, ES | Panama City, PA</p>
            <p className="text-sm mt-2 font-bold text-blue-500">info@istmoglobal.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Components: Public ---

const ProductDetailModal = ({ product, isOpen, onClose }: { product: Product | null, isOpen: boolean, onClose: () => void }) => {
  const { t } = useContext(LanguageContext);
  const { addToCart } = useCart();
  const { user } = useContext(AuthContext);
  const { settings } = useContext(SettingsContext);
  const [quantity, setQuantity] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    fetchBrands().then(setBrands);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      // Default to first variant if exists, otherwise null
      if (product?.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const brandName = brands.find(b => b.id === product.brandId)?.name || 'Unknown';
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displaySize = selectedVariant ? selectedVariant.size : product.size;

  const handleIncrease = () => {
    const isB2C = !user || user.role === 'b2c';
    if (isB2C && quantity >= 8) {
      alert("Límite de 8 unidades para ventas regulares (B2C). Regístrate como Mayorista (B2B) para pedidos mayores.");
      return;
    }
    setQuantity(q => q + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          {/* Image Section */}
          <div className="w-full md:w-1/2 bg-slate-100 relative p-8 flex items-center justify-center">
            <img
              src={product.image || 'https://picsum.photos/seed/tire/800/800'}
              alt={brandName}
              className="w-full h-auto object-cover max-h-[400px] drop-shadow-2xl hover:scale-105 transition-transform duration-500 rounded-3xl"
            />
            <button
              onClick={onClose}
              className="absolute top-6 left-6 p-3 bg-white/50 backdrop-blur-md rounded-full hover:bg-white text-slate-900 transition-all md:hidden"
            >
              <X size={24} />
            </button>
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 p-10 flex flex-col overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-2">{brandName}</h3>
                <h2 className="text-4xl font-black text-slate-900 leading-tight">{product.name || displaySize}</h2>
              </div>
              <button onClick={onClose} className="hidden md:block p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <div className="space-y-6 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-slate-900">{settings.show_prices ? `$${displayPrice?.toFixed(2) || '0.00'}` : t('priceInquire')}</span>
                {settings.show_prices && <span className="text-slate-400 font-bold">USD</span>}
              </div>

              {/* Variants / Size Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Seleccionar Medida</label>
                  <div className="relative">
                    <select
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const variant = product.variants?.find(v => v.id === e.target.value);
                        if (variant) setSelectedVariant(variant);
                      }}
                      className="w-full pl-6 pr-12 py-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-slate-700 cursor-pointer appearance-none focus:ring-4 focus:ring-blue-900/5 transition-all text-lg"
                    >
                      {product.variants.map(v => (
                        <option key={v.id} value={v.id}>{v.size} {settings.show_prices ? `- $${v.price}` : ''}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight size={20} className="rotate-90" />
                    </div>
                  </div>
                </div>
              )}

              <div className="prose prose-slate">
                <p className="text-slate-600 leading-relaxed font-medium">
                  {product.description || t('heroDescription')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Estado</div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${(selectedVariant || product).status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {(selectedVariant || product).status === 'Active' ? 'Disponible' : 'No Disponible'}
                  </div>
                </div>
                {!product.variants?.length && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-1">Medida</div>
                    <div className="font-bold text-slate-900">{product.size}</div>
                  </div>
                )}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Categoría</div>
                  <div className="font-bold text-slate-900">Premium Tire</div>
                </div>

                {product.techSheetImage && (
                  <div className="col-span-2 mt-4">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Ficha Técnica</div>
                    <div className="relative group/tech overflow-hidden rounded-[2rem] border-2 border-slate-100 bg-white p-2">
                      <img
                        src={product.techSheetImage}
                        alt="Ficha Técnica"
                        className="w-full h-auto object-contain max-h-[300px] rounded-[1.5rem] transition-transform duration-500 group-hover/tech:scale-[1.02]"
                      />
                      <a
                        href={product.techSheetImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-blue-900/0 group-hover/tech:bg-blue-900/10 flex items-center justify-center transition-all duration-300"
                      >
                        <div className="opacity-0 group-hover/tech:opacity-100 bg-white text-blue-900 px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transform translate-y-4 group-hover/tech:translate-y-0 transition-all duration-300">
                          <Search size={18} /> Ver Pantalla Completa
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-bold text-slate-500 uppercase">Cantidad:</span>
                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-white rounded-lg transition-colors"><Minus size={16} /></button>
                  <span className="w-8 text-center font-black text-slate-900">{quantity}</span>
                  <button onClick={handleIncrease} className="p-2 hover:bg-white rounded-lg transition-colors"><Plus size={16} /></button>
                </div>
              </div>
              <button
                onClick={() => { addToCart(product, quantity, selectedVariant || undefined); onClose(); }}
                className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 group"
              >
                <ShoppingCart size={24} />
                Agregar al Carrito
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onClose} className="w-full py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                Seguir Buscando
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FeaturedBrands = () => {
  const { t } = useContext(LanguageContext);
  const [brands, setBrands] = useState<Brand[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands().then(setBrands);
  }, []);

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <FadeIn>
            <span className="text-blue-600 font-black uppercase tracking-widest text-sm mb-4 block">{t('catalogOurCatalog')}</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">{t('catalogOurBrands')}</h2>
            <div className="w-20 h-2 bg-blue-600 mx-auto rounded-full"></div>
          </FadeIn>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {brands.map((brand, idx) => (
            <FadeIn key={brand.id} delay={idx * 0.1}>
              <div
                onClick={() => navigate('/catalog')}
                className="group relative aspect-square bg-slate-50 rounded-3xl flex items-center justify-center p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-slate-100"
              >
                <div className="w-full h-full flex items-center justify-center p-6 rounded-[inherit] overflow-hidden">
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain rounded-2xl filter grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60 group-hover:opacity-100 group-hover:scale-110"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-300 group-hover:text-blue-900 transition-colors uppercase">{brand.name}</span>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{t('btnViewProducts')}</span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/catalog" className="inline-flex items-center gap-2 text-slate-400 font-bold hover:text-blue-600 transition-colors uppercase tracking-widest text-sm group">
            Ver Catálogo Completo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

// --- Pages: Public ---

const HeroSearch = () => {
  const { t } = useContext(LanguageContext);
  const { addToCart } = useCart();
  const { settings } = useContext(SettingsContext);
  const [brandQuery, setBrandQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  // Load data from DB
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedBrands, loadedProducts] = await Promise.all([
          fetchBrands(),
          fetchProducts()
        ]);
        setBrands(loadedBrands);
        setProducts(loadedProducts.filter(p => p.status === 'Active'));
      } catch (err) {
        console.error("Failed to load search data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Run once on mount

  // Extract unique sizes
  const sizes = Array.from(new Set(products.flatMap(p => [p.size, ...(p.variants?.map(v => v.size) || [])]))).filter(Boolean).sort();

  const navigate = useNavigate();

  useEffect(() => {
    if (brandQuery.length > 0 || selectedSize) {
      const filtered = products.filter(p => {
        const brandName = brands.find(b => b.id === p.brandId)?.name || '';
        const variantSizes = p.variants?.map(v => v.size) || [];
        const matchBrand = brandQuery ?
          (brandName.toLowerCase().includes(brandQuery.toLowerCase()) ||
            (p.name || '').toLowerCase().includes(brandQuery.toLowerCase())) : true;
        const matchSize = selectedSize ? (p.size === selectedSize || variantSizes.includes(selectedSize)) : true;
        return matchBrand && matchSize;
      });
      setResults(filtered.slice(0, 5));
    } else {
      setResults([]);
    }
  }, [brandQuery, selectedSize, products, brands]);

  const handleSearch = () => {
    if (results.length > 0) {
      const interest = brandQuery ? `${brandQuery} ${selectedSize}`.trim() : selectedSize;
      navigate(`/contact?interest=${interest}`);
    } else {
      navigate('/catalog');
    }
  };

  return (
    <div className="relative max-w-4xl w-full mb-12">
      <div className="bg-white rounded-2xl shadow-2xl p-2 pl-6 flex flex-col md:flex-row items-center gap-2 md:gap-0">

        {/* Brand/Text Input Section */}
        <div className="flex-1 flex items-center gap-3 w-full">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            className="w-full py-3 bg-transparent text-slate-900 placeholder-slate-500 font-medium focus:outline-none"
            placeholder="Buscar por marca..."
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-8 bg-slate-200 mx-4"></div>

        {/* Size Dropdown Section */}
        <div className="flex-1 flex items-center gap-3 w-full border-t md:border-0 border-slate-100 pt-2 md:pt-0">
          <Filter className="text-slate-400" size={20} />
          <div className="relative w-full">
            <select
              className="w-full py-3 bg-transparent text-slate-900 font-bold focus:outline-none appearance-none cursor-pointer"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="" className="text-slate-500 font-normal">Todas las medidas</option>
              {sizes.map(s => (
                <option key={s} value={s} className="text-slate-900">{s}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-500 text-white p-3 md:px-8 md:py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 w-full md:w-auto mt-2 md:mt-0 md:ml-4"
        >
          <Search size={20} className="md:hidden" />
          <span className="hidden md:inline">Buscar</span>
        </button>
      </div>

      <AnimatePresence>
        {results.length > 0 && (brandQuery || selectedSize) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-xl overflow-hidden z-40 border border-slate-100 mx-4"
          >
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{results.length} Resultados</span>
              <button onClick={() => { setBrandQuery(''); setSelectedSize('') }} className="text-xs font-bold text-red-400 hover:text-red-500">{t('btnClearFilters')}</button>
            </div>
            {results.map((p) => {
              const brandName = brands.find(b => b.id === p.brandId)?.name || 'Unknown';
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0 group"
                  onClick={() => setSelectedProduct(p)}
                >
                  <img src={p.image} alt={brandName} className="w-12 h-12 rounded-xl object-cover bg-slate-100" />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{brandName} {p.name}</div>
                    <div className="text-xs font-bold text-blue-500 uppercase tracking-widest">{p.size} {p.variants?.length ? `+ ${p.variants.length} más` : ''}</div>
                    {settings.show_prices && p.price && <div className="text-xs font-black text-slate-900">Desde ${p.price}</div>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Plus size={16} />
                  </button>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              );
            })}
            <div className="p-3 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigate('/catalog')}>
              <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Ver todos los resultados</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

const HomePage = () => {
  const { t } = useContext(LanguageContext);
  return (
    <div className="pt-20 bg-white">
      {/* Hero Section with Port Background (Coordinated with Why Us section) */}
      <section className="relative overflow-hidden py-32 min-h-[95vh] flex items-center bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=80"
            alt="Global Logistics Center"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 backdrop-blur-md text-blue-400 text-xs font-bold mb-8 tracking-[0.2em] uppercase border border-blue-500/20">
              <Ship size={14} className="animate-pulse" /> {t('heroOperations')}
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[1] tracking-tight">
              {t('heroTrading')}<br /><span className="text-[#5B9EFF]">{t('heroPossibilities')}</span>.
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed max-w-2xl font-medium">
              {t('heroSubtitle')}
            </p>

            <HeroSearch />

            <div className="flex flex-wrap gap-6">
              <Link to="/catalog" className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 flex items-center gap-3 text-lg group">
                {t('btnViewCatalog')} <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/contact" className="px-10 py-5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all text-lg">
                {t('navContact')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 1. About Detailed Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <FadeIn>
              <div className="relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-900/5 rounded-full blur-3xl"></div>
                {/* Fixed Strategy Image */}
                <img
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80"
                  className="rounded-[3rem] shadow-2xl z-10 relative object-cover h-[500px] w-full"
                  alt="Global Logistics & Tires"
                />
                <div className="absolute -bottom-10 -right-10 bg-blue-900 p-10 rounded-[2.5rem] shadow-2xl hidden md:block border-4 border-white">
                  <span className="text-blue-200 text-xs font-black uppercase tracking-[0.3em] block mb-2">Established</span>
                  <span className="text-4xl font-black text-white">2008</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <span className="text-blue-600 font-black uppercase tracking-widest text-sm mb-4 block">{t('homeAboutSubtitle')}</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
                {t('homeAboutTitle')}
              </h2>
              <p className="text-xl text-slate-600 font-medium leading-relaxed mb-10">
                {t('homeAboutText')}
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="text-blue-900 font-black text-3xl tracking-tighter">150+</div>
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('aboutGlobalPartners')}</div>
                </div>
                <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="text-blue-900 font-black text-3xl tracking-tighter">1M+</div>
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('aboutUnitsAnnually')}</div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>




      {/* 2. Business Segments (New) */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5">
          <Settings size={400} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">{t('businessLinesTitle')}</h2>
              <div className="w-20 h-2 bg-blue-600 mx-auto rounded-full"></div>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Automotive Card */}
            <FadeIn delay={0.1}>
              <div className="bg-white p-12 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-slate-100 h-full relative group hover:-translate-y-2 transition-transform duration-500">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Truck size={36} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-6">{t('automotiveTitle')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                  {t('automotiveText')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Nissan', 'Kia', 'Hyundai', 'Toyota', 'Mitsubishi'].map(b => (
                    <span key={b} className="px-3 py-1 bg-slate-100 rounded-lg text-slate-500 text-xs font-bold uppercase">{b}</span>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Steel & Renewables Card */}
            <FadeIn delay={0.2}>
              <div className="bg-white p-12 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-slate-100 h-full relative group hover:-translate-y-2 transition-transform duration-500">
                <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <Container size={36} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-6">{t('steelTitle')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {t('steelText')}
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Featured Brands Section */}
      <FeaturedBrands />

      {/* E-commerce Teaser (New) */}
      <section className="py-24 bg-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-blue-800/50 rounded-[3rem] p-12 md:p-20 backdrop-blur-sm border border-blue-700/50 text-center">
            <FadeIn>
              <div className="inline-block p-4 bg-white/10 rounded-2xl mb-8">
                <Globe2 size={40} className="text-blue-300" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8">
                {t('ecommerceTitle')}
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
                {t('ecommerceText')}
              </p>
              <Link to="/catalog" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-900 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/50">
                {t('btnViewCatalog')} <ArrowRight size={20} />
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>
      {/* 3. Services Grid Section */}
      <section className="py-32 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('servicesTitle')}</h2>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto">Expert solutions tailored to the unique demands of international trade.</p>
            </FadeIn>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Globe, title: t('serviceSourcing'), desc: t('serviceSourcingDesc') },
              { icon: Truck, title: t('serviceLogistics'), desc: t('serviceLogisticsDesc') },
              { icon: Shield, title: t('serviceCompliance'), desc: t('serviceComplianceDesc') }
            ].map((service, idx) => (
              <FadeIn key={idx} delay={idx * 0.1}>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group h-full flex flex-col">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-900 mb-8 group-hover:scale-110 group-hover:bg-blue-900 group-hover:text-white transition-all duration-500">
                    <service.icon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{service.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed flex-1">{service.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us / Quality Pillars */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-900 rounded-[4rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 z-0 overflow-hidden opacity-20">
              <img src="https://images.unsplash.com/photo-1574241607402-2fca59074892?auto=format&fit=crop&w=1200&q=80" alt="Supply Chain Excellence" className="w-full h-full object-cover" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-8">{t('whyUsTitle')}</h2>
                <div className="space-y-8">
                  {[
                    { icon: Zap, title: t('whyUsSpeed'), text: 'Real-time monitoring and agile fleet management.' },
                    { icon: Award, title: t('whyUsQuality'), text: 'Certified premium products only from Tier-1 factories.' },
                    { icon: Target, title: t('whyUsPartners'), text: 'Direct presence in the world\'s key maritime routes.' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="bg-white/10 p-4 rounded-2xl text-blue-300"><item.icon size={24} /></div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">{item.title}</h4>
                        <p className="text-blue-100/60 font-medium">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-white/5 rounded-full border border-white/10 flex items-center justify-center p-10 scale-110">
                  <div className="text-center">
                    <div className="text-7xl font-black text-white mb-2 tracking-tighter">100%</div>
                    <div className="text-blue-300 font-black uppercase tracking-widest text-xs">Commitment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


    </div >
  );
};

const AboutPage = () => {
  const { t } = useContext(LanguageContext);
  const timeline = [
    { year: '2008', desc: t('timeline2008') },
    { year: '2012', desc: t('timeline2012') },
    { year: '2017', desc: t('timeline2017') },
    { year: '2023', desc: t('timeline2023') },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=80"
            alt="Logistic background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <FadeIn>
            <span className="text-blue-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">{t('navAbout')}</span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight leading-none">
              {t('aboutHeroTitle')}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              {t('aboutHeroSubtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Philosophy Section (New) */}
      <section className="py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-900"></div>
              <h2 className="text-3xl font-black text-slate-900 mb-8">{t('philosophyTitle')}</h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed italic">
                "{t('philosophyText')}"
              </p>
              <div className="mt-8 flex justify-center">
                <div className="flex -space-x-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                      <Users size={16} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Business Lines Section (New) */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <FadeIn>
              <h2 className="text-4xl font-black text-white mb-4">{t('businessLinesTitle')}</h2>
              <div className="w-20 h-2 bg-blue-500 mx-auto rounded-full"></div>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Automotive */}
            <FadeIn delay={0.1}>
              <div className="bg-slate-800 p-10 rounded-[3rem] border border-slate-700 h-full hover:bg-slate-800/80 transition-colors">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20">
                  <Truck size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-6">{t('automotiveTitle')}</h3>
                <p className="text-slate-300 leading-relaxed mb-8">
                  {t('automotiveText')}
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Nissan', 'Kia', 'Hyundai', 'Toyota', 'Mitsubishi'].map(brand => (
                    <span key={brand} className="px-4 py-2 bg-slate-900/50 rounded-full text-slate-400 text-xs font-bold uppercase tracking-wider border border-slate-700">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Steel & Renewables */}
            <FadeIn delay={0.2}>
              <div className="bg-slate-800 p-10 rounded-[3rem] border border-slate-700 h-full hover:bg-slate-800/80 transition-colors">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20">
                  <Container size={32} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-6">{t('steelTitle')}</h3>
                <p className="text-slate-300 leading-relaxed">
                  {t('steelText')}
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* E-commerce Banner (New) */}
      <section className="py-24 bg-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=1920&q=80')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <FadeIn>
            <div className="inline-block p-4 bg-blue-800/50 rounded-2xl border border-blue-700/50 backdrop-blur-sm mb-8">
              <Globe2 size={32} className="text-blue-300" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
              {t('ecommerceTitle')}
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed font-medium mb-12">
              {t('ecommerceText')}
            </p>
            <Link to="/catalog" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-900 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/50">
              {t('btnViewCatalog')} <ArrowRight size={20} />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-24">
            <FadeIn>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('timelineTitle')}</h2>
              <div className="w-20 h-2 bg-blue-600 mx-auto rounded-full"></div>
            </FadeIn>
          </div>

          <div className="relative">
            {/* Desktop Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 hidden md:block"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
              {timeline.map((item, idx) => (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <div className="flex flex-col items-center text-center group">
                    <div className="text-5xl font-black text-blue-900/10 group-hover:text-blue-600 transition-colors duration-500 mb-4">
                      {item.year}
                    </div>
                    <div className="w-6 h-6 bg-white border-4 border-blue-900 rounded-full mb-8 relative z-20 group-hover:scale-125 transition-transform duration-500">
                      <div className="absolute inset-0 bg-blue-600 rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
                    </div>
                    <p className="text-slate-600 font-bold leading-relaxed px-4">
                      {item.desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4">{t('valuesTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: Shield, title: t('valueQualityTitle'), desc: t('valueQualityDesc') },
              { icon: Users, title: t('valueIntegrityTitle'), desc: t('valueIntegrityDesc') },
              { icon: Zap, title: t('valueInnovationTitle'), desc: t('valueInnovationDesc') }
            ].map((v, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group text-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-blue-900 group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
                    <v.icon size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{v.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{v.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / Vision Cards */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <FadeIn>
              <div className="p-16 bg-blue-900 rounded-[4rem] text-white h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Target size={120} />
                </div>
                <h3 className="text-3xl font-black mb-6">{t('aboutMission')}</h3>
                <p className="text-xl text-blue-100/80 leading-relaxed font-medium">
                  Simplificar el comercio global de neumáticos a través de una logística inteligente, ética y de alta precisión, conectando fabricantes y mercados con excelencia operativa.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="p-16 bg-slate-100 rounded-[4rem] text-slate-900 h-full relative overflow-hidden group border border-slate-200">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:-rotate-12 transition-transform duration-700">
                  <Activity size={120} />
                </div>
                <h3 className="text-3xl font-black mb-6">{t('aboutVision')}</h3>
                <p className="text-xl text-slate-500 leading-relaxed font-medium">
                  Ser el socio logístico más confiable y eficiente del mundo en el sector automotriz, liderando con innovación digital y expansión estratégica sostenible.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
};

const CatalogPage = () => {
  const { t } = useContext(LanguageContext);
  const { settings } = useContext(SettingsContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchBrands()
    ]).then(([p, c, b]) => {
      setProducts(p.filter(item => item.status === 'Active'));
      setCategories(c);
      setBrands(b);
      setLoading(false);
    });
  }, []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = products.filter(p => {
    const brandName = brands.find(b => b.id === p.brandId)?.name || '';
    const variantSizes = p.variants?.map(v => v.size).join(' ') || '';
    const matchesSearch = brandName.toLowerCase().includes(search.toLowerCase()) ||
      p.size.toLowerCase().includes(search.toLowerCase()) ||
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      variantSizes.toLowerCase().includes(search.toLowerCase());

    const productCategoryId = p.categoryId;
    const matchesFilter = filter === 'All' || productCategoryId === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="pt-32 bg-[#FAFBFF] min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <FadeIn>
            <h1 className="text-5xl font-black text-slate-900 mb-4">{t('catalogTitle')}</h1>
            <p className="text-slate-500 font-medium">Calidad certificada para cada mercado global.</p>
          </FadeIn>
        </div>

        {/* Refined Search and Filter UI */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={t('catalogSearch')}
              className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-none outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium text-slate-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-80 relative">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            <select
              className="w-full pl-14 pr-10 py-5 rounded-2xl bg-slate-50 border-none outline-none font-bold text-slate-700 cursor-pointer appearance-none focus:ring-4 focus:ring-blue-900/5 transition-all"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">{t('catalogFilterAll')}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronRight size={20} className="rotate-90" />
            </div>
          </div>

          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 self-center md:self-stretch">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-blue-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              title="Vista Lista"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filtered.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 flex flex-col group hover:shadow-2xl transition-all duration-500"
                >
                  <div className="aspect-square relative overflow-hidden bg-slate-50">
                    <img src={p.image} alt="Tire" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-blue-900 shadow-sm border border-white">
                        {categories.find(c => c.id === p.categoryId)?.name || 'General'}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight">{brands.find(b => b.id === p.brandId)?.name || 'Unknown Brand'} {p.name}</h3>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-slate-400 font-bold">{p.variants?.length || 1} Medidas</p>
                      {settings.show_prices && <p className="text-blue-600 font-bold text-lg">Desde ${p.price?.toFixed(2) || '0.00'}</p>}
                    </div>
                    <button onClick={() => setSelectedProduct(p)} className="w-full block py-4 rounded-xl bg-blue-50 text-blue-900 text-center font-black hover:bg-blue-900 hover:text-white transition-all text-sm uppercase tracking-wider">
                      Detalles
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedProduct(p)}
                  className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 p-6 flex items-center gap-8 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0">
                    <img src={p.image} alt="Tire" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                        {categories.find(c => c.id === p.categoryId)?.name || 'General'}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 leading-tight truncate">{brands.find(b => b.id === p.brandId)?.name || 'Unknown Brand'} {p.name}</h3>
                    <p className="text-slate-400 font-bold text-sm sm:text-base">{p.variants?.length || 1} Medidas disponibles</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-4">
                    {settings.show_prices && (
                      <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Desde</p>
                        <p className="text-2xl sm:text-3xl font-black text-blue-900">${p.price?.toFixed(2) || '0.00'}</p>
                      </div>
                    )}
                    <button className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-50 text-blue-900 font-bold hover:bg-blue-900 hover:text-white transition-all text-xs uppercase tracking-widest">
                      Ver Detalles <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-inner">
            <Search size={64} className="mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black text-slate-400">{t('noProducts')}</h3>
          </div>
        )}
      </div>
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

const ContactPage = () => {
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const interest = queryParams.get('interest');

  const [formData, setFormData] = useState({ name: '', email: '', company: '', country: '', message: interest ? `Interesado en: ${interest}. ` : '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProspect({ ...formData, productOfInterest: interest || undefined });
    setSubmitted(true);
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <FadeIn>
            <h1 className="text-5xl font-black text-slate-900 mb-8">{t('contactTitle')}</h1>
            <p className="text-xl text-slate-600 mb-12 font-medium leading-relaxed">Conecta con nuestros expertos globales.</p>
            <div className="space-y-6">
              <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 mb-8">
                <h3 className="text-xl font-black text-blue-900 mb-4">{t('supportTitle')}</h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">
                  {t('supportText')}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Phone size={18} /></div>
                    <span className="font-bold text-slate-800 text-lg">+507 68347266</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Phone size={18} /></div>
                    <span className="font-bold text-slate-800 text-lg">+507 63672394</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="bg-blue-900 p-4 rounded-2xl text-white shadow-lg"><Mail size={24} /></div>
                <div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('contactPrimaryEmail')}</div>
                  <div className="text-lg font-bold text-slate-900">info@istmoglobal.com</div>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} /></div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4">{t('formSuccess')}</h2>
                  <button onClick={() => setSubmitted(false)} className="text-blue-900 font-bold hover:underline">Enviar otro mensaje</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <input required placeholder={t('formName')} className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  <input required placeholder={t('formEmail')} type="email" className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  <textarea required rows={5} placeholder={t('formMessage')} className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium"
                    value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                  <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-lg hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20">
                    {t('formSubmit')}
                  </button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const location = useLocation();

  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" />;

  const menuItems = [
    { name: 'Dashboard', icon: BarChart2, path: '/admin' },
    { name: 'Pedidos', icon: ShoppingCart, path: '/admin/orders' },
    { name: 'Marcas', icon: Award, path: '/admin/brands' },
    { name: 'Categorías', icon: LayoutGrid, path: '/admin/categories' },
    { name: 'Productos', icon: Package, path: '/admin/products' },
    { name: 'Prospectos / Clientes', icon: Users, path: '/admin/prospects' },
    { name: 'Configuración', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className="w-72 bg-slate-950 text-slate-400 flex flex-col fixed inset-y-0 z-50">
        <div className="p-10">
          <Link to="/" className="flex items-center gap-2">
            <Globe2 className="text-blue-500" size={28} />
            <span className="text-xl font-black text-white tracking-tighter uppercase">ISTMO<span className="text-blue-500">ADMIN</span></span>
          </Link>
        </div>
        <nav className="flex-1 px-6 space-y-2">
          {menuItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${location.pathname === item.path ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20' : 'hover:bg-slate-900 hover:text-white'}`}
            >
              <item.icon size={22} /> {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-8">
          <button onClick={logout} className="flex items-center gap-4 px-6 py-4 rounded-2xl w-full hover:bg-red-500/10 hover:text-red-500 transition-all font-bold group">
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" /> {t('btnLogout')}
          </button>
        </div>
      </aside>
      <main className="ml-72 flex-1 p-12 overflow-y-auto h-screen">{children}</main>
    </div>
  );
};

// --- Admin Pages ---

const AdminOrders = () => {
  const { t } = useContext(LanguageContext);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black text-slate-900">Pedidos</h1>
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">ID Pedido</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Cliente</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Fecha</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Total</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Estado</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-6 font-medium text-slate-500 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                <td className="p-6 font-bold text-slate-900">{order.userName}</td>
                <td className="p-6 font-medium text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-6 font-bold text-blue-900">${order.total.toFixed(2)}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                    }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-6">
                  <button onClick={() => alert(order.items)} className="text-blue-600 font-bold text-sm hover:underline">{t('adminViewDetail')}</button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No hay pedidos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BrandManagement = () => {
  const { t } = useContext(LanguageContext);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Partial<Brand>>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBrands().then(setBrands);
    fetchProducts().then(setProducts);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (currentBrand.id) {
        await updateBrand(currentBrand as Brand);
      } else {
        await createBrand(currentBrand as any);
      }
      const updatedBrands = await fetchBrands();
      setBrands(updatedBrands);
      setIsEditing(false);
      setCurrentBrand({});
    } catch (error) {
      console.error('Error saving brand:', error);
      alert('Error al guardar la marca. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setBrandToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (brandToDelete) {
      try {
        await deleteBrand(brandToDelete);
        const updatedBrands = await fetchBrands();
        setBrands(updatedBrands);
        setDeleteModalOpen(false);
        setBrandToDelete(null);
      } catch (error) {
        console.error('Error deleting brand:', error);
        alert('Error al eliminar la marca. Por favor, intenta de nuevo.');
      }
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setBrandToDelete(null);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">{t('adminBrandManagement')}</h1>
        <button onClick={() => { setCurrentBrand({ name: '', description: '', image: '' }); setIsEditing(true); }} className="px-8 py-4 bg-blue-900 text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20">{t('adminNewBrand')}</button>
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => !isSaving && setIsEditing(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-[3rem] p-10 max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => !isSaving && setIsEditing(false)} className="absolute top-8 right-8 hover:bg-slate-100 rounded-full p-2 transition-colors" disabled={isSaving}><X size={24} /></button>
              <h2 className="text-3xl font-black mb-8">{t('adminManageBrand')}</h2>
              <form onSubmit={handleSave} className="space-y-6">
                <input
                  placeholder="Nombre de la marca"
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-medium focus:border-blue-500 transition-colors"
                  value={currentBrand.name || ''}
                  onChange={e => setCurrentBrand({ ...currentBrand, name: e.target.value })}
                  disabled={isSaving}
                />
                <ImageUpload
                  currentImage={currentBrand.image}
                  onImageUploaded={(url) => setCurrentBrand(prev => ({ ...prev, image: url }))}
                  label="Logo de la Marca"
                />
                <textarea
                  placeholder="Breve descripción..."
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-medium focus:border-blue-500 transition-colors min-h-[100px]"
                  value={currentBrand.description || ''}
                  onChange={e => setCurrentBrand({ ...currentBrand, description: e.target.value })}
                  disabled={isSaving}
                />
                <button
                  type="submit"
                  className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : t('adminSaveBrand')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={cancelDelete}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-8">
                {products.filter(p => p.brandId === brandToDelete).length > 0 ? (
                  <>
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} className="text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No se puede eliminar</h3>
                    <p className="text-slate-500 font-medium mb-4">
                      Esta marca tiene productos asociados. Debes eliminarlos o reasignarlos antes de borrar la marca:
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 text-left max-h-40 overflow-y-auto border border-slate-100 mb-2">
                      <ul className="space-y-2">
                        {products.filter(p => p.brandId === brandToDelete).map(p => (
                          <li key={p.id} className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                            {p.size}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar esta marca?</h3>
                    <p className="text-slate-500 font-medium font-bold">Esta marca no tiene productos asociados y puede ser eliminada. Esta acción no se puede deshacer.</p>
                  </>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all font-bold"
                >
                  {products.filter(p => p.brandId === brandToDelete).length > 0 ? 'Entendido' : 'Cancelar'}
                </button>
                {products.filter(p => p.brandId === brandToDelete).length === 0 && (
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 font-bold"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {brands.map(b => (
          <div key={b.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="mb-4 flex items-center justify-center h-24 bg-slate-50 rounded-2xl overflow-hidden p-2">
              <img src={b.image} alt={b.name} className="max-h-full max-w-full object-contain rounded-xl" />
            </div>

            <h3 className="text-2xl font-black mb-2 text-slate-900">{b.name}</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{b.description || 'Sin descripción.'}</p>
            <div className="flex gap-4">
              <button onClick={() => { setCurrentBrand(b); setIsEditing(true); }} className="flex-1 py-3 rounded-xl bg-slate-50 font-bold hover:bg-slate-900 hover:text-white transition-all">Editar</button>
              <button onClick={() => handleDeleteClick(b.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const { t } = useContext(LanguageContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchCategories().then(setCategories);
    fetchBrands().then(setBrands);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    brandId: brands[0]?.id || '',
    name: '',
    size: '',
    categoryId: categories[0]?.id || '',
    description: '',
    status: 'Active',
    image: '',
    techSheetImage: '',
    price: 0,
    variants: []
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isImporting, setIsImporting] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const downloadTemplate = () => {
    const headers = ["Marca", "Modelo", "Categoria", "Descripcion", "Medida", "Precio", "ImagenURL", "FichaTecnicaURL"];
    const example = ["Ardent", "VANTI AS", "Passenger", "Neumático de alto rendimiento", "205/55 R16", "45.00", "https://picsum.photos/seed/tire1/800/800", "https://picsum.photos/seed/tech/800/800"];
    const csvContent = [headers, example].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "plantilla_importacion_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];

        // Group by Brand + Model to handle variants
        const productsMap: { [key: string]: any } = {};

        // Cache current brands and categories to avoid collisions
        let currentBrands = [...brands];
        let currentCategories = [...categories];

        for (const row of data) {
          const brandName = (row.Marca || '').trim();
          const categoryName = (row.Categoria || '').trim();

          if (!brandName) continue;

          // Find or create Brand
          let brand = currentBrands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
          if (!brand) {
            try {
              const newBrand = await createBrand({ name: brandName, image: 'https://picsum.photos/seed/brand/800/800', description: '' });
              brand = newBrand as Brand;
              currentBrands.push(brand);
              setBrands([...currentBrands]);
            } catch (e) {
              console.error("Error creating brand during import", e);
            }
          }

          // Find or create Category
          let category = currentCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
          if (!category && categoryName) {
            try {
              const newCat = await createCategory({ name: categoryName, description: '' });
              category = newCat as Category;
              currentCategories.push(category);
              setCategories([...currentCategories]);
            } catch (e) {
              console.error("Error creating category during import", e);
            }
          }

          const key = `${brandName}-${row.Modelo}`;
          if (!productsMap[key]) {
            productsMap[key] = {
              brandId: brand?.id || currentBrands[0]?.id,
              name: (row.Modelo || '').trim(),
              categoryId: category?.id || currentCategories[0]?.id,
              description: (row.Descripcion || '').trim(),
              status: 'Active',
              image: row.ImagenURL || 'https://picsum.photos/seed/tire/800/800',
              techSheetImage: row.FichaTecnicaURL || '',
              variants: []
            };
          }

          if (row.Medida && row.Precio) {
            productsMap[key].variants.push({
              id: crypto.randomUUID(),
              size: row.Medida,
              price: parseFloat(row.Precio) || 0,
              status: 'Active'
            });
          }
        }

        const productList = Object.values(productsMap);
        const total = productList.length;

        for (let i = 0; i < productList.length; i++) {
          const p = productList[i];
          // Ensure main price/size are set for backward compat
          p.size = p.variants[0]?.size || '';
          p.price = p.variants[0]?.price || 0;

          await createProduct(p as any);
          setImportProgress(Math.round(((i + 1) / total) * 100));
        }

        fetchProducts().then(setProducts);
        setImportLoading(false);
        setIsImporting(false);
        alert("Importación completada con éxito");
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setImportLoading(false);
        alert("Error al procesar el archivo CSV");
      }
    });
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete);
      fetchProducts().then(setProducts);
      cancelDelete();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = currentProduct.image || 'https://picsum.photos/seed/tire/400/300';
    // Use first variant as default size/price for backward compatibility in cards
    const mainVariant = currentProduct.variants?.[0];
    const productToSave = {
      ...currentProduct,
      image: finalImage,
      size: mainVariant?.size || currentProduct.size || '',
      price: mainVariant?.price || Number(currentProduct.price) || 0
    };

    if (currentProduct.id) {
      await updateProduct(productToSave as Product);
    } else {
      await createProduct(productToSave as any);
    }
    fetchProducts().then(setProducts);
    setIsEditing(false);
  };

  const handleEdit = (p: Product) => { setCurrentProduct(p); setIsEditing(true); };

  const [isPriceFocused, setIsPriceFocused] = useState(false);

  const filteredProducts = products.filter(p => {
    const brandName = brands.find(b => b.id === p.brandId)?.name || '';
    const categoryName = categories.find(c => c.id === p.categoryId)?.name || '';
    const searchableText = `${brandName} ${p.name} ${categoryName} ${p.size} ${p.variants?.map(v => v.size).join(' ')}`.toLowerCase();
    return searchableText.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <h1 className="text-3xl font-black text-slate-900">{t('adminCatalogManagement')}</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-blue-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-blue-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                title="Vista Tabla"
              >
                <List size={20} />
              </button>
            </div>

            <div className="relative group min-w-[300px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Buscar por marca, modelo o medida..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-blue-900/20 transition-all font-bold text-slate-700"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImporting(true)}
            className="flex items-center gap-3 px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all border border-slate-200"
          >
            <FileUp size={20} /> Importar
          </button>
          <button onClick={() => { setCurrentProduct({ brandId: brands[0]?.id || '', name: '', size: '', categoryId: categories[0]?.id || '', description: '', status: 'Active', image: '', techSheetImage: '', price: 0, variants: [] }); setIsEditing(true); }}
            className="flex items-center gap-3 px-8 py-4 bg-blue-900 text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20"
          >
            <Plus size={20} /> Nuevo Modelo
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-3xl w-full max-w-2xl p-10 overflow-hidden relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full"><X size={24} /></button>
              <h2 className="text-3xl font-black text-slate-900 mb-8">{currentProduct.id ? 'Editar' : 'Añadir'} Neumático</h2>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Marca</label>
                    <select required className="w-full px-5 py-4 rounded-2xl bg-slate-50 outline-none font-bold border border-slate-100 focus:bg-white transition-all" value={currentProduct.brandId} onChange={e => setCurrentProduct({ ...currentProduct, brandId: e.target.value })}>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Modelo / Nombre</label>
                    <input required placeholder="Ej: VANTI AS" className="w-full px-5 py-4 rounded-2xl bg-slate-50 outline-none font-bold border border-slate-100 focus:bg-white focus:border-blue-900/20 transition-all" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Categoría</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 outline-none font-bold border border-slate-100 focus:bg-white transition-all" value={currentProduct.categoryId} onChange={e => setCurrentProduct({ ...currentProduct, categoryId: e.target.value })}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Estado Global</label>
                    <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 outline-none font-bold border border-slate-100 focus:bg-white transition-all" value={currentProduct.status} onChange={e => setCurrentProduct({ ...currentProduct, status: e.target.value as any })}>
                      <option value="Active">Activo</option>
                      <option value="Inactive">Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* Variants Management */}
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-black uppercase text-slate-900 tracking-widest">Medidas y Precios</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = [...(currentProduct.variants || []), { id: crypto.randomUUID(), productId: currentProduct.id || '', size: '', price: 0, status: 'Active' as const }];
                        setCurrentProduct({ ...currentProduct, variants: newVariants });
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-900 rounded-xl text-xs font-black hover:bg-blue-200 transition-all flex items-center gap-2"
                    >
                      <Plus size={14} /> Añadir Medida
                    </button>
                  </div>

                  <div className="space-y-3">
                    {currentProduct.variants?.map((v, idx) => (
                      <div key={v.id || idx} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="col-span-6">
                          <input
                            placeholder="Medida (Ej: 205/55 R16)"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none font-bold text-sm"
                            value={v.size}
                            onChange={e => {
                              const newVariants = [...(currentProduct.variants || [])];
                              newVariants[idx].size = e.target.value;
                              setCurrentProduct({ ...currentProduct, variants: newVariants });
                            }}
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            placeholder="Precio"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none font-black text-sm text-blue-900"
                            value={v.price}
                            onChange={e => {
                              const newVariants = [...(currentProduct.variants || [])];
                              newVariants[idx].price = parseFloat(e.target.value) || 0;
                              setCurrentProduct({ ...currentProduct, variants: newVariants });
                            }}
                          />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const newVariants = currentProduct.variants?.filter((_, i) => i !== idx);
                              setCurrentProduct({ ...currentProduct, variants: newVariants });
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {!currentProduct.variants?.length && (
                      <div className="text-center py-6 text-slate-400 text-xs font-bold uppercase tracking-widest bg-white/50 rounded-2xl border-2 border-dashed border-slate-100">
                        No hay medidas configuradas
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <ImageUpload
                      currentImage={currentProduct.image}
                      onImageUploaded={(url) => setCurrentProduct(prev => ({ ...prev, image: url }))}
                      label="Imagen del Modelo"
                    />
                  </div>
                  <div className="space-y-2">
                    <ImageUpload
                      currentImage={currentProduct.techSheetImage}
                      onImageUploaded={(url) => setCurrentProduct(prev => ({ ...prev, techSheetImage: url }))}
                      label="Ficha Técnica (Imagen)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">Descripción Destacada</label>
                  <textarea rows={3} className="w-full px-5 py-4 rounded-2xl bg-slate-50 outline-none font-medium border border-slate-100 focus:bg-white transition-all" value={currentProduct.description} onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20">Guardar Cambios</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={cancelDelete}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar este producto?</h3>
                <p className="text-slate-500 font-medium font-bold">Esta acción no se puede deshacer. El producto será eliminado permanentemente de la base de datos.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 font-bold"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImporting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-3xl w-full max-w-lg p-10 overflow-hidden relative">
              <button
                onClick={() => !importLoading && setIsImporting(false)}
                disabled={importLoading}
                className="absolute top-8 right-8 p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-blue-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-12">
                  <FileUp size={40} className="text-blue-900 -rotate-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Importar Productos</h2>
                <p className="text-slate-500 font-medium tracking-tight">Sube un archivo CSV con tus neumáticos y medidas.</p>
              </div>

              {!importLoading ? (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-4">
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest pl-1">Paso 1: Preparar archivo</h4>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                      Utiliza nuestra plantilla para asegurar que los datos se importen correctamente. Si un modelo tiene varias medidas, agrégalas en líneas separadas.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 text-blue-900 font-black text-xs hover:underline"
                    >
                      <Download size={14} /> Descargar Plantilla .CSV
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest pl-2">Paso 2: Subir archivo</h4>
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-blue-400 cursor-pointer transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-10 h-10 text-slate-300 group-hover:text-blue-500 mb-4 transition-all" />
                        <p className="mb-2 text-sm text-slate-500 font-bold">Haga clic o arrastre su archivo .csv</p>
                        <p className="text-xs text-slate-400">Separado por comas (,)</p>
                      </div>
                      <input type="file" className="hidden" accept=".csv" onChange={handleImportCSV} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center space-y-8">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth="12"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="transparent"
                        stroke="#1E3A8A"
                        strokeWidth="12"
                        strokeDasharray={364}
                        strokeDashoffset={364 - (364 * importProgress) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-2xl font-black text-blue-900">{importProgress}%</span>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-900 text-xl mb-1">Importando catálogo...</p>
                    <p className="text-slate-500 font-medium tracking-tight">Estamos procesando y guardando los neumáticos en el sistema.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {filteredProducts.map(p => (
            <motion.div
              layout
              key={p.id}
              onClick={() => handleEdit(p)}
              className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 group hover:shadow-xl transition-all duration-500 cursor-pointer"
            >
              <div className="flex items-center gap-5 mb-6">
                <div className="relative group/img overflow-hidden rounded-2xl">
                  <img src={p.image} className="w-24 h-24 object-cover shadow-inner transition-transform duration-700 group-hover/img:scale-110" />
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${p.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{brands.find(b => b.id === p.brandId)?.name || 'Unknown'} {p.name}</h3>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-tighter mt-1">{p.variants?.length || 0} Medidas disponibles</p>
                  <p className="text-blue-600 font-bold text-xl mt-2 tracking-tighter">Desde ${p.price?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEdit(p)} className="flex-1 py-4 rounded-xl bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-blue-900 hover:text-white transition-all">
                  <Edit3 size={18} /> Editar
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(p.id); }}
                  className="p-4 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm mb-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest whitespace-nowrap">Producto / Marca</th>
                <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest whitespace-nowrap">Medida</th>
                <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest whitespace-nowrap">Categoría</th>
                <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest whitespace-nowrap">Precio</th>
                <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest whitespace-nowrap">Estado</th>
                <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => (
                <tr
                  key={p.id}
                  onClick={() => handleEdit(p)}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={p.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                      <div>
                        <div className="font-black text-slate-900">{brands.find(b => b.id === p.brandId)?.name || 'Unknown'} {p.name}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">ID: {p.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-bold text-slate-700">{p.variants?.length || 0} Medidas</td>
                  <td className="p-6 font-medium text-slate-500">{categories.find(c => c.id === p.categoryId)?.name || 'N/A'}</td>
                  <td className="p-6 font-black text-blue-900 tracking-tight">Desde ${p.price?.toFixed(2)}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.status === 'Active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(p.id); }}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
};

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Category>>({ name: '', description: '' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete);
      fetchCategories().then(setCategories);
      cancelDelete();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (current.id) {
      await updateCategory(current as Category);
    } else {
      await createCategory(current as any);
    }
    fetchCategories().then(setCategories);
    setIsEditing(false);
  };


  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Gestión de Categorías</h1>
        <button onClick={() => { setCurrent({ name: '', description: '' }); setIsEditing(true); }} className="px-8 py-4 bg-blue-900 text-white rounded-2xl font-bold hover:bg-blue-800 transition-all shadow-xl shadow-blue-900/20">Nueva Categoría</button>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] p-10 max-w-lg w-full relative">
              <button onClick={() => setIsEditing(false)} className="absolute top-8 right-8"><X size={24} /></button>
              <h2 className="text-3xl font-black mb-8">Administrar Categoría</h2>
              <form onSubmit={handleSave} className="space-y-6">
                <input placeholder="Nombre de la categoría" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-medium" value={current.name} onChange={e => setCurrent({ ...current, name: e.target.value })} />
                <textarea placeholder="Breve descripción..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-medium" value={current.description} onChange={e => setCurrent({ ...current, description: e.target.value })} />
                <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black shadow-xl shadow-blue-900/20">Guardar Categoría</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={cancelDelete}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar esta categoría?</h3>
                <p className="text-slate-500 font-medium font-bold">Esta acción no se puede deshacer. La categoría será eliminada permanentemente de la base de datos.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 font-bold"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black mb-2 text-slate-900">{c.name}</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">{c.description || 'Sin descripción.'}</p>
            <div className="flex gap-4">
              <button onClick={() => { setCurrent(c); setIsEditing(true); }} className="flex-1 py-3 rounded-xl bg-slate-50 font-bold hover:bg-slate-900 hover:text-white transition-all">Editar</button>
              <button onClick={() => handleDeleteClick(c.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProspectManagement = () => {
  const { t } = useContext(LanguageContext);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'prospects' | 'users'>('users');
  const [selectedItem, setSelectedItem] = useState<User | Prospect | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<User | Prospect | null>(null);

  const handleDeleteClick = (item: User | Prospect) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      if ('role' in itemToDelete) {
        await deleteUser(itemToDelete.id);
      } else {
        await deleteProspect(itemToDelete.id);
      }
      refreshData();
      closeDetail();
      cancelDelete();
    }
  };

  const refreshData = () => {
    fetchProspects().then(setProspects);
    fetchUsers().then(setUsers);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const closeDetail = () => {
    setSelectedItem(null);
    setIsEditing(false);
    setFormData({});
  };

  const handleEdit = (item: User | Prospect) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditing(true);
  };


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if ('role' in formData) {
      await updateUser(formData);
    } else {
      await updateProspect(formData);
    }
    refreshData();
    setIsEditing(false);
    setSelectedItem(formData);
  };

  const handleDetailChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value
      }
    }));
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900">Gestión de Clientes</h1>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Usuarios Registrados</button>
          <button onClick={() => setActiveTab('prospects')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'prospects' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Prospectos / Contacto</button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Nombre</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Empresa / Rol</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Email</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest">Fecha</th>
              <th className="p-6 font-bold text-slate-400 text-xs uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'users' ? (
              /* Users List */
              users.map(u => (
                <tr key={u.id} onClick={() => { setSelectedItem(u); setIsEditing(false); }} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="p-6 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{u.name}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${u.role === 'b2b' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role === 'b2b' ? 'Mayorista (B2B)' : u.role.toUpperCase()}
                    </span>
                    {u.company && <div className="text-xs text-slate-500 font-bold mt-1">{u.company}</div>}
                  </td>
                  <td className="p-6 text-slate-600 font-medium">{u.email}</td>
                  <td className="p-6 text-slate-400 text-sm font-bold">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(u)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteClick(u)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"><Trash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              /* Prospects List */
              prospects.map((p) => (
                <tr key={p.id} onClick={() => { setSelectedItem(p); setIsEditing(false); }} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="p-6 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</td>
                  <td className="p-6 font-medium text-slate-600">{p.company}</td>
                  <td className="p-6 text-slate-600 font-medium whitespace-nowrap">{p.email}</td>
                  <td className="p-6 text-slate-400 text-sm font-bold">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(p)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteClick(p)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"><Trash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}

            {((activeTab === 'users' && users.length === 0) || (activeTab === 'prospects' && prospects.length === 0)) && (
              <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">No hay registros encontrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail / Edit Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">{isEditing ? 'Editar Información' : selectedItem.name}</h2>
                  {!isEditing && (
                    <>
                      {'role' in selectedItem && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${selectedItem.role === 'b2b' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {selectedItem.role === 'b2b' ? 'B2B' : 'B2C'}
                        </span>
                      )}
                      {!('role' in selectedItem) && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-700">{t('labelProspect')}</span>
                      )}
                    </>
                  )}
                </div>
                <button onClick={closeDetail} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8">
                {isEditing ? (
                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Nombre</label>
                        <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-400 ml-1">Email</label>
                        <input type="email" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-400 ml-1">Empresa</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-400 ml-1">RUC / ID Fiscal</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.details?.taxId || ''} onChange={e => handleDetailChange('taxId', e.target.value)} />
                    </div>

                    {/* Role Specific Fields */}
                    {'role' in formData ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Teléfono</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.details?.phone || ''} onChange={e => handleDetailChange('phone', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Rol</label>
                            <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                              <option value="b2c">B2C (Personal)</option>
                              <option value="b2b">B2B (Mayorista)</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">Ciudad</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.details?.city || ''} onChange={e => handleDetailChange('city', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1">País</label>
                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.details?.country || ''} onChange={e => handleDetailChange('country', e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400 ml-1">Dirección</label>
                          <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.details?.address || ''} onChange={e => handleDetailChange('address', e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Prospect Specifics */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400 ml-1">País</label>
                          <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400 ml-1">Mensaje</label>
                          <textarea className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-blue-500 font-medium h-24" value={formData.message || ''} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                        </div>
                      </>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                      <button type="submit" className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">Guardar Cambios</button>
                    </div>
                  </form>
                ) : (
                  // View Mode (Same as before but wrapped)
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-400">Empresa</label>
                        <p className="font-bold text-slate-900 text-lg">{selectedItem.company || 'N/A'}</p>
                      </div>
                      {!('role' in selectedItem) && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400">Email</label>
                          <p className="font-bold text-slate-900 text-lg">{selectedItem.email}</p>
                        </div>
                      )}
                      {'details' in selectedItem && (selectedItem as User).details?.taxId && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400">RUC / ID Fiscal</label>
                          <p className="font-bold text-slate-900 text-lg">{(selectedItem as User).details?.taxId}</p>
                        </div>
                      )}
                      {'createdAt' in selectedItem && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400">Fecha de Registro</label>
                          <p className="font-bold text-slate-900 text-lg">{new Date(selectedItem.createdAt!).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {'details' in selectedItem && (
                      <>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400">Teléfono</label>
                            <p className="font-medium text-slate-700 text-lg">{(selectedItem as User).details?.phone || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-400">Ciudad / País</label>
                            <p className="font-medium text-slate-700 text-lg">
                              {[(selectedItem as User).details?.city, (selectedItem as User).details?.country].filter(Boolean).join(', ') || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400">Dirección</label>
                          <p className="font-medium text-slate-700 text-lg">{(selectedItem as User).details?.address || 'N/A'}</p>
                        </div>
                      </>
                    )}

                    {'productOfInterest' in selectedItem && (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400">Interés</label>
                          <p className="font-bold text-slate-900 text-lg">{(selectedItem as Prospect).productOfInterest || 'General'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400">Mensaje</label>
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-600 italic font-medium">
                            "{(selectedItem as Prospect).message}"
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-400">País (Origen)</label>
                          <p className="font-bold text-slate-900 text-lg">{(selectedItem as Prospect).country || 'N/A'}</p>
                        </div>
                      </>
                    )}

                    <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between gap-3">
                      <div className="flex gap-2">
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-blue-100 hover:text-blue-600 transition-all">
                          <Edit size={18} /> Editar
                        </button>
                        <button onClick={() => handleDeleteClick(selectedItem)} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-red-100 hover:text-red-600 transition-all">
                          <Trash size={18} /> Eliminar
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => window.location.href = `mailto:${selectedItem.email}`} className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
                          <Mail size={18} /> Email
                        </button>
                        {'details' in selectedItem && (selectedItem as User).details?.phone && (
                          <button onClick={() => window.open(`https://wa.me/${(selectedItem as User).details?.phone?.replace(/\D/g, '')}`, '_blank')} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20">
                            <MessageSquare size={18} /> WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={cancelDelete}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar registro?</h3>
                <p className="text-slate-500 font-medium font-bold">¿Estás seguro de que deseas eliminar a <b>{itemToDelete?.name}</b>? Esta acción no se puede deshacer.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 font-bold"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Dashboard Component
const DashboardHome = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
    fetchCategories().then(setCategories);
    fetchProspects().then(setProspects);
    fetchOrders().then(setOrders);
    fetchBrands().then(setBrands);
  }, []);

  // Calculate new prospects (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newProspects = prospects.filter(p => new Date(p.createdAt) >= sevenDaysAgo);

  // Calculate top products from orders
  const productSales: { [key: string]: number } = {};
  orders.forEach(order => {
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          productSales[item.id] = (productSales[item.id] || 0) + (item.quantity || 1);
        });
      }
    } catch (e) {
      // Skip invalid items
    }
  });

  const topProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([productId, count]) => ({
      product: products.find(p => p.id === productId),
      count
    }))
    .filter(item => item.product);

  // Prepare sales chart data (last 6 months)
  const salesByMonth: { [key: string]: number } = {};
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  orders.forEach(order => {
    const date = new Date(order.createdAt);
    const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + (order.total || 0);
  });

  const chartData = Object.entries(salesByMonth)
    .slice(-6)
    .map(([month, total]) => ({ month, total: Math.round(total) }));

  // Last 5 orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-black">Panel de Control</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Catálogo</div>
          <div className="text-5xl font-black text-blue-900">{products.length}</div>
        </div>
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Categorías</div>
          <div className="text-5xl font-black text-blue-500">{categories.length}</div>
        </div>
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Leads Activos</div>
          <div className="text-5xl font-black text-green-500">{prospects.length}</div>
        </div>
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Pedidos</div>
          <div className="text-5xl font-black text-orange-500">{orders.length}</div>
        </div>
      </div>

      {/* Sales Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black mb-6">Ventas por Mes</h2>
          <LineChart width={1000} height={300} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} />
          </LineChart>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black mb-6">Últimos 5 Pedidos</h2>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <div className="font-bold text-slate-900">{order.userEmail}</div>
                    <div className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-900">${order.total?.toFixed(2)}</div>
                    <div className="text-xs text-slate-400">{order.status}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-10">No hay pedidos aún</div>
          )}
        </div>

        {/* New Prospects */}
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black mb-6">Prospectos Nuevos (7 días)</h2>
          {newProspects.length > 0 ? (
            <div className="space-y-4">
              {newProspects.slice(0, 5).map(prospect => (
                <div key={prospect.id} className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
                  <div>
                    <div className="font-bold text-slate-900">{prospect.name}</div>
                    <div className="text-xs text-slate-400">{prospect.email}</div>
                  </div>
                  <div className="text-xs text-slate-400">{new Date(prospect.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-10">No hay prospectos nuevos</div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black mb-6">Productos Más Vendidos (Top 5)</h2>
          <div className="space-y-4">
            {topProducts.map(({ product, count }, index) => {
              const brand = brands.find(b => b.id === product?.brandId);
              return (
                <div key={product?.id} className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black text-blue-900">#{index + 1}</div>
                    <div>
                      <div className="font-bold text-slate-900">{brand?.name || 'Unknown'} - {product?.size}</div>
                      <div className="text-xs text-slate-400">{product?.description || 'No description'}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-blue-600">{count} vendidos</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, pass);
    if (success) {
      navigate('/admin');
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 3000);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="bg-blue-900 p-4 rounded-3xl inline-block mb-8 shadow-2xl shadow-blue-900/30"><Shield className="text-white" size={32} /></div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('loginTitle')}</h1>
          <p className="text-slate-500 mt-2 font-medium">{t('loginSubtitle')}</p>
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-3xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('loginEmail')}</label>
              <input type="email" placeholder="tu@email.com" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{t('loginPassword')}</label>
              <input type="password" placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-medium"
                value={pass} onChange={e => setPass(e.target.value)} required />
            </div>
            {err && <div className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{t('loginInvalidCredentials')}</div>}
            <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-900/30">{t('loginEnter')}</button>
          </form>
        </div>
        <Link to="/" className="mt-10 block text-center text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-blue-900 transition-colors flex items-center justify-center gap-2">
          <ArrowRight className="rotate-180" size={16} /> {t('loginBackToWeb')}
        </Link>
      </motion.div>
    </div>
  );
};

const MarketsPage = () => {
  const { t } = useContext(LanguageContext);
  const markets = [
    { name: 'USA', img: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?auto=format&fit=crop&w=800&q=80' },
    { name: 'España', img: '/images/spain-madrid.png' },
    { name: 'Cuba', img: '/images/cuba-havana.png' },
    { name: 'Panamá', img: '/images/panama-city.png' },
  ];

  return (
    <div className="pt-32 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <FadeIn>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">{t('marketsTitle')}</h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">{t('marketsSubtitle')}</p>
          </FadeIn>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {markets.map((m, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="group relative rounded-[3rem] overflow-hidden h-[400px] shadow-lg border border-slate-100">
                <img src={m.img} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <h3 className="text-4xl font-black text-white mb-2">{m.name}</h3>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
};

const COUNTRIES = [
  "Panamá", "Costa Rica", "Colombia", "México", "Estados Unidos", "España", "Argentina", "Chile", "Perú", "Otro"
];

const SignupPage = () => {
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'b2c' as 'b2c' | 'b2b',
    company: '',
    phone: '',
    address: '',
    city: '',
    country: 'Panamá',
    taxId: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.role === 'b2b' && !formData.company) {
        setError('El nombre de la empresa es requerido para cuentas B2B.');
        return;
      }
      const success = await register({
        ...formData,
        details: {
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          taxId: formData.taxId
        }
      });
      if (success) navigate('/');
      if (success) navigate('/');
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || 'Error al registrarse. Verifica los datos.');
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
        <h1 className="text-4xl font-black text-slate-900 mb-8 text-center">{formData.role === 'b2b' ? 'Cuenta Mayorista (B2B)' : 'Cuenta Personal (B2C)'}</h1>

        <div className="flex gap-4 mb-8 justify-center">
          <button onClick={() => setFormData({ ...formData, role: 'b2c' })} className={`px-6 py-3 rounded-xl font-bold transition-all ${formData.role === 'b2c' ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>Cliente B2C</button>
          <button onClick={() => setFormData({ ...formData, role: 'b2b' })} className={`px-6 py-3 rounded-xl font-bold transition-all ${formData.role === 'b2b' ? 'bg-blue-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500'}`}>Cliente B2B</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Nombre Completo" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          {formData.role === 'b2b' && (
            <>
              <input required placeholder="Nombre de la Empresa" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
              <input required placeholder="RUC / Identificación Fiscal" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.taxId} onChange={e => setFormData({ ...formData, taxId: e.target.value })} />
            </>
          )}
          <input required type="email" placeholder="Correo Electrónico" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input required type="password" placeholder="Contraseña" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />

          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Teléfono" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <input placeholder="Ciudad" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
          </div>
          <input placeholder="Dirección" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />

          <div className="relative">
            <select
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium appearance-none"
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
          </div>

          {error && <div className="text-red-500 text-sm font-bold text-center">{error}</div>}

          <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-blue-800 transition-all">Crear Cuenta</button>

          <p className="text-center text-slate-400 font-medium">
            ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 font-bold hover:underline">Inicia Sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

const ClientLoginPage = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(email, pass)) {
      navigate('/');
    } else {
      setErr(true);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
        <h1 className="text-4xl font-black text-slate-900 mb-2 text-center">Bienvenido</h1>
        <p className="text-slate-500 font-medium text-center mb-8">Inicia sesión para continuar</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="email" placeholder="Email" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Contraseña" required className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-medium" value={pass} onChange={e => setPass(e.target.value)} />

          {err && <div className="text-red-500 text-sm font-bold text-center">Credenciales incorrectas.</div>}

          <button type="submit" className="w-full py-5 bg-blue-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-blue-800 transition-all">Entrar</button>

          <p className="text-center text-slate-400 font-medium">
            ¿No tienes cuenta? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Regístrate</Link>
          </p>
          <div className="text-center border-t border-slate-100 pt-4 mt-4">
            <Link to="/admin/login" className="text-xs font-bold text-slate-300 uppercase tracking-widest hover:text-blue-900 transition-colors">Acceso Admin</Link>
          </div>
        </form>
      </div>

    </div>
  );
};


const AdminSettings = () => {
  const { settings, setSettings } = useContext(SettingsContext);
  const [isSaving, setIsSaving] = useState(false);

  const handleTogglePrices = async () => {
    setIsSaving(true);
    try {
      const newSettings = { ...settings, show_prices: !settings.show_prices };
      await updateSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      console.error('Error updating settings:', err);
      alert('Error al actualizar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-lg shadow-blue-900/20">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900">Configuración</h1>
          <p className="text-slate-500 font-medium">Gestiona el comportamiento global de tu plataforma.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 md:p-12 border border-slate-200 shadow-xl shadow-blue-900/5 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex-1">
            <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              Visibilidad de Precios
              {!settings.show_prices && (
                <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] uppercase font-black rounded-full tracking-widest">Precios Ocultos</span>
              )}
            </h3>
            <p className="text-slate-600 font-medium leading-relaxed text-lg">
              Esta opción afecta a toda la web pública. Si desactivas los precios, los clientes verán el texto <span className="text-blue-600 font-black">"Consultar"</span> en lugar del valor numérico.
            </p>
            <div className="mt-6 flex items-center gap-4 text-sm text-slate-400 font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                Catálogo Público
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                Detalle de Producto
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                Carrito y WhatsApp
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 min-w-[240px]">
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${settings.show_prices ? 'text-blue-600' : 'text-slate-400'}`}>
              {settings.show_prices ? 'Precios Visibles' : 'Precios Ocultos'}
            </span>

            <button
              onClick={handleTogglePrices}
              disabled={isSaving}
              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner group ${settings.show_prices ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div
                className={`absolute w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform duration-500 flex items-center justify-center ${settings.show_prices ? 'translate-x-[2.75rem]' : 'translate-x-1'}`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${settings.show_prices ? 'bg-blue-600' : 'bg-slate-300'}`} />
                )}
              </div>
            </button>

            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Click para cambiar</p>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- App Entry ---
const App = () => {
  // Detect browser language on first load
  const detectBrowserLanguage = (): Language => {
    const browserLang = navigator.language.toLowerCase();
    // If Spanish, return 'es', otherwise default to 'en'
    if (browserLang.startsWith('es')) {
      return 'es';
    }
    return 'en'; // Default to English for all other languages
  };

  const [lang, setLang] = useState<Language>(() => {
    // Check localStorage first, then browser language
    const saved = localStorage.getItem('language') as Language;
    return saved || detectBrowserLanguage();
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', lang);
  }, [lang]);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({ show_prices: true });

  const refreshSettings = async () => {
    try {
      const s = await fetchSettings();
      setSettings(s);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const t = (key: string) => translations[key]?.[lang] || key;

  const authContextValue = {
    user,
    login: async (email: string, pass: string) => {
      // Admin backdoor
      if (email === 'admin@istmoglobal.com' && pass === 'admin') {
        setUser({ id: 'admin', email, role: 'admin', name: 'Administrator' });
        return true;
      }
      const loggedUser = await loginUser(email, pass);
      if (loggedUser) {
        setUser(loggedUser);
        return true;
      }
      return false;
    },
    logout: () => setUser(null),
    register: async (userData: Omit<User, 'id'>) => {
      const newUser = await createUser(userData);
      if (newUser) {
        setUser(newUser);
        return true;
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <SettingsContext.Provider value={{ settings, setSettings, refreshSettings }}>
        <LanguageContext.Provider value={{ lang, setLang, t }}>
          <CartProvider>
            <HashRouter>
              <div className="flex flex-col min-h-screen overflow-x-hidden">
                <Navbar />
                <CartDrawer />
                <div className="flex-grow">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/markets" element={<MarketsPage />} />
                    <Route path="/login" element={<ClientLoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    <Route path="/admin/login" element={<LoginPage />} />
                    <Route path="/admin" element={<AdminLayout><DashboardHome /></AdminLayout>} />
                    <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
                    <Route path="/admin/brands" element={<AdminLayout><BrandManagement /></AdminLayout>} />
                    <Route path="/admin/products" element={<AdminLayout><ProductManagement /></AdminLayout>} />
                    <Route path="/admin/categories" element={<AdminLayout><CategoryManagement /></AdminLayout>} />
                    <Route path="/admin/prospects" element={<AdminLayout><ProspectManagement /></AdminLayout>} />
                    <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </div>
                <Footer />
              </div>
            </HashRouter>
          </CartProvider>
        </LanguageContext.Provider>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;
