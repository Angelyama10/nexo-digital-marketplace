import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  Cloud,
  GraduationCap,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';

type ServiceCategory = 'streaming' | 'ai' | 'education' | 'infrastructure' | 'automation' | 'commerce';

type ServiceItem = {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  priceFrom: number;
  priceLabel: string;
  accent: 'coral' | 'blue' | 'yellow' | 'mint';
  featured?: boolean;
};

type User = { id: string; name: string; lastName: string | null; email: string; role: string };
type MembershipLevel = { id: string; name: string; description: string | null; monthlyPrice: number; currency: string; includedServices: { id: string; name: string }[] };
type Product = { id: string; name: string; description: string | null; price: number; currency: string; type: string; durationDays: number | null };
type BotFunction = { id: string; name: string; description: string | null; basePrice: number };
type AuthMode = 'login' | 'register';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const ACCESS_TOKEN_KEY = 'nexo_access_token';

async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (response.status === 401 && retry && path !== '/auth/refresh') {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshed.ok) {
      const session = await refreshed.json() as { accessToken: string };
      localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
      return api<T>(path, init, false);
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'No fue posible completar la solicitud.' })) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message[0] : body.message ?? 'No fue posible completar la solicitud.');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

const fallbackServices: ServiceItem[] = [
  { id: 'streaming-packs', name: 'Packs de streaming', category: 'streaming', description: 'Accesos y planes organizados con soporte humano.', priceFrom: 89, priceLabel: 'Desde $89 MXN / mes', accent: 'coral', featured: true },
  { id: 'ai-workspace', name: 'IA para trabajar', category: 'ai', description: 'Herramientas y configuraciones para crear más rápido.', priceFrom: 149, priceLabel: 'Desde $149 MXN / mes', accent: 'blue', featured: true },
  { id: 'learning-club', name: 'Suscripciones educativas', category: 'education', description: 'Bibliotecas, cursos y recursos para seguir aprendiendo.', priceFrom: 129, priceLabel: 'Desde $129 MXN / mes', accent: 'yellow' },
  { id: 'vpn-shield', name: 'VPN Shield', category: 'infrastructure', description: 'Conexión privada para tus dispositivos y equipos.', priceFrom: 99, priceLabel: 'Desde $99 MXN / mes', accent: 'mint' },
  { id: 'servers-domains', name: 'Servidores y dominios', category: 'infrastructure', description: 'Infraestructura lista para proyectos personales o negocios.', priceFrom: 249, priceLabel: 'Desde $249 MXN', accent: 'blue' },
  { id: 'telegram-bots', name: 'Bots de Telegram', category: 'automation', description: 'Automatizaciones a la medida para vender, avisar y operar.', priceFrom: 799, priceLabel: 'Cotización desde $799 MXN', accent: 'coral' },
];

const categoryLabels: Record<ServiceCategory, string> = {
  streaming: 'Streaming',
  ai: 'IA',
  education: 'Educación',
  infrastructure: 'Infraestructura',
  automation: 'Automatización',
  commerce: 'Pedidos online',
};

const categoryIcons: Record<ServiceCategory, typeof Sparkles> = {
  streaming: Play,
  ai: Sparkles,
  education: GraduationCap,
  infrastructure: Cloud,
  automation: Bot,
  commerce: ArrowUpRight,
};

