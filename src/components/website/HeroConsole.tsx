import { KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Circle, MapPin, Pause, Play, Radio, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, useInView, useMotionValue, useSpring } from 'motion/react';
import { SiteRole, bookingJourney, demoCities, getSiteRoleRoute, siteRoles } from './siteModel';
import { DemoScene } from './useDemoScene';

const heroArtwork: Record<SiteRole, { src: string; alt: string; position: string }> = {
  artist: {
    src: `${import.meta.env.BASE_URL}edge-live-artist.jpg`,
    alt: 'A band performing in a dimly lit independent venue',
    position: '58% center',
  },
  organiser: {
    src: `${import.meta.env.BASE_URL}edge-live-organiser.jpg`,
    alt: 'A live-event production team working at a concert control desk',
    position: '63% center',
  },
  venue: {
    src: `${import.meta.env.BASE_URL}edge-live-venue.jpg`,
    alt: 'Instruments and amplifiers prepared for a venue soundcheck',
    position: '58% center',
  },
  audience: {
    src: `${import.meta.env.BASE_URL}edge-live-audience.jpg`,
    alt: 'A concert audience with hands raised toward the stage',
    position: '61% center',
  },
};
const journeyArtwork: SiteRole[] = ['organiser', 'artist', 'venue', 'audience'];
const modes = [
  { id: 'roles', label: 'Your role', number: '01' },
  { id: 'journey', label: 'Brief → show', number: '02' },
  { id: 'nearby', label: 'Nearby', number: '03' },
] as const;
type HeroMode = (typeof modes)[number]['id'];
type SignalPoint = { x: number; y: number };
type RolePoints = Record<SiteRole, SignalPoint>;
type TravellerState = { run: number; points: SignalPoint[]; target: SiteRole; moving: boolean };

