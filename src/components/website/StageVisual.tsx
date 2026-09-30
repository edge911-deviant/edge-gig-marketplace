import { useEffect, useRef, useState } from 'react';
import { MapPin, Radio, RotateCcw } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const HERO_IMAGE_SRC = `${import.meta.env.BASE_URL}edge-live-stage.png`;

// A decorative projected wireframe, not a network monitor or location sensor.
function StageGeometry({ enabled, pulse }: { enabled: boolean; pulse: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pulseStarted = useRef(0);
  useEffect(() => { pulseStarted.current = performance.now(); }, [pulse]);

  useEffect(() => {
    const surface = canvas.current;
    const context = surface?.getContext('2d');
    if (!surface || !context) return;
    let frame = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    const resize = () => {
      const bounds = surface.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = width * ratio;
      surface.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const vertices = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const angle = enabled ? time / 14000 : 0.55;
      const size = Math.min(width * 0.28, height * 0.25, 170);
      const centreX = width * 0.34;
      const centreY = height * 0.48;
      const boost = enabled && pulse > 0 ? Math.max(0, 1 - (time - pulseStarted.current) / 1400) : 0;
      for (let shell = 0; shell < 2; shell++) {
        const scale = shell === 0 ? 1 : 0.56;
        const rotation = angle * (shell === 0 ? 1 : -1.4);
        const points = vertices.map(([x,y,z]) => {
          const rx = x * Math.cos(rotation) - z * Math.sin(rotation);
          const rz = x * Math.sin(rotation) + z * Math.cos(rotation);
          const ry = y * Math.cos(0.42) - rz * Math.sin(0.42);
          const depth = y * Math.sin(0.42) + rz * Math.cos(0.42);
          const perspective = 3.8 / (3.8 + depth * scale);
          return [centreX + rx * size * scale * perspective, centreY + ry * size * scale * perspective];
        });
        context.lineWidth = shell === 0 ? 1 : 0.8;
        context.strokeStyle = `rgba(216,255,62,${(shell === 0 ? 0.52 : 0.3) + boost * 0.3})`;
        edges.forEach(([a,b]) => {
          context.beginPath(); context.moveTo(points[a][0], points[a][1]); context.lineTo(points[b][0], points[b][1]); context.stroke();
        });
        points.forEach(([x,y], index) => {
          context.fillStyle = index % 3 === 0 ? '#d8ff3e' : 'rgba(255,255,255,0.65)';
          context.fillRect(x - 2, y - 2, 4, 4);
        });
      }
      if (boost > 0) {
        context.beginPath();
        context.arc(centreX, centreY, size * (1.3 + (1 - boost) * 0.8), 0, Math.PI * 2);
        context.strokeStyle = `rgba(216,255,62,${boost * 0.45})`;
        context.stroke();
      }
      if (enabled && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frame); if (visible && !document.hidden) frame = requestAnimationFrame(draw); };
    const observer = new ResizeObserver(() => { resize(); restart(); });
    observer.observe(surface);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; restart(); });
    intersection.observe(surface);
    document.addEventListener('visibilitychange', restart);
    resize(); restart();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', restart); };
  }, [enabled, pulse]);
  return <canvas ref={canvas} className="stage-geometry" aria-hidden="true" />;
}

export function StageVisual({ enabled }: { enabled: boolean }) {
  const [pulse, setPulse] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const imageX = useSpring(x, { stiffness: 70, damping: 25 });
  const imageY = useSpring(y, { stiffness: 70, damping: 25 });

  return (
    <motion.div initial={enabled ? { opacity: 0, scale: 0.985 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}
      className="hero-visual" onPointerMove={(event) => {
        if (!enabled || event.pointerType !== 'mouse' || !window.matchMedia('(pointer: fine)').matches) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 12);
        y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 12);
      }} onPointerLeave={() => { x.set(0); y.set(0); }}>
      <motion.img src={HERO_IMAGE_SRC} alt="An independent band performing to a crowd in an intimate venue" style={{ x: enabled ? imageX : 0, y: enabled ? imageY : 0, scale: 1.035 }} />
      <div className="hero-image-shade" />
      <StageGeometry enabled={enabled} pulse={pulse} />
      <div className="hero-frame-meta" aria-hidden="true"><span>FRAME_01</span><span>STAGE//SIGNAL</span><span>EDGE//LIVE</span></div>
      <div className="hero-image-label"><span className="font-mono text-[9px] font-bold uppercase tracking-[0.26em] text-white/60">A stage. A crowd. A clear connection.</span><p>Where the next show becomes a real booking.</p></div>
      <div className="hero-floating-card">
        <div className="flex items-center justify-between"><span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Demo opportunity</span><Radio size={14} className="text-emerald-600" aria-hidden="true" /></div>
        <h2>Alt-rock support slot</h2><p><MapPin size={12} aria-hidden="true" />Kolkata · 18 Oct · ₹18,000</p>
      </div>
      <div className="hero-scene-toolbar"><span>STAGE_VISUAL / 01</span><button type="button" onClick={() => setPulse((value) => value + 1)} disabled={!enabled} aria-label="Replay stage signal pulse"><RotateCcw size={13} aria-hidden="true" />Send a pulse</button></div>
    </motion.div>
  );
}