function App() {
  const [services, setServices] = useState<ServiceItem[]>(fallbackServices);
  const [levels, setLevels] = useState<MembershipLevel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [botFunctions, setBotFunctions] = useState<BotFunction[]>([]);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedBotFunctions, setSelectedBotFunctions] = useState<string[]>([]);

  useEffect(() => {
    api<ServiceItem[]>('/services').then(setServices).catch(() => undefined);
    api<MembershipLevel[]>('/membership-levels').then(setLevels).catch(() => undefined);
    api<Product[]>('/products').then(setProducts).catch(() => undefined);
    api<BotFunction[]>('/bot-functions').then(setBotFunctions).catch(() => undefined);
    if (localStorage.getItem(ACCESS_TOKEN_KEY)) api<User>('/auth/me').then(setUser).catch(() => localStorage.removeItem(ACCESS_TOKEN_KEY));
    const checkout = new URLSearchParams(window.location.search).get('checkout');
    if (checkout === 'success') setNotice('Tu pago fue enviado a Stripe. Confirmaremos el servicio en cuanto llegue la validación.');
    if (checkout === 'cancelled') setNotice('El pago fue cancelado; no se realizó ningún cargo.');
  }, []);

  const requireAccount = (action: () => void) => user ? action() : setAuthMode('login');
  const checkout = async (resourceType: string, resourceId: string) => {
    try {
      const result = await api<{ checkoutUrl: string }>('/payments/checkout', { method: 'POST', body: JSON.stringify({ resourceType, resourceId }) });
      window.location.assign(result.checkoutUrl);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'No fue posible iniciar el pago.'); }
  };
  const subscribe = (levelId: string) => requireAccount(() => {
    api<{ id: string }>('/subscriptions', { method: 'POST', body: JSON.stringify({ levelId }) })
      .then((subscription) => checkout('SUBSCRIPTION', subscription.id))
      .catch((error: Error) => setNotice(error.message));
  });
  const buyProduct = (productId: string) => requireAccount(() => {
    api<{ id: string }>('/ecommerce-orders', { method: 'POST', body: JSON.stringify({ items: [{ productId, quantity: 1 }] }) })
      .then((order) => checkout('ECOMMERCE_ORDER', order.id))
      .catch((error: Error) => setNotice(error.message));
  });
  const logout = async () => { await api<void>('/auth/logout', { method: 'POST' }).catch(() => undefined); localStorage.removeItem(ACCESS_TOKEN_KEY); setUser(null); };

  const visibleServices = activeCategory === 'all'
    ? services
    : services.filter((service) => service.category === activeCategory);

  return (
    <main>
      <nav className="site-nav shell">
        <a className="brand" href="#top" aria-label="Nexo inicio">
          <span className="brand-mark">N</span>
          <span>Nexo<span className="brand-dot">.</span></span>
        </a>
        <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
          <a href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</a>
          <a href="#membresia" onClick={() => setMenuOpen(false)}>Membresías</a>
          <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
          <a href="#ayuda" onClick={() => setMenuOpen(false)}>Ayuda</a>
        </div>
        <div className="nav-actions">
          {user ? <><span className="account-name">Hola, {user.name}</span><button className="login-button" onClick={logout}>Salir</button></> : <button className="login-button" onClick={() => setAuthMode('login')}>Iniciar sesión</button>}
          <a className="nav-cta" href="#servicios">Explorar <ArrowUpRight size={16} /></a>
          <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menú">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> El internet, bien resuelto</div>
          <h1>Todo lo digital.<br /><em>En un mismo lugar.</em></h1>
          <p className="hero-lede">Suscripciones, herramientas y servicios para que trabajes, aprendas y disfrutes más. Sin vueltas raras.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#servicios">Ver servicios <ArrowUpRight size={18} /></a>
            <a className="text-button" href="#como-funciona"><span className="play-icon"><Play size={12} fill="currentColor" /></span> Así funciona</a>
          </div>
          <div className="trust-row"><div className="avatar-stack"><span>AG</span><span>MR</span><span>LC</span></div><span><strong>+2,400</strong> personas ya están en Nexo</span></div>
        </div>
        <div className="hero-visual" aria-label="Servicios digitales de Nexo">
          <div className="visual-sun" />
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="hero-card card-main">
            <div className="card-topline"><span className="live-dot" /> Tu espacio digital</div>
            <div className="screen-header"><span>Resumen</span><span className="screen-date">Hoy, 30 Jul</span></div>
            <div className="metric-row"><div><small>Servicios activos</small><strong>04</strong></div><div><small>Próximo cobro</small><strong>$349 <span>MXN</span></strong></div></div>
            <div className="usage-bar"><span /><span /><span /><span /></div>
            <div className="screen-list"><div><span className="mini-icon orange"><Play size={11} fill="currentColor" /></span><span>Streaming pack</span><b>Activo</b></div><div><span className="mini-icon blue"><Sparkles size={11} /></span><span>IA Workspace</span><b>Activo</b></div><div><span className="mini-icon mint"><ShieldCheck size={11} /></span><span>VPN Shield</span><b>Activo</b></div></div>
          </div>
          <div className="floating-card float-left"><span className="float-icon"><Check size={15} /></span><div><small>Pago confirmado</small><strong>Todo en orden</strong></div></div>
          <div className="floating-card float-right"><span className="sparkle-badge"><Sparkles size={18} /></span><strong>Hecho para ti</strong><small>Soporte real, cuando lo necesites</small></div>
          <div className="visual-caption"><Wifi size={15} /> servicios que conectan contigo</div>
        </div>
      </section>

      <section className="category-strip shell" id="como-funciona" aria-label="Categorías">
        <span className="strip-label">Explora por categoría</span>
        <div className="category-pills">
          <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>Todo</button>
          {(Object.keys(categoryLabels) as ServiceCategory[]).filter((category) => category !== 'commerce').map((category) => {
            const Icon = categoryIcons[category];
            return <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}><Icon size={15} /> {categoryLabels[category]}</button>;
          })}
        </div>
      </section>

      <section className="services-section shell" id="servicios">
        <div className="section-heading"><div><span className="section-kicker">La selección Nexo</span><h2>Servicios que sí <em>aportan.</em></h2></div><a href="#servicios" className="view-all">Ver todo <ChevronRight size={17} /></a></div>
        <div className="service-grid">
          {visibleServices.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}
        </div>
      </section>

      <section className="membership-section shell" id="membresia">
        <div className="membership-content"><span className="section-kicker light">Nexo Club</span><h2>Más usas Nexo,<br /><em>más ganas.</em></h2><p>Una membresía que te da precios preferentes, soporte prioritario y beneficios que se sienten desde el primer mes.</p><a className="light-button" href="#ayuda">Conocer membresías <ArrowUpRight size={17} /></a></div>
        <div className="membership-orbit"><div className="orbit-label label-top">precio justo</div><div className="orbit-label label-bottom">soporte humano</div><div className="membership-core"><span>N</span><small>CLUB</small></div><div className="membership-ring ring-a" /><div className="membership-ring ring-b" /></div>
      </section>

      <section className="commerce-section shell" aria-label="Compra y cotiza">
        <div className="section-heading"><div><span className="section-kicker">Compra con cuenta</span><h2>Elige, paga y<br /><em>listo.</em></h2></div></div>
        <div className="checkout-grid">
          <article className="checkout-panel"><h3>Membresías</h3><p>Tu suscripción se activa al confirmarse el pago.</p>{levels.length ? levels.map((level) => <div className="purchase-row" key={level.id}><div><strong>{level.name}</strong><small>{level.description}</small></div><button onClick={() => subscribe(level.id)}>${level.monthlyPrice} / mes</button></div>) : <small>Cargando planes…</small>}</article>
          <article className="checkout-panel"><h3>Infraestructura</h3><p>VPN, dominios y servidores disponibles para comprar.</p>{products.length ? products.map((product) => <div className="purchase-row" key={product.id}><div><strong>{product.name}</strong><small>{product.description}</small></div><button onClick={() => buyProduct(product.id)}>Comprar ${product.price}</button></div>) : <small>Cargando productos…</small>}</article>
        </div>
      </section>

      <section className="request-section shell" id="solicitudes">
        <article className="request-card"><span className="section-kicker">Bot de Telegram</span><h3>Cotiza tu automatización</h3><p>Selecciona las funciones que quieres. El total se congela antes del pago.</p><div className="function-list">{botFunctions.map((item) => <label key={item.id}><input type="checkbox" checked={selectedBotFunctions.includes(item.id)} onChange={() => setSelectedBotFunctions((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} /><span>{item.name}<small>${item.basePrice} MXN</small></span></label>)}</div><button className="primary-button" onClick={() => requireAccount(() => { if (!selectedBotFunctions.length) return setNotice('Selecciona al menos una función para el bot.'); api<{ id: string }>('/bot-quotes', { method: 'POST', body: JSON.stringify({ funcionIds: selectedBotFunctions }) }).then((quote) => checkout('BOT_QUOTE', quote.id)).catch((error: Error) => setNotice(error.message)); })}>Cotizar y pagar <ArrowUpRight size={17} /></button></article>
        <OnlineOrderForm requireAccount={requireAccount} checkout={checkout} setNotice={setNotice} />
      </section>

      <footer className="site-footer shell" id="ayuda"><div><a className="brand" href="#top"><span className="brand-mark">N</span><span>Nexo<span className="brand-dot">.</span></span></a><p>Servicios digitales para la vida real.</p></div><div className="footer-links"><a href="#servicios">Servicios</a><a href="#membresia">Membresías</a><a href="#solicitudes">Solicitudes</a><a href="mailto:hola@nexo.local">Contacto</a></div><span className="footer-year">© 2026 Nexo</span></footer>
      {notice && <div className="notice" role="status">{notice}<button aria-label="Cerrar" onClick={() => setNotice(null)}><X size={16} /></button></div>}
      {authMode && <AuthDialog mode={authMode} close={() => setAuthMode(null)} onSession={(session) => { localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken); setUser(session.user); setAuthMode(null); setNotice(`Bienvenida, ${session.user.name}. Tu cuenta está lista.`); }} />}
    </main>
  );
}