export function HeroConsole({ enabled, role, onRoleChange, scene, onGuideMount }: {
  enabled: boolean; role: SiteRole; onRoleChange: (role: SiteRole) => void; scene: DemoScene; onGuideMount: (slot: HTMLDivElement | null) => void;
}) {
  const [mode, setMode] = useState<HeroMode>('roles');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [eventId, setEventId] = useState('');
  const [signal, setSignal] = useState(0);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [displayedArtworkRole, setDisplayedArtworkRole] = useState<SiteRole>(role);
  const [rolePoints, setRolePoints] = useState<RolePoints | null>(null);
  const [traveller, setTraveller] = useState<TravellerState>({ run: 0, points: [], target: role, moving: false });
  const module = useRef<HTMLDivElement>(null);
  const stageFrame = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const roleRefs = useRef<Partial<Record<SiteRole, HTMLButtonElement | null>>>({});
  const inView = useInView(module, { amount: 0.15 });
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const imageX = useSpring(x, { stiffness: 100, damping: 30 });
  const imageY = useSpring(y, { stiffness: 100, damping: 30 });
  const selectedRole = siteRoles.find((item) => item.id === role)!;
  const journey = bookingJourney[step];
  const selectedEvent = scene.signals.find((item) => item.id === eventId) ?? scene.signals[0];
  const artworkRole = mode === 'journey' ? journeyArtwork[step] : mode === 'nearby' ? 'audience' : displayedArtworkRole;
  const artwork = heroArtwork[artworkRole];
  const travellerStart = traveller.points[0];
  const travellerEnd = traveller.points[traveller.points.length - 1];

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!enabled || !inView || !pageVisible || mode !== 'journey') setPlaying(false);
  }, [enabled, inView, pageVisible, mode]);
  useEffect(() => {
    if (!playing || !enabled || !inView || !pageVisible || mode !== 'journey') return;
    const timer = setTimeout(() => {
      if (step < bookingJourney.length - 1) setStep((value) => value + 1);
      else setPlaying(false);
    }, 2600);
    return () => clearTimeout(timer);
  }, [playing, enabled, inView, pageVisible, mode, step]);
  useLayoutEffect(() => {
    if (mode !== 'roles' || !stageFrame.current) {
      setRolePoints(null);
      return;
    }
    const frame = stageFrame.current;
    const measure = () => {
      const frameBounds = frame.getBoundingClientRect();
      const measured = {} as RolePoints;
      for (const item of siteRoles) {
        const dot = roleRefs.current[item.id]?.querySelector('svg');
        if (!dot) return;
        const bounds = dot.getBoundingClientRect();
        measured[item.id] = {
          x: bounds.left - frameBounds.left + bounds.width / 2,
          y: bounds.top - frameBounds.top + bounds.height / 2,
        };
      }
      setRolePoints(measured);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [mode]);
  useEffect(() => {
    if (mode !== 'roles') {
      setDisplayedArtworkRole(role);
      return;
    }
    if (!rolePoints) return;
    const route = getSiteRoleRoute(displayedArtworkRole, role).map((routeRole) => rolePoints[routeRole]);
    const moving = enabled && route.length > 1;
    setTraveller((current) => ({ run: current.run + 1, points: route, target: role, moving }));
    if (!moving) setDisplayedArtworkRole(role);
  }, [enabled, mode, role, rolePoints]);

  const chooseMode = (value: HeroMode) => { setMode(value); setPlaying(false); setSignal((value) => value + 1); };
  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % modes.length;
    else if (event.key === 'ArrowLeft') next = (index + modes.length - 1) % modes.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = modes.length - 1;
    else return;
    event.preventDefault(); chooseMode(modes[next].id); tabRefs.current[next]?.focus();
  };
  const startJourney = () => {
    if (playing) { setPlaying(false); return; }
    setStep(0); setPlaying(true); setSignal((value) => value + 1);
  };
  const traceKey = `${mode}-${role}-${step}-${scene.city}-${scene.order}-${eventId}-${signal}`;
  const showBoard = () => scene.setMode('shows');

  return (
    <div className="stage-module" ref={module} data-stage-mode={mode}>
      <div className="stage-tabs" role="tablist" aria-label="Explore EDGE">
        {modes.map((item, index) => <button type="button" role="tab" key={item.id} id={`stage-tab-${item.id}`} aria-selected={mode === item.id}
          aria-controls={`stage-panel-${item.id}`} tabIndex={mode === item.id ? 0 : -1} ref={(element) => { tabRefs.current[index] = element; }}
          onKeyDown={(event) => moveTab(event, index)} onClick={() => chooseMode(item.id)}><span aria-hidden="true">{item.number}</span>{item.label}</button>)}
      </div>
      {modes.filter((item) => item.id !== mode).map((item) => <div key={item.id} id={`stage-panel-${item.id}`} role="tabpanel" aria-labelledby={`stage-tab-${item.id}`} hidden />)}
      <div id={`stage-panel-${mode}`} role="tabpanel" aria-labelledby={`stage-tab-${mode}`}>
        <div className="hero-visual stage-frame" ref={stageFrame} onPointerMove={(event) => {
          if (!enabled || event.pointerType !== 'mouse' || !window.matchMedia('(pointer: fine)').matches) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 6);
          y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 6);
        }} onPointerLeave={() => { x.set(0); y.set(0); }}>
          <div className="stage-artwork" role="img" aria-label={artwork.alt}>
            <AnimatePresence initial={false}>
              <motion.img key={artworkRole} src={artwork.src} alt="" draggable={false}
                initial={enabled ? { opacity: 0 } : false}
                animate={{ opacity: 1, scale: 1.018 }}
                exit={enabled ? { opacity: 0 } : undefined}
                transition={{ duration: enabled ? 0.3 : 0, ease: 'easeOut' }}
                style={{ x: enabled ? imageX : 0, y: enabled ? imageY : 0, objectPosition: artwork.position }} />
            </AnimatePresence>
          </div>
          <div className="stage-photo-shade" />
          {mode !== 'roles' && <motion.div key={traceKey} className={`stage-edge-trace stage-edge-trace-${mode}`} aria-hidden="true"
            initial={enabled ? { scaleY: 0, opacity: 0.2 } : false}
            animate={{ scaleY: 1, opacity: 1 }} transition={{ duration: enabled ? 0.55 : 0, ease: 'easeOut' }} />}
          {mode === 'roles' && <>
            {rolePoints && <>
              <span className="stage-role-wire stage-role-wire-horizontal" aria-hidden="true" style={{ left: rolePoints.artist.x, top: rolePoints.artist.y, width: rolePoints.organiser.x - rolePoints.artist.x }} />
              <span className="stage-role-wire stage-role-wire-vertical" aria-hidden="true" style={{ left: rolePoints.organiser.x, top: rolePoints.organiser.y, height: rolePoints.audience.y - rolePoints.organiser.y }} />
            </>}
            {travellerStart && travellerEnd && <motion.span key={traveller.run} className="stage-role-traveller" data-role-signal={traveller.target} aria-hidden="true"
              initial={{ x: travellerStart.x, y: travellerStart.y, opacity: 1 }}
              animate={traveller.moving ? { x: traveller.points.map((point) => point.x), y: traveller.points.map((point) => point.y), opacity: 1 } : { x: travellerEnd.x, y: travellerEnd.y, opacity: 1 }}
              transition={traveller.moving ? { duration: Math.max(0.42, (traveller.points.length - 1) * 0.42), times: traveller.points.map((_, index) => index / (traveller.points.length - 1)), ease: 'easeInOut' } : { duration: 0 }}
              onAnimationComplete={() => { if (traveller.moving && traveller.target === role) setDisplayedArtworkRole(traveller.target); }} />}
            <p className="stage-instruction">Choose your place<br />in EDGE</p>
            <div className="stage-role-controls" aria-label="Hero profile roles">
              {siteRoles.map((item) => <button type="button" key={item.id} className={`stage-role-node stage-role-${item.id}`} aria-pressed={role === item.id}
                aria-controls="stage-role-detail" ref={(element) => { roleRefs.current[item.id] = element; }}
                onClick={() => { onRoleChange(item.id); setSignal((value) => value + 1); }}><Circle size={20} aria-hidden="true" /><span>{item.label}</span></button>)}
            </div>
            <div className="stage-photo-caption"><span>Four sides. One live-performance network.</span><p>The people make the connection.</p></div>
          </>}
          {mode === 'journey' && <div className="stage-rail stage-journey-rail">
            <p className="stage-rail-kicker">Demo journey / tap a step</p>
            <ol aria-label="Booking journey steps">
              {bookingJourney.map((item, index) => <li key={item.label} data-complete={index < step}><button type="button" aria-pressed={step === index}
                aria-controls="stage-journey-detail" onClick={() => { setStep(index); setPlaying(false); setSignal((value) => value + 1); }}><Circle size={18} aria-hidden="true" /><span><small>0{index + 1}</small>{item.label}</span></button></li>)}
            </ol>
            <button type="button" className="stage-play" onClick={startJourney} disabled={!enabled} aria-pressed={playing}>{playing ? <Pause size={14} aria-hidden="true" /> : step === 3 ? <RotateCcw size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}{playing ? 'Pause journey' : step === 3 ? 'Replay journey' : 'Play journey'}</button>
          </div>}
          {mode === 'nearby' && <div className="stage-rail stage-event-rail">
            <p className="stage-rail-kicker"><MapPin size={12} aria-hidden="true" />{scene.city} / fictional shows</p>
            <div className="stage-timeline-heading"><strong>{scene.signals.length} demo {scene.signals.length === 1 ? 'show' : 'shows'}</strong><label className="sr-only" htmlFor="hero-date-order">Show date order</label><select id="hero-date-order" value={scene.order} onChange={(event) => scene.setOrder(event.target.value === 'latest' ? 'latest' : 'soonest')}><option value="soonest">Soonest first</option><option value="latest">Latest first</option></select></div>
            <ol aria-label={`${scene.city} demo shows by date`}>
              {scene.signals.slice(0, 3).map((item) => <li key={item.id}><button type="button" aria-pressed={selectedEvent?.id === item.id} aria-controls="stage-show-detail"
                onClick={() => { setEventId(item.id); setSignal((value) => value + 1); }}><Circle size={16} aria-hidden="true" /><span><time dateTime={item.dateISO}>{item.date} 2026</time><strong>{item.show}</strong><small>{item.genre}</small></span></button></li>)}
            </ol>
            {!scene.signals.length && <p className="stage-empty">No sample shows match this filter.<button type="button" onClick={() => scene.setGenre('All sounds')}>Show all sounds</button></p>}
            <a href="#opportunities" className="stage-timeline-end" onClick={showBoard}>{scene.signals.length > 3 ? 'Check out more' : 'End of sample · explore the board'}<ArrowRight size={13} aria-hidden="true" /></a>
            {scene.genre !== 'All sounds' && <button type="button" className="stage-filter-reset" onClick={() => scene.setGenre('All sounds')}>Clear {scene.genre} filter</button>}
          </div>}
          <span className="stage-frame-code" aria-hidden="true">EDGE / {mode === 'roles' ? 'CONNECTED ROLES' : mode === 'journey' ? 'BOOKING PROTOCOL' : 'LOCAL DEMO'}</span>
        </div>
        <div className="stage-footer-row"><div className="stage-footer">
          {mode === 'roles' && <div className="stage-detail" id="stage-role-detail" aria-live="polite" aria-atomic="true">
            <motion.div key={role} initial={enabled ? { opacity: 0.4, y: 5 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: enabled ? 0.22 : 0 }}><span className="stage-detail-code">{selectedRole.label} / {selectedRole.verb}</span><h2>{selectedRole.headline}</h2><p>{selectedRole.detail}</p></motion.div>
            <a href={`#role-${role}`} className="stage-action">{selectedRole.action}<ArrowRight size={16} aria-hidden="true" /></a>
          </div>}
          {mode === 'journey' && <>
            <div className="stage-detail" id="stage-journey-detail" aria-live="polite" aria-atomic="true">
              <motion.div key={step} initial={enabled ? { opacity: 0.4, y: 5 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: enabled ? 0.22 : 0 }}><span className="stage-detail-code">0{step + 1} / {journey.owner}</span><h2>{journey.title}</h2><p>{journey.detail}</p></motion.div>
              {step === 0 ? <button type="button" className="stage-action" onClick={() => { if (scene.signals[0]) scene.openSignal(scene.signals[0], 'work'); }} disabled={!scene.signals.length}>{journey.action}<ArrowRight size={16} aria-hidden="true" /></button>
                : <a href={step === 1 ? '#role-artist' : step === 2 ? '#how-it-works' : '#opportunities'} onClick={step === 3 ? showBoard : undefined} className="stage-action">{journey.action}<ArrowRight size={16} aria-hidden="true" /></a>}
            </div>
            <p className="stage-output"><Radio size={12} aria-hidden="true" />{journey.output}<span>Illustrated product journey, not a real booking.</span></p>
          </>}
          {mode === 'nearby' && <>
            <form className="stage-place-form" onSubmit={scene.submitPlace} noValidate><div><label htmlFor="hero-place">PIN code or place</label><input id="hero-place" value={scene.query} onChange={(event) => scene.updateQuery(event.target.value)} placeholder="700001 or Kolkata" maxLength={64} autoComplete="postal-code" aria-invalid={Boolean(scene.error)} aria-describedby={`hero-place-hint${scene.error ? ' hero-place-error' : ''}`} /></div><button type="submit" className="stage-action">Find demo shows<ArrowRight size={16} aria-hidden="true" /></button></form>
            <div className="stage-city-shortcuts" aria-label="Hero demo cities">{demoCities.map((city) => <button type="button" key={city} aria-pressed={scene.city === city} onClick={() => scene.selectCity(city)}>{city}</button>)}</div>
            <p id="hero-place-hint" className="stage-place-hint">Demo PINs: 700001 · 400001 · 560001 · No GPS</p>
            {scene.error && <p id="hero-place-error" className="stage-place-error" role="alert">{scene.error}</p>}
            <div className="stage-show-detail" id="stage-show-detail" aria-live="polite" aria-atomic="true">{selectedEvent ? <><p><strong>{selectedEvent.show}</strong><span>{selectedEvent.venue} · {selectedEvent.time}</span></p><button type="button" onClick={() => scene.openSignal(selectedEvent, 'shows')}>View demo show<ArrowRight size={14} aria-hidden="true" /></button></> : <p>No sample show selected.</p>}</div>
            <p className="sr-only" role="status">{scene.message}</p>
          </>}
        </div><div id="hero-guide-slot" className="stage-guide-slot" ref={onGuideMount} /></div>
      </div>
      <p className="stage-module-note">Choose a role, follow a booking, or explore a demo scene.</p>
    </div>
  );
}
