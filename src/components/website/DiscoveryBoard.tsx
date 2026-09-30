import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, Compass, LocateFixed, MapPin, Radio, X } from 'lucide-react';
import { motion } from 'motion/react';

type City = 'Kolkata' | 'Mumbai' | 'Bengaluru';
type DiscoveryMode = 'work' | 'shows';
type DemoSignal = { id: string; city: City; venue: string; genre: string; date: string; time: string; title: string; show: string; budget: string; brief: string; duration: string };

// Public, fictional POC inventory. Never mix these records with authenticated gigs.
const demoSignals: DemoSignal[] = [
  { id: 'CAL/01', city: 'Kolkata', venue: 'The Black Box', genre: 'Indie', date: '18 OCT', time: '7:30 PM', title: 'Indie night support act', show: 'The city after dark', budget: '₹18,000', brief: 'A 45-minute opening set for a small-room indie night. Original material preferred; share a live performance link and your stage setup.', duration: '45-minute set' },
  { id: 'CAL/02', city: 'Kolkata', venue: 'Park Street Sessions', genre: 'Jazz', date: '24 OCT', time: '8:00 PM', title: 'Late-night jazz trio', show: 'Blue hour sessions', budget: '₹24,000', brief: 'A three-piece jazz set for a seated listening room. Piano and house PA available. Include lineup, repertoire and technical needs.', duration: 'Two 40-minute sets' },
  { id: 'CAL/03', city: 'Kolkata', venue: 'Warehouse 07', genre: 'Electronic', date: '31 OCT', time: '9:00 PM', title: 'Electronic live opener', show: 'Signal / after hours', budget: '₹20,000', brief: 'A live electronic opening slot. Share your setup, a recent live recording and the inputs needed for a quick stage change.', duration: '60-minute set' },
  { id: 'BOM/01', city: 'Mumbai', venue: 'Lower Parel Rooftop', genre: 'Jazz', date: '02 NOV', time: '7:00 PM', title: 'Rooftop jazz trio', show: 'Jazz above the city', budget: '₹32,000', brief: 'An evening rooftop jazz programme. Acoustic or lightly amplified trio; include lineup and a live recording. House PA supplied.', duration: 'Two 45-minute sets' },
  { id: 'BOM/02', city: 'Mumbai', venue: 'Bandra Listening Room', genre: 'Indie', date: '08 NOV', time: '8:00 PM', title: 'Acoustic indie duo', show: 'Songs from the west', budget: '₹22,000', brief: 'Original songs for an intimate listening room. A duo or solo act with an acoustic setup. Share repertoire and stage requirements.', duration: '50-minute set' },
  { id: 'BOM/03', city: 'Mumbai', venue: 'Dockside Studio', genre: 'Electronic', date: '14 NOV', time: '9:30 PM', title: 'Hardware live set', show: 'Dockside frequencies', budget: '₹28,000', brief: 'A hardware-led electronic set. Include a live link, equipment list, input count and changeover time.', duration: '60-minute set' },
  { id: 'BLR/01', city: 'Bengaluru', venue: 'Indiranagar Sessions', genre: 'Electronic', date: '15 NOV', time: '8:30 PM', title: 'Electronic live set', show: 'Frequency / Bengaluru', budget: '₹25,000', brief: 'A live electronic set in a standing room. Share a performance recording, stage footprint and a concise technical rider.', duration: '60-minute set' },
  { id: 'BLR/02', city: 'Bengaluru', venue: 'Church Street Room', genre: 'Indie', date: '21 NOV', time: '7:30 PM', title: 'Original indie showcase', show: 'New voices / south', budget: '₹20,000', brief: 'A showcase slot for original indie artists. Solo, duo and small bands welcome. Include your lineup and a live performance link.', duration: '40-minute set' },
  { id: 'BLR/03', city: 'Bengaluru', venue: 'The Sunday Lounge', genre: 'Jazz', date: '29 NOV', time: '6:00 PM', title: 'Sunday jazz quartet', show: 'A slower Sunday', budget: '₹30,000', brief: 'A Sunday jazz programme for a seated audience. Share the quartet lineup, a recent recording and instrument requirements.', duration: 'Two 45-minute sets' },
];
const cities: City[] = ['Kolkata', 'Mumbai', 'Bengaluru'];
const demoPins: Record<string, City> = { '700001': 'Kolkata', '400001': 'Mumbai', '560001': 'Bengaluru' };

