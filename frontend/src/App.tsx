import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  Check,
  ChevronRight,
  Cloud,
  Cpu,
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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

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
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then((response) => (response.ok ? response.json() as Promise<ServiceItem[]> : Promise.reject(new Error('API no disponible'))))
      .then(setServices)
      .catch(() => undefined);
  }, []);

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
          <button className="login-button">Iniciar sesión</button>
          <button className="nav-cta">Explorar <ArrowUpRight size={16} /></button>
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

      <footer className="site-footer shell" id="ayuda"><div><a className="brand" href="#top"><span className="brand-mark">N</span><span>Nexo<span className="brand-dot">.</span></span></a><p>Servicios digitales para la vida real.</p></div><div className="footer-links"><a href="#servicios">Servicios</a><a href="#membresia">Membresías</a><a href="#como-funciona">Preguntas frecuentes</a><a href="mailto:hola@nexo.local">Contacto</a></div><span className="footer-year">© 2026 Nexo</span></footer>
    </main>
  );
}

function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const Icon = categoryIcons[service.category];
  return <article className={`service-card accent-${service.accent}`} style={{ animationDelay: `${index * 70}ms` }}><div className="service-card-top"><span className="service-icon"><Icon size={18} /></span><span className="service-category">{categoryLabels[service.category]}</span><ArrowUpRight className="card-arrow" size={18} /></div><div className="service-art"><div className="art-grid" /><span className="art-orb orb-one" /><span className="art-orb orb-two" /><Icon className="art-icon" size={62} strokeWidth={1.25} /></div><h3>{service.name}</h3><p>{service.description}</p><div className="service-card-bottom"><strong>{service.priceLabel}</strong><a href="#ayuda">Conocer más <ChevronRight size={15} /></a></div></article>;
}

export default App;
