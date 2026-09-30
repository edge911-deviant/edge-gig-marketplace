import { useEffect, useRef } from 'react';
import { ArrowRight, BriefcaseBusiness, Compass, LocateFixed, MapPin, Radio, X } from 'lucide-react';
import { motion } from 'motion/react';
import { demoCities } from './siteModel';
import { DemoScene } from './useDemoScene';

export function DiscoveryBoard({ enabled, scene, onJoin, joinLabel }: { enabled: boolean; scene: DemoScene; onJoin: () => void; joinLabel: string }) {
  const { city, mode, setMode, genre, setGenre, query, updateQuery, message, error, signals, selected, setSelected, selectCity, submitPlace, useDemoLocation, openSignal } = scene;
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [selected]);

  const close = () => dialog.current?.close();

  return (
    <>
      <div className="discovery-console">
        <div className="discovery-console-title"><span><Radio size={14} aria-hidden="true" />LOCAL_SIGNAL / DEMO</span><h3>Find your scene.</h3><p>Try local discovery before you join.</p></div>
        <form className="discovery-pin" onSubmit={submitPlace} noValidate>
          <label htmlFor="discovery-pin">PIN code or place</label>
          <div><input id="discovery-pin" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="700001 or Kolkata" autoComplete="postal-code" maxLength={64} aria-invalid={Boolean(error)} aria-describedby={error ? 'discovery-error discovery-pin-hint' : 'discovery-pin-hint'} /><button type="submit" aria-label="Find demo signals by PIN code or place"><ArrowRight size={20} aria-hidden="true" /></button></div>
          <small id="discovery-pin-hint">Demo PINs: 700001 · 400001 · 560001</small>
        </form>
        <button type="button" className="demo-location" onClick={useDemoLocation}><LocateFixed size={18} aria-hidden="true" /><span>Use demo location<small>Simulated · no permission needed</small></span></button>
      </div>
      {error && <p id="discovery-error" role="alert" className="discovery-error">{error}</p>}
      <div className="discovery-controls">
        <div className="discovery-modes" aria-label="Discovery view">
          <button type="button" aria-pressed={mode === 'work'} onClick={() => setMode('work')}><BriefcaseBusiness size={15} aria-hidden="true" />Performance work</button>
          <button type="button" aria-pressed={mode === 'shows'} onClick={() => setMode('shows')}><Compass size={15} aria-hidden="true" />Live shows</button>
        </div>
        <div className="discovery-cities" aria-label="Demo city">{demoCities.map((value) => <button type="button" key={value} aria-pressed={city === value} onClick={() => selectCity(value)}>{value}</button>)}</div>
      </div>
      <div className="discovery-sounds" aria-label="Genre filter">{['All sounds', 'Indie', 'Jazz', 'Electronic'].map((value) => <button type="button" key={value} aria-pressed={genre === value} onClick={() => setGenre(value)}>{value}</button>)}<span>{signals.length} demo {signals.length === 1 ? 'signal' : 'signals'} / {city}</span></div>
      <p className="discovery-status" role="status">{message}</p>
      <div className="opportunity-grid">
        {signals.map((signal, index) => (
          <motion.article initial={false} animate={enabled ? { opacity: 1, y: 0 } : undefined} key={`${mode}-${signal.id}`} className={`opportunity-card ${index === 0 ? 'opportunity-card-featured' : ''}`}>
            <div className="flex items-start justify-between gap-4"><div><span className="opportunity-index">{signal.id}</span><span className="opportunity-date">{signal.date}</span></div><span className="opportunity-genre">{signal.genre}</span></div>
            <div><h3>{mode === 'work' ? signal.title : signal.show}</h3><p><MapPin size={13} aria-hidden="true" />{signal.city} · {signal.venue}</p></div>
            <div className="opportunity-card-footer"><div><span className="section-kicker opacity-60">{mode === 'work' ? 'Artist fee' : 'Doors / demo'}</span><strong>{mode === 'work' ? signal.budget : signal.time}</strong></div><button type="button" onClick={() => openSignal(signal, mode)} aria-label={`${mode === 'work' ? 'View brief' : 'View show'}: ${mode === 'work' ? signal.title : signal.show}`}>{mode === 'work' ? 'View brief' : 'View show'}<ArrowRight size={17} aria-hidden="true" /></button></div>
          </motion.article>
        ))}
      </div>
      <p className="discovery-demo-note">Fictional listings for the pre-alpha preview. No application, ticket or booking is created here.</p>
      <dialog className="signal-dialog" ref={dialog} aria-labelledby="signal-dialog-title" onClose={() => setSelected(null)} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        {selected && <div className="signal-dialog-content">
          <div className="signal-dialog-top"><span>DEMO/{mode === 'work' ? 'BOOKING BRIEF' : 'LIVE SHOW'}</span><button type="button" aria-label="Close signal details" onClick={close}><X size={20} aria-hidden="true" /></button></div>
          <span className="signal-dialog-genre">{selected.genre} / {selected.city}</span>
          <h2 id="signal-dialog-title">{mode === 'work' ? selected.title : selected.show}</h2>
          <p className="signal-dialog-place"><MapPin size={16} aria-hidden="true" />{selected.venue} · {selected.date} · {selected.time}</p>
          <div className="signal-dialog-facts"><div><span>{mode === 'work' ? 'Artist fee' : 'Event status'}</span><strong>{mode === 'work' ? selected.budget : 'Demo preview'}</strong></div><div><span>Performance</span><strong>{selected.duration}</strong></div></div>
          <p className="signal-dialog-brief">{mode === 'work' ? selected.brief : `A ${selected.genre.toLowerCase()} night at ${selected.venue}. EDGE is building local discovery so audiences can find artists and host-published shows in the same network where bookings happen.`}</p>
          <p className="signal-dialog-note">This is a fictional preview. Real bookings require an account; public event publishing and ticketing are still being developed.</p>
          <button type="button" className="signal-dialog-join" onClick={() => { close(); onJoin(); }}>{joinLabel}<ArrowRight size={18} aria-hidden="true" /></button>
        </div>}
      </dialog>
    </>
  );
}