export function DiscoveryBoard({ enabled, onJoin, joinLabel }: { enabled: boolean; onJoin: () => void; joinLabel: string }) {
  const [city, setCity] = useState<City>('Kolkata');
  const [mode, setMode] = useState<DiscoveryMode>('work');
  const [genre, setGenre] = useState('All sounds');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('Showing a sample Kolkata scene. Choose a city or try a demo PIN.');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<DemoSignal | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const signals = demoSignals.filter((signal) => signal.city === city && (genre === 'All sounds' || signal.genre === genre));

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [selected]);

  const selectCity = (value: City) => {
    setCity(value); setPin(''); setError('');
    setMessage(`Sample scene set to ${value}. These are fictional product previews.`);
  };
  const findByPin = (event: FormEvent) => {
    event.preventDefault();
    const value = pin.trim();
    if (!/^[1-9]\d{5}$/.test(value)) { setError('Enter a six-digit PIN code, such as 700001.'); return; }
    const match = demoPins[value];
    if (!match) { setError('This demo supports 700001, 400001 and 560001. You can also choose a city below.'); return; }
    setCity(match); setError(''); setMessage(`Demo PIN ${value} selected ${match}. No device location was requested.`);
  };
  const close = () => dialog.current?.close();

  return (
    <>
      <div className="discovery-console">
        <div className="discovery-console-title"><span><Radio size={14} aria-hidden="true" />LOCAL_SIGNAL / DEMO</span><h3>Find your scene.</h3><p>Try local discovery before you join.</p></div>
        <form className="discovery-pin" onSubmit={findByPin} noValidate>
          <label htmlFor="discovery-pin">Your PIN code</label>
          <div><input id="discovery-pin" value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} placeholder="Try 700001" inputMode="numeric" autoComplete="postal-code" maxLength={6} aria-invalid={Boolean(error)} aria-describedby={error ? 'discovery-error discovery-pin-hint' : 'discovery-pin-hint'} /><button type="submit" aria-label="Find demo signals by PIN code"><ArrowRight size={20} aria-hidden="true" /></button></div>
          <small id="discovery-pin-hint">Demo PINs: 700001 · 400001 · 560001</small>
        </form>
        <button type="button" className="demo-location" onClick={() => { setCity('Kolkata'); setPin('700001'); setError(''); setMessage('Demo location set to Kolkata. No device location was requested or stored.'); }}><LocateFixed size={18} aria-hidden="true" /><span>Use demo location<small>Simulated · no permission needed</small></span></button>
      </div>
      {error && <p id="discovery-error" role="alert" className="discovery-error">{error}</p>}
      <div className="discovery-controls">
        <div className="discovery-modes" aria-label="Discovery view">
          <button type="button" aria-pressed={mode === 'work'} onClick={() => setMode('work')}><BriefcaseBusiness size={15} aria-hidden="true" />Performance work</button>
          <button type="button" aria-pressed={mode === 'shows'} onClick={() => setMode('shows')}><Compass size={15} aria-hidden="true" />Live shows</button>
        </div>
        <div className="discovery-cities" aria-label="Demo city">{cities.map((value) => <button type="button" key={value} aria-pressed={city === value} onClick={() => selectCity(value)}>{value}</button>)}</div>
      </div>
      <div className="discovery-sounds" aria-label="Genre filter">{['All sounds', 'Indie', 'Jazz', 'Electronic'].map((value) => <button type="button" key={value} aria-pressed={genre === value} onClick={() => setGenre(value)}>{value}</button>)}<span>{signals.length} demo {signals.length === 1 ? 'signal' : 'signals'} / {city}</span></div>
      <p className="discovery-status" role="status">{message}</p>
      <div className="opportunity-grid">
        {signals.map((signal, index) => (
          <motion.article initial={false} animate={enabled ? { opacity: 1, y: 0 } : undefined} key={`${mode}-${signal.id}`} className={`opportunity-card ${index === 0 ? 'opportunity-card-featured' : ''}`}>
            <div className="flex items-start justify-between gap-4"><div><span className="opportunity-index">{signal.id}</span><span className="opportunity-date">{signal.date}</span></div><span className="opportunity-genre">{signal.genre}</span></div>
            <div><h3>{mode === 'work' ? signal.title : signal.show}</h3><p><MapPin size={13} aria-hidden="true" />{signal.city} · {signal.venue}</p></div>
            <div className="opportunity-card-footer"><div><span className="section-kicker opacity-60">{mode === 'work' ? 'Artist fee' : 'Doors / demo'}</span><strong>{mode === 'work' ? signal.budget : signal.time}</strong></div><button type="button" onClick={() => setSelected(signal)} aria-label={`${mode === 'work' ? 'View brief' : 'View show'}: ${mode === 'work' ? signal.title : signal.show}`}>{mode === 'work' ? 'View brief' : 'View show'}<ArrowRight size={17} aria-hidden="true" /></button></div>
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
