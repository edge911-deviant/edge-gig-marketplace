import { useEffect, useRef, useState } from 'react';
import { Crosshair, Pause, Play } from 'lucide-react';
import { motion, useReducedMotion, useScroll } from 'motion/react';

export function useSiteMotion() {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(() => {
    try { return window.sessionStorage.getItem('edge-site-motion') === 'paused'; } catch { return false; }
  });
  const enabled = !reducedMotion && !paused;

  useEffect(() => {
    if (!enabled) return;
    const surfaces = document.querySelectorAll('.public-site .section-heading-row, .public-site .opportunity-card, .public-site .step-card, .public-site .role-panel, .public-site .trust-console');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute('data-revealed', 'true');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    surfaces.forEach((surface) => { surface.setAttribute('data-reveal', 'true'); observer.observe(surface); });
    return () => { observer.disconnect(); surfaces.forEach((surface) => surface.removeAttribute('data-reveal')); };
  }, [enabled]);

  const toggle = () => {
    setPaused((value) => {
      try { window.sessionStorage.setItem('edge-site-motion', value ? 'active' : 'paused'); } catch { /* Motion controls still work if browser storage is unavailable. */ }
      return !value;
    });
  };

  return { enabled, toggle, reducedMotion: Boolean(reducedMotion) };
}

export function SiteMotionControl({ enabled, reducedMotion, onToggle }: {
  enabled: boolean; reducedMotion: boolean; onToggle: () => void;
}) {
  return (
    <button type="button" className="site-motion-control" onClick={onToggle} disabled={reducedMotion}
      aria-label={reducedMotion ? 'Motion reduced by device preference' : enabled ? 'Pause visual effects' : 'Enable visual effects'}
      title={reducedMotion ? 'Following your device’s reduced-motion preference' : enabled ? 'Pause visual effects' : 'Enable visual effects'}>
      {enabled ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
      <span>{enabled ? 'Motion on' : 'Motion off'}</span>
    </button>
  );
}

export function SiteScrollProgress({ enabled }: { enabled: boolean }) {
  const { scrollYProgress } = useScroll();
  return enabled ? <motion.div className="site-scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" /> : null;
}

export function SignalCursor({ enabled }: { enabled: boolean }) {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = cursor.current?.closest<HTMLElement>('.public-site');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!root || !cursor.current) return;
    let frame = 0;
    const hide = () => {
      cancelAnimationFrame(frame);
      delete root.dataset.cursor;
      if (cursor.current) cursor.current.dataset.visible = 'false';
    };
    const handleMove = (event: PointerEvent) => {
      if (!cursor.current || event.pointerType !== 'mouse' || !finePointer.matches) { hide(); return; }
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest('.public-site') || target.closest('input, textarea, select, dialog, [contenteditable="true"]')) { hide(); return; }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!cursor.current) return;
        cursor.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        cursor.current.dataset.interactive = enabled && target.closest('button, a') ? 'true' : 'false';
        cursor.current.dataset.surface = target.closest('.stage-frame, .role-panel-dark, .trust-section, .discovery-console, .signal-strip, .opportunity-card-featured') ? 'dark' : 'light';
        cursor.current.dataset.visible = 'true';
        // Hide the fallback only once the custom reticle is positioned and visible.
        root.dataset.cursor = 'ready';
      });
    };
    const focusChanged = (event: FocusEvent) => { if (event.target instanceof Element && event.target.closest('input, textarea, select, dialog, [contenteditable="true"]')) hide(); };
    const visibilityChanged = () => { if (document.hidden) hide(); };
    document.addEventListener('pointermove', handleMove, { passive: true });
    document.addEventListener('pointerleave', hide);
    document.addEventListener('focusin', focusChanged);
    document.addEventListener('visibilitychange', visibilityChanged);
    finePointer.addEventListener('change', hide);
    window.addEventListener('blur', hide);
    return () => {
      hide();
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerleave', hide);
      document.removeEventListener('focusin', focusChanged);
      document.removeEventListener('visibilitychange', visibilityChanged);
      finePointer.removeEventListener('change', hide);
      window.removeEventListener('blur', hide);
    };
  }, [enabled]);

  return <div ref={cursor} className="signal-cursor" aria-hidden="true" data-visible="false"><Crosshair size={28} strokeWidth={1.25} /></div>;
}

export function GlitchWord({ enabled }: { enabled: boolean }) {
  const [pulsing, setPulsing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = () => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    setPulsing(true);
    timer.current = setTimeout(() => setPulsing(false), 760);
  };

  useEffect(() => {
    if (!enabled) return;
    const intro = setTimeout(() => {
      setPulsing(true);
      timer.current = setTimeout(() => setPulsing(false), 760);
    }, 750);
    return () => {
      clearTimeout(intro);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled]);

  return <button type="button" onClick={pulse} onFocus={pulse} title="Tap to replay the signal effect"
    className={`glitch-word ${enabled && pulsing ? 'is-pulsing' : ''}`}>Keep it clear.</button>;
}