function OnlineOrderForm({ requireAccount, checkout, setNotice }: { requireAccount: (action: () => void) => void; checkout: (type: string, id: string) => Promise<void>; setNotice: (notice: string) => void }) {
  const [url, setUrl] = useState(''); const [amount, setAmount] = useState('');
  const submit = (event: FormEvent) => { event.preventDefault(); requireAccount(() => { api<{ id: string; totalAmount: number }>('/online-orders', { method: 'POST', body: JSON.stringify({ urlProducto: url, montoProducto: Number(amount) }) }).then((order) => checkout('ONLINE_ORDER', order.id)).catch((error: Error) => setNotice(error.message)); }); };
  return <article className="request-card"><span className="section-kicker">Pedido online</span><h3>Lo compramos por ti</h3><p>Te mostramos la comisión del 15% y llevamos tu pedido a pago seguro.</p><form onSubmit={submit}><label>Enlace del producto<input required type="url" value={url} placeholder="https://tienda.com/producto" onChange={(event) => setUrl(event.target.value)} /></label><label>Monto del producto (MXN)<input required min="1" type="number" value={amount} placeholder="0.00" onChange={(event) => setAmount(event.target.value)} /></label><button className="primary-button" type="submit">Calcular y pagar <ArrowUpRight size={17} /></button></form></article>;
}

