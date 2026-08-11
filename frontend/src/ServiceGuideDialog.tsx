import { useEffect } from 'react';
import { ArrowUpRight, Check, Info, X } from 'lucide-react';
import { serviceGuides, type ServiceGuideKey } from './service-guides';

type ServiceGuideDialogProps = {
  guideKey: ServiceGuideKey;
  close: () => void;
};

export function ServiceGuideDialog({ guideKey, close }: ServiceGuideDialogProps) {
  const guide = serviceGuides[guideKey];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close]);

  return (
    <div className="modal-backdrop guide-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className={`guide-dialog guide-accent-${guide.accent}`} role="dialog" aria-modal="true" aria-labelledby={`guide-title-${guideKey}`}>
        <button className="modal-close guide-close" onClick={close} aria-label="Cerrar explicación"><X size={20} /></button>

        <header className="guide-header">
          <span className="section-kicker">{guide.eyebrow}</span>
          <h2 id={`guide-title-${guideKey}`}>{guide.title}</h2>
          <p>{guide.lead}</p>
          <div className="guide-highlights">
            {guide.highlights.map((item) => <span key={item}><Check size={14} /> {item}</span>)}
          </div>
        </header>

        <div className="guide-examples" aria-label="Ejemplos">
          <div>{guide.examples.map((example) => <span key={example}>{example}</span>)}</div>
          <small>{guide.exampleNote}</small>
        </div>

        <div className="guide-section">
          <div className="guide-section-heading"><span>01</span><div><small>Sin sorpresas</small><h3>Modalidades posibles</h3></div></div>
          <div className="guide-mode-grid">
            {guide.modes.map((mode) => (
              <article key={mode.label}>
                <span>{mode.label}</span>
                <h4>{mode.title}</h4>
                <p>{mode.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="guide-process">
          <div className="guide-section-heading"><span>02</span><div><small>De principio a fin</small><h3>Cómo funciona</h3></div></div>
          <ol>
            {guide.steps.map((step, index) => <li key={step}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></li>)}
          </ol>
        </div>

        <aside className="guide-note"><Info size={18} /><p><strong>Importante</strong>{guide.note}</p></aside>

        <footer className="guide-footer">
          <p>Las condiciones finales siempre se muestran antes de generar tu transferencia.</p>
          <a className="primary-button" href={guide.ctaHref} onClick={close}>{guide.ctaLabel} <ArrowUpRight size={17} /></a>
        </footer>
      </section>
    </div>
  );
}