function AuthDialog({ mode, close, onSession }: { mode: AuthMode; close: () => void; onSession: (session: { accessToken: string; user: User }) => void }) {
  const [currentMode, setCurrentMode] = useState(mode); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setLoading(true); setError(''); try { const body = currentMode === 'register' ? { nombre: name, email, password } : { email, password }; onSession(await api<{ accessToken: string; user: User }>(`/auth/${currentMode}`, { method: 'POST', body: JSON.stringify(body) })); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No fue posible acceder.'); } finally { setLoading(false); } };
  return <div className="modal-backdrop" role="presentation"><section className="auth-dialog" role="dialog" aria-modal="true" aria-label="Acceso a Nexo"><button className="modal-close" onClick={close} aria-label="Cerrar"><X size={18} /></button><span className="section-kicker">Tu espacio Nexo</span><h2>{currentMode === 'login' ? 'Qué bueno verte.' : 'Crea tu cuenta.'}</h2><form onSubmit={submit}>{currentMode === 'register' && <label>Nombre<input required value={name} onChange={(event) => setName(event.target.value)} /></label>}<label>Correo<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Contraseña<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading} type="submit">{loading ? 'Un momento…' : currentMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} <ArrowUpRight size={17} /></button></form><button className="switch-auth" onClick={() => setCurrentMode(currentMode === 'login' ? 'register' : 'login')}>{currentMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</button></section></div>;
}

function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const Icon = categoryIcons[service.category];
  return <article className={`service-card accent-${service.accent}`} style={{ animationDelay: `${index * 70}ms` }}><div className="service-card-top"><span className="service-icon"><Icon size={18} /></span><span className="service-category">{categoryLabels[service.category]}</span><ArrowUpRight className="card-arrow" size={18} /></div><div className="service-art"><div className="art-grid" /><span className="art-orb orb-one" /><span className="art-orb orb-two" /><Icon className="art-icon" size={62} strokeWidth={1.25} /></div><h3>{service.name}</h3><p>{service.description}</p><div className="service-card-bottom"><strong>{service.priceLabel}</strong><a href="#ayuda">Conocer más <ChevronRight size={15} /></a></div></article>;
}

export default App;
