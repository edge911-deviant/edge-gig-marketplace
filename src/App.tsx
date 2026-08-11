/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Briefcase, User as UserIcon,
  MapPin, DollarSign, Calendar, Star,
  ArrowRight, X, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection, addDoc, query, where,
  onSnapshot, doc, getDocFromServer
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Gig, Application, UserRole, UserProfile } from './types';
import { Haptics } from './lib/haptics';
import { GIG_GENRES, filterGigs } from './lib/gigFilters';
import {
  ApplicationDecision,
  MarketplaceOperationError,
  cancelGig,
  completeGig,
  markArtistNoShow,
  submitApplication,
  updateApplicationDecision,
} from './lib/applications';
import { ArtistApplications } from './components/ArtistApplications';
import { ProfileScreen } from './components/ProfileScreen';
import { ReviewForm } from './components/ReviewForm';
import { MarketplaceTelemetry, useMarketplaceTelemetry } from './hooks/useMarketplaceTelemetry';

const EDGE_MARK_SRC = `${import.meta.env.BASE_URL}edge-app-icon-transparent.png`;

// This file contains the app's screens and reusable UI components.
// Most visible behavior can be traced from a button here to a Firestore
// operation in the same component or to AuthContext.

// --- Decorative / shared components ---

const MarketplacePulse = ({ activeGigs, registeredArtists }: MarketplaceTelemetry) => (
  <div className="flex items-center space-x-6 py-4 px-2 border-y border-black/5 mb-8">
    <div className="flex flex-col">
      <span className="col-header opacity-100 mb-1">Active Gigs</span>
      <div className="flex items-center">
        <span className="data-value text-xl mr-2">{activeGigs ?? '—'}</span>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      </div>
    </div>
    <div className="flex flex-col border-l border-black/5 pl-6">
      <span className="col-header opacity-100 mb-1">Registered Artists</span>
      <span className="data-value text-xl">{registeredArtists ?? '—'}</span>
    </div>
    <div className="flex flex-col border-l border-black/5 pl-6">
      <span className="col-header opacity-100 mb-1">Signal Intensity</span>
      <div className="flex items-end space-x-0.5 h-4 mb-0.5">
        {[20, 60, 40, 90, 30].map((h, i) => (
          <div key={i} className="w-1 bg-black/10 rounded-full" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  </div>
);

const ActivityTicker = ({ recentGigs }: Pick<MarketplaceTelemetry, 'recentGigs'>) => {
  const activity = recentGigs.length > 0
    ? recentGigs.map((gig) => `NEW GIG: ${gig.title} / ${gig.location} / ${gig.status}`).join(' • ')
    : 'MARKETPLACE READY / WAITING FOR NEW GIG SIGNALS';
  return <div className="bg-black text-white py-2 overflow-hidden whitespace-nowrap border-b border-white/5 relative z-50">
    <motion.div
      animate={{ x: [0, -1000] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      className="inline-block"
    >
      <span className="mx-8 font-mono text-[9px] uppercase tracking-[0.3em] font-bold opacity-50">• {activity} •</span>
      <span className="mx-8 font-mono text-[9px] uppercase tracking-[0.3em] font-bold opacity-50">• {activity} •</span>
    </motion.div>
  </div>;
};

const StatusBar = () => (
  // The clock is real; the signal/frequency/battery indicators are visual styling.
  <div className="px-10 py-4 flex justify-between items-center relative z-50 border-b border-black/5 bg-white/50 backdrop-blur-md">
    <div className="flex items-center space-x-4">
      <span className="font-mono text-[9px] font-bold tracking-widest text-slate-400">EDGE_01</span>
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4].map(i => <div key={i} className={`w-0.5 h-2 rounded-full ${i <= 3 ? 'bg-black' : 'bg-black/10'}`} />)}
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <span className="font-mono text-[9px] font-bold text-slate-400">2.4 GHz</span>
      <div className="w-8 h-3.5 border border-black/20 rounded-sm p-0.5 flex items-center">
        <div className="h-full w-4/5 bg-emerald-500 rounded-[1px]" />
      </div>
      <span className="font-mono text-[10px] font-black">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
    </div>
  </div>
);

const LiveRadar = ({ activeGigs }: Pick<MarketplaceTelemetry, 'activeGigs'>) => (
  <div className="relative w-full h-40 overflow-hidden rounded-[2.5rem] bg-black mb-8 border border-white/5 group">
    <div className="absolute inset-0 flex items-center justify-center opacity-20">
      <div className="w-64 h-64 border border-emerald-500/30 rounded-full animate-ping" />
      <div className="w-40 h-40 border border-emerald-500/20 rounded-full" />
      <div className="w-20 h-20 border border-emerald-500/10 rounded-full" />
    </div>
    <div className="absolute top-4 left-6">
      <span className="col-header text-white font-mono text-[8px] tracking-[0.4em] opacity-40">Radar_Scan_Active</span>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center group-hover:scale-110 transition-transform">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="w-32 h-32 border-t-2 border-emerald-500/40 rounded-full" />
      </div>
    </div>
    <div className="absolute bottom-4 right-6 flex items-center space-x-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="font-mono text-[8px] text-emerald-500 font-bold tracking-widest">{activeGigs ?? '—'} OPEN SIGNALS</span>
    </div>
  </div>
);

interface EBState { hasError: boolean; error: any; }
interface EBProps { children: React.ReactNode; }

class ErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("[App] Fatal Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <X size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-slate-500 mb-6 text-sm">The application encountered a fatal error.</p>
          <pre className="p-4 bg-slate-50 rounded-xl text-left text-xs text-red-400 overflow-auto max-w-full mb-6">
            {error?.message || 'Unknown error'}
          </pre>
          <button onClick={() => window.location.reload()} className="btn-primary">Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingScreen = ({
  label = 'System_Initializing',
  detail = 'Establishing secure session...',
}: {
  label?: string;
  detail?: string;
}) => (
  <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6 bg-white relative overflow-hidden">
    <div className="scanline" />
    <motion.div
      initial={{ opacity: 0, scale: 0.86, rotate: -12 }}
      animate={{ opacity: 1, scale: 1, rotate: 10 }}
      transition={{ type: 'spring', damping: 18 }}
    >
      <EdgeMark size="md" />
    </motion.div>
    <div className="space-y-2 relative z-10">
      <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-slate-400">{label}</p>
      <p className="text-xs font-semibold text-slate-500">{detail}</p>
    </div>
    <motion.div
      className="h-1 w-32 overflow-hidden rounded-full bg-slate-100"
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      <motion.div
        className="h-full w-1/2 bg-black"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  </div>
);

// The tilted terminal is EDGE's primary brand mark. Keep the same geometry
// across the auth screen and signed-in surfaces so the app icon feels like a
// real identity rather than a one-off decoration.
const EdgeMark = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <img
    src={EDGE_MARK_SRC}
    className={`edge-mark edge-mark-${size}`}
    alt="EDGE"
  />
);

// First-time users choose which side of the marketplace they represent.
// The selected role is stored permanently in their /users/{uid} profile.
const RoleSelection = () => {
  const { createProfile, user } = useAuth();
  const [name, setName] = useState(user?.displayName || '');

  return (
    <div className="flex flex-col p-8 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to EDGE</h1>
        <p className="text-slate-500">The structured way to book gigs.</p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-4 rounded-2xl bg-slate-100 border-none focus:ring-2 focus:ring-black outline-none"
          placeholder="Enter your name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => createProfile('organiser', name)}
          className="flex flex-col items-center justify-center p-6 space-y-2 border-2 border-slate-100 rounded-3xl hover:border-black transition-colors text-center"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <Briefcase size={24} />
          </div>
          <span className="font-bold">Organiser</span>
          <span className="text-xs text-slate-400">I post gigs & hire</span>
        </button>

        <button
          onClick={() => createProfile('artist', name)}
          className="flex flex-col items-center justify-center p-6 space-y-2 border-2 border-slate-100 rounded-3xl hover:border-black transition-colors text-center"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
            <UserIcon size={24} />
          </div>
          <span className="font-bold">Artist</span>
          <span className="text-xs text-slate-400">I find gigs & play</span>
        </button>
      </div>
    </div>
  );
};

// A reusable artist-facing card. The parent supplies the Firestore-backed gig
// and the callback that creates the application.
const GigCard = ({ gig, onApply, applying }: { gig: Gig, onApply: (g: Gig) => Promise<void>, applying: boolean }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    className="glass-card mb-4 group ring-1 ring-black/5 hover:ring-black transition-all"
  >
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h3 className="font-extrabold text-xl tracking-tighter leading-[0.9]">{gig.title}</h3>
        <p className="text-[10px] font-bold text-slate-400 flex items-center uppercase tracking-widest pt-2">
          <MapPin size={10} className="mr-1 opacity-40" /> {gig.location}
        </p>
      </div>
      <div className="text-right">
        <span className="font-mono text-xs font-black block tracking-tighter">${gig.budget}</span>
        <span className="col-header block mt-1">AVAILABLE</span>
      </div>
    </div>

    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 font-medium mt-4">
      {gig.description}
    </p>

    <div className="flex items-center justify-between pt-6 mt-6 border-t border-black/5">
      <div className="flex space-x-6">
        <div className="flex flex-col">
          <span className="col-header">Genre</span>
          <span className="data-value">{gig.genre}</span>
        </div>
        <div className="flex flex-col">
          <span className="col-header">Date</span>
          <span className="data-value">{new Date(gig.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}</span>
        </div>
      </div>
      <button
        onClick={() => { Haptics.light(); void onApply(gig); }}
        disabled={applying}
        className="bg-black text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-30 relative overflow-hidden"
      >
        <span className="relative z-10">{applying ? '...' : 'Apply Now'}</span>
        {applying && <motion.div layoutId="loading" className="absolute inset-0 bg-white/20" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1 }} />}
      </button>
    </div>
  </motion.div>
);

const ArtistHome = ({ telemetry }: { telemetry: MarketplaceTelemetry }) => {
  // ArtistHome reads all open gigs in real time. Change this query to add
  // filtering, location rules, or sorting behavior.
  const [gigs, setGigs] = useState<Gig[]>([]);
  const { user } = useAuth();
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [hasLoadedGigs, setHasLoadedGigs] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [applicationFeedback, setApplicationFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const visibleGigs = useMemo(
    () => filterGigs(gigs, searchQuery, selectedGenre),
    [gigs, searchQuery, selectedGenre],
  );

  useEffect(() => {
    console.log('[ArtistHome] Fetching gigs...');
    // This is the artist marketplace query: only gigs with status "open" appear.
    const q = query(collection(db, 'gigs'), where('status', '==', 'open'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allGigs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Gig));
      const sortedGigs = allGigs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setGigs(sortedGigs);
      setFeedError('');
      setHasLoadedGigs(true);
    }, (err) => {
      console.error('[ArtistHome] Snapshot error:', err);
      setFeedError('EDGE could not load marketplace signals. Check the connection and try again.');
      setHasLoadedGigs(true);
    });
    return unsubscribe;
  }, []);

  const handleApply = async (gig: Gig) => {
    if (!user || applyingTo) return;
    setApplyingTo(gig.id);
    setApplicationFeedback(null);
    Haptics.medium();
    try {
      // The deterministic application ID and matching Firestore rule enforce
      // one application per artist per gig, including concurrent submissions.
      await submitApplication(gig, user.uid);
      setApplicationFeedback({ type: 'success', message: `Application sent for ${gig.title}.` });
      Haptics.success();
    } catch (error) {
      console.error(error);
      Haptics.error();
      setApplicationFeedback({
        type: 'error',
        message: error instanceof MarketplaceOperationError
          ? error.message
          : 'EDGE could not send the application. Check the connection and try again.',
      });
    } finally {
      setApplyingTo(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32 no-scrollbar bg-slate-50/50 relative">
      <div className="scanline" />
      <header className="p-10 pb-2">
        <div className="flex items-center justify-between">
          <EdgeMark size="sm" />
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">SYS_ACTIVE</span>
          </div>
        </div>
        <div className="mt-12">
          <span className="col-header opacity-100 text-black">MARKETPLACE SIGNAL</span>
          <h2 className="text-5xl font-black tracking-tighter mt-2 leading-[0.85]">Available<br/>Opportunities</h2>
        </div>
      </header>

      <div className="px-10 pb-6">
        <LiveRadar activeGigs={telemetry.activeGigs} />
        <MarketplacePulse {...telemetry} />

        <div className="relative mb-4">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search open gigs"
            placeholder="Search title, location, genre..."
            className="w-full rounded-3xl border border-black/5 bg-white py-4 pl-12 pr-5 text-sm font-semibold outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
          />
        </div>

        <div className="flex space-x-2 mb-10 overflow-x-auto no-scrollbar pb-2">
          {GIG_GENRES.map(genre => (
            <button
              key={genre}
              type="button"
              aria-pressed={selectedGenre === genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${selectedGenre === genre ? 'bg-black text-white shadow-xl shadow-black/20' : 'bg-white text-slate-400 border border-slate-100 hover:border-black'}`}
            >
              {genre}
            </button>
          ))}
        </div>

        {applicationFeedback && (
          <p
            role={applicationFeedback.type === 'error' ? 'alert' : 'status'}
            className={`mb-4 rounded-2xl px-5 py-4 text-xs font-semibold leading-relaxed ${applicationFeedback.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}
          >
            {applicationFeedback.message}
          </p>
        )}

        {feedError && (
          <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-5 py-4 text-xs font-semibold leading-relaxed text-red-600">
            {feedError}
          </p>
        )}
      </div>

      <div className="px-8 pb-12">
        {!hasLoadedGigs && (
          <div className="text-center p-20 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-mono text-[10px] uppercase tracking-widest">
            <motion.span animate={{ opacity: [0.3, 1] }} transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}>
              Scanning for signals...
            </motion.span>
          </div>
        )}
        {hasLoadedGigs && !feedError && visibleGigs.length === 0 && (
          <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-mono text-[10px] uppercase tracking-widest">
            {gigs.length === 0 ? 'No open signals found.' : 'No signals match these filters.'}
          </div>
        )}
        <div className="space-y-4">
          {visibleGigs.map(gig => (
            <GigCard key={gig.id} gig={gig} onApply={handleApply} applying={applyingTo === gig.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PostGig = ({ onSuccess }: { onSuccess: () => void }) => {
  // Organiser form. Add or remove fields in this object and in the JSX inputs,
  // then update the Gig type and Firestore rules if the stored shape changes.
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', budget: '', date: '', location: '', genre: 'Jazz', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    Haptics.medium();
    try {
      // This creates a document in /gigs. The organiser ID comes from Firebase,
      // not from the form, so the rules can verify ownership.
      await addDoc(collection(db, 'gigs'), {
        ...form,
        budget: Number(form.budget),
        organiserId: user.uid,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      Haptics.success();
      onSuccess();
    } catch (e) {
      console.error(e);
      Haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-10 space-y-10">
      <div className="space-y-2">
        <span className="col-header opacity-100 text-black">NEW ASSIGNMENT</span>
        <h2 className="text-4xl font-black tracking-tighter leading-tight">Launch Gig</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="col-header uppercase tracking-[0.25em]">Event Title</label>
          <input
            required
            type="text"
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
            className="w-full p-6 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-black font-bold tracking-tight text-lg"
            placeholder="e.g. Underground Jazz Jam"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="col-header uppercase tracking-[0.25em]">Budget ($)</label>
            <input
              required
              type="number"
              value={form.budget}
              onChange={e => setForm({...form, budget: e.target.value})}
              className="w-full p-6 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-black font-mono font-bold text-lg"
              placeholder="500"
            />
          </div>
          <div className="space-y-2">
            <label className="col-header uppercase tracking-[0.25em]">Genre</label>
            <select
              value={form.genre}
              onChange={e => setForm({...form, genre: e.target.value})}
              className="w-full p-6 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-black font-bold text-sm uppercase tracking-widest appearance-none"
            >
              {['Jazz', 'Rock', 'Electronic', 'Pop', 'Classical'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="col-header uppercase tracking-[0.25em]">Date</label>
            <input
              required
              type="date"
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full p-6 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-black font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="col-header uppercase tracking-[0.25em]">Location</label>
            <input
              required
              type="text"
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
              className="w-full p-6 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-black font-bold text-sm"
              placeholder="Venue or City"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="col-header uppercase tracking-[0.25em]">Description</label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="w-full p-6 bg-slate-50 rounded-3xl outline-none focus:ring-2 focus:ring-black font-medium text-sm leading-relaxed"
            placeholder="Briefly describe the requirements..."
          />
        </div>
      </div>

      <button disabled={loading} type="submit" className="w-full btn-primary py-6 text-xl">
        {loading ? 'Initializing...' : 'Confirm signal'}
      </button>
    </form>
  );
};

const ApplicantCard = ({ app, gig, onStatusUpdate }: { app: Application, gig: Gig, onStatusUpdate: (application: Application, decision: ApplicationDecision) => Promise<void> }) => {
  // Each applicant card loads the artist's profile, then optionally asks Gemini
  // to score the artist against the selected gig.
  const [aiAnalysis, setAiAnalysis] = useState<{ score: number, reason: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const pDoc = await getDocFromServer(doc(db, 'users', app.artistId));
      if (pDoc.exists()) setProfile({ uid: pDoc.id, ...pDoc.data() } as UserProfile);
    };
    void fetchProfile().catch((error) => console.error('[ApplicantCard] Profile load failed:', error));
  }, [app.artistId]);

  const runAnalysis = async () => {
    if (!profile || analyzing) return;
    setAnalyzing(true);
    try {
      // Load the optional AI client only when requested so it does not inflate
      // the core marketplace bundle for every user.
      const { getCompatibilityScore } = await import('./lib/gemini');
      const res = await getCompatibilityScore(gig.id, profile.uid);
      setAiAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-200/30">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-mono text-sm">
            {profile?.name ? profile.name.substring(0, 2).toUpperCase() : app.artistId.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold">{profile?.name || `Artist #${app.artistId.substring(0, 4)}`}</p>
            <div className="flex items-center text-amber-500">
              <Star size={10} fill="currentColor" />
              <span className="data-value ml-1">{profile?.rating || '5.0'} ({profile?.completedGigsCount || 0} gigs)</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${app.status === 'pending' ? 'bg-amber-100 text-amber-600' : app.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {app.status}
          </div>
          {aiAnalysis ? (
            <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center justify-end">
              AI Match: <span className="text-black ml-1 font-mono">{aiAnalysis.score}%</span>
            </div>
          ) : (
            <button onClick={runAnalysis} disabled={analyzing} className="text-[9px] font-bold text-blue-500 mt-1 uppercase underline tracking-widest">
              {analyzing ? 'Thinking...' : 'AI Analyze'}
            </button>
          )}
        </div>
      </div>

      {aiAnalysis && (
        <p className="text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-slate-200 pl-3">
          "{aiAnalysis.reason}"
        </p>
      )}

      {gig.status === 'open' && app.status === 'pending' && (
        <div className="flex space-x-2 pt-2">
          <button onClick={() => void onStatusUpdate(app, 'accepted')} className="flex-1 bg-black text-white p-3 rounded-2xl font-bold text-xs uppercase tracking-widest">Hire</button>
          <button onClick={() => void onStatusUpdate(app, 'rejected')} className="flex-1 bg-slate-200 text-slate-600 p-3 rounded-2xl font-bold text-xs uppercase tracking-widest">Skip</button>
        </div>
      )}
    </div>
  );
};

const OrganiserDashboard = ({ telemetry }: { telemetry: MarketplaceTelemetry }) => {
  // Organisers see only their own gigs, then select one to subscribe to its
  // applications. Both subscriptions update the screen when Firestore changes.
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [decisionError, setDecisionError] = useState('');
  const [lifecyclePending, setLifecyclePending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Change this query to add organiser filters or alternate dashboard views.
    const q = query(collection(db, 'gigs'), where('organiserId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allGigs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Gig));
      const sortedGigs = allGigs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setGigs(sortedGigs);
      setSelectedGig((current) => current ? sortedGigs.find((gig) => gig.id === current.id) ?? null : null);
    }, (err) => console.error('[OrganiserDashboard] Gigs snapshot error:', err));
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    // Auth can briefly be null while Firebase restores the session. Do not
    // build a Firestore query until both the gig and signed-in organiser exist.
    if (!selectedGig || !user) {
      setApplications([]);
      return;
    }
    const q = query(
      collection(db, 'applications'),
      where('gigId', '==', selectedGig.id),
      where('organiserId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const appsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
      setApplications(appsData);
    }, (err) => console.error('[OrganiserDashboard] Applications snapshot error:', err));
    return unsubscribe;
  }, [selectedGig, user]);

  const updateStatus = async (application: Application, decision: ApplicationDecision) => {
    Haptics.light();
    setDecisionError('');
    if (!selectedGig) return;
    try {
      // Accepting is a single Firestore transaction: the application becomes
      // accepted and the selected gig becomes filled together or neither does.
      await updateApplicationDecision(application, selectedGig, decision);
      Haptics.success();
    } catch (error) {
      console.error('[OrganiserDashboard] Decision failed:', error);
      Haptics.error();
      setDecisionError(error instanceof MarketplaceOperationError
        ? error.message
        : 'EDGE could not update this application. Check the connection and try again.');
    }
  };

  const runLifecycleAction = async (action: 'complete' | 'cancel' | 'no-show') => {
    if (!selectedGig || !user || lifecyclePending) return;
    if (action !== 'complete' && !window.confirm(action === 'no-show'
      ? 'Record the accepted artist as a no-show and close this booking?'
      : 'Cancel this gig? This will close the current booking.')) return;
    setLifecyclePending(true);
    setDecisionError('');
    try {
      if (action === 'complete') await completeGig(selectedGig);
      if (action === 'cancel') await cancelGig(selectedGig, user.uid);
      if (action === 'no-show') await markArtistNoShow(selectedGig);
      Haptics.success();
    } catch (error) {
      Haptics.error();
      setDecisionError(error instanceof MarketplaceOperationError
        ? error.message
        : 'EDGE could not update the gig lifecycle.');
    } finally {
      setLifecyclePending(false);
    }
  };

  const acceptedApplication = applications.find((application) => application.id === selectedGig?.acceptedApplicationId);

  return (
    <div className="flex-1 overflow-y-auto pb-32 no-scrollbar relative">
      <div className="scanline" />
      <header className="p-10 pb-2">
        <div className="flex justify-between items-center">
          <EdgeMark size="sm" />
          <div className="flex items-center space-x-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <History size={18} className="text-slate-300" />
          </div>
        </div>
        <div className="mt-12">
          <span className="col-header opacity-100 text-black">ADMIN CONSOLE</span>
          <h2 className="text-5xl font-black tracking-tighter mt-2 leading-[0.85]">Gig Control</h2>
        </div>
      </header>

      <div className="px-10 pb-6">
        <MarketplacePulse {...telemetry} />
      </div>

      <div className="px-8 mt-2">
        {gigs.length === 0 && (
          <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center space-y-2">
            <p className="font-mono text-[9px] text-slate-300 uppercase tracking-widest">No Active Missions</p>
            <p className="text-xs text-slate-400 font-medium">Post your first gig to get started.</p>
          </div>
        )}
        <div className="space-y-3">
          {gigs.map(gig => (
            <div
              key={gig.id}
              onClick={() => setSelectedGig(gig)}
              className={`p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer ${selectedGig?.id === gig.id ? 'bg-black text-white border-black scale-[0.98]' : 'bg-white border-slate-100 hover:border-black'}`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-lg tracking-tighter">{gig.title}</h3>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedGig?.id === gig.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {gig.status}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-3 opacity-60">
                <div className="flex items-center">
                  <DollarSign size={10} className="mr-1" />
                  <span className="data-value">{gig.budget}</span>
                </div>
                <span className="opacity-20">•</span>
                <div className="flex items-center">
                  <Calendar size={10} className="mr-1" />
                  <span className="data-value">{new Date(gig.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedGig && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto"
              onClick={() => setSelectedGig(null)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-[420px] bg-white rounded-t-[3.5rem] relative overflow-hidden flex flex-col h-[85%] shadow-2xl pointer-events-auto"
            >
              <div className="flex-1 overflow-y-auto no-scrollbar p-10">
                <div className="flex justify-between items-center mb-12">
                  <button onClick={() => setSelectedGig(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <X size={18} strokeWidth={3} />
                  </button>
                  <div className="text-right">
                    <span className="col-header">Gig Detail</span>
                    <p className="font-black text-xs uppercase tracking-tight truncate max-w-[150px]">{selectedGig.title}</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <section>
                    <div className="flex justify-between items-baseline mb-6">
                      <h4 className="font-extrabold text-2xl tracking-tighter">Applicants</h4>
                      <span className="font-mono text-[10px] text-slate-400">{applications.length} Signal{applications.length !== 1 ? 's' : ''} Received</span>
                    </div>

                    {decisionError && (
                      <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-5 py-4 text-xs font-semibold leading-relaxed text-red-600">
                        {decisionError}
                      </p>
                    )}

                    <div className="space-y-4">
                      {applications.length === 0 && (
                        <div className="py-20 text-center border border-dashed border-slate-100 rounded-[2.5rem]">
                          <p className="font-mono text-[9px] text-slate-300 uppercase tracking-[0.2em] animate-pulse">Waiting for signals...</p>
                        </div>
                      )}
                      {applications.map(app => (
                        <ApplicantCard key={app.id} app={app} gig={selectedGig} onStatusUpdate={updateStatus} />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-2xl tracking-tighter">Lifecycle</h4>
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest">{selectedGig.status}</span>
                    </div>

                    {selectedGig.status === 'open' && (
                      <button disabled={lifecyclePending} onClick={() => void runLifecycleAction('cancel')} className="w-full rounded-2xl bg-red-50 p-4 text-[10px] font-black uppercase tracking-widest text-red-600 disabled:opacity-40">Cancel gig</button>
                    )}
                    {selectedGig.status === 'filled' && (
                      <div className="space-y-3">
                        <button disabled={lifecyclePending} onClick={() => void runLifecycleAction('complete')} className="w-full rounded-2xl bg-black p-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40">Mark completed</button>
                        <div className="grid grid-cols-2 gap-3">
                          <button disabled={lifecyclePending} onClick={() => void runLifecycleAction('cancel')} className="rounded-2xl bg-red-50 p-3 text-[9px] font-black uppercase tracking-widest text-red-600 disabled:opacity-40">Cancel booking</button>
                          <button disabled={lifecyclePending} onClick={() => void runLifecycleAction('no-show')} className="rounded-2xl bg-amber-50 p-3 text-[9px] font-black uppercase tracking-widest text-amber-700 disabled:opacity-40">Artist no-show</button>
                        </div>
                      </div>
                    )}
                    {selectedGig.status === 'completed' && acceptedApplication && user && (
                      <ReviewForm gigId={selectedGig.id} fromUid={user.uid} toUid={acceptedApplication.artistId} />
                    )}
                    {selectedGig.status === 'cancelled' && (
                      <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
                        {selectedGig.cancellationReason === 'no_show' ? 'Closed after an artist no-show.' : 'This gig has been cancelled.'}
                      </p>
                    )}
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MainApp = () => {
  // MainApp is the signed-in shell. activeTab controls the bottom navigation;
  // isPosting controls the organiser's full-screen post-gig sheet.
  const { profile } = useAuth();
  const telemetry = useMarketplaceTelemetry();
  const [activeTab, setActiveTab] = useState<'home' | 'applications' | 'profile'>('home');
  const [isPosting, setIsPosting] = useState(false);

  if (!profile) return <RoleSelection />;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <StatusBar />
      <ActivityTicker recentGigs={telemetry.recentGigs} />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
          {activeTab === 'home' && (profile.role === 'artist' ? <ArtistHome telemetry={telemetry} /> : <OrganiserDashboard telemetry={telemetry} />)}
          {activeTab === 'applications' && profile.role === 'artist' && <ArtistApplications />}
          {activeTab === 'profile' && <ProfileScreen profile={profile} />}
        </motion.div>
      </AnimatePresence>

      <nav className="fixed bottom-10 left-0 right-0 z-40 px-8 pointer-events-none">
        <div className="max-w-[320px] mx-auto bg-black/90 backdrop-blur-2xl px-2 py-2 rounded-[2.5rem] shadow-2xl shadow-black/40 border border-white/10 flex items-center justify-between pointer-events-auto">
          <button
            onClick={() => { Haptics.light(); setActiveTab('home'); }}
            aria-label="Marketplace"
            title="Marketplace"
            className={`flex-1 py-4 flex justify-center transition-all ${activeTab === 'home' ? 'bg-white text-black rounded-[2rem] shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Briefcase size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>

          {profile.role === 'organiser' && (
            <button
              onClick={() => { Haptics.medium(); setIsPosting(true); }}
              aria-label="Post a gig"
              title="Post a gig"
              className="mx-3 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black active:scale-95 transition-transform hover:shadow-xl shadow-white/10"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          )}

          {profile.role === 'artist' && (
            <button
              onClick={() => { Haptics.light(); setActiveTab('applications'); }}
              aria-label="My applications"
              title="My applications"
              className={`mx-2 flex-1 py-4 flex justify-center transition-all ${activeTab === 'applications' ? 'bg-white text-black rounded-[2rem] shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <History size={22} strokeWidth={activeTab === 'applications' ? 2.5 : 2} />
            </button>
          )}

          <button
            onClick={() => { Haptics.light(); setActiveTab('profile'); }}
            aria-label="Profile"
            title="Profile"
            className={`flex-1 py-4 flex justify-center transition-all ${activeTab === 'profile' ? 'bg-white text-black rounded-[2rem] shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <UserIcon size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isPosting && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 z-[60] bg-white mobile-container"
          >
            <div className="relative">
              <button
                onClick={() => setIsPosting(false)}
                className="absolute top-8 right-8 p-2 text-slate-400"
              >
                <X />
              </button>
              <PostGig onSuccess={() => { setIsPosting(false); setActiveTab('home'); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuthWrapper = () => {
  // AuthWrapper chooses between loading, sign-in, and the signed-in app.
  // If Google rejects the current hostname, authError explains the fix in the UI.
  // This is an OAuth configuration issue, not a Firestore or React rendering issue.
  const { user, profile, loading, signIn, authError: firebaseAuthError, clearAuthError } = useAuth();
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isPoweringUp, setIsPoweringUp] = useState(false);

  const handleSignIn = async () => {
    setAuthError('');
    clearAuthError();
    setIsAuthenticating(true);
    try {
      await signIn();
      // Keep the branded transition as part of the successful auth journey.
      // It gives Firebase time to hydrate the user/profile before the shell appears.
      setIsAuthenticating(false);
      setIsPoweringUp(true);
      await new Promise((resolve) => window.setTimeout(resolve, 900));
    } catch (error: any) {
      if (error?.code === 'auth/unauthorized-domain') {
        setAuthError('Firebase does not authorize this address yet. Add localhost and 127.0.0.1 under Firebase Authentication > Settings > Authorized domains, then try Initialize Protocol again.');
      } else if (error?.code === 'auth/operation-not-allowed') {
        setAuthError('Google sign-in is not enabled in Firebase Authentication. Enable the Google provider and try again.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setAuthError('The sign-in window was closed before authentication finished.');
      } else if (error?.code === 'auth/storage-unavailable') {
        setAuthError('This browser blocked the secure sign-in handoff. Try the same localhost address in a normal browser window.');
      } else if (error?.code === 'auth/invalid-credential') {
        setAuthError('Google returned an invalid sign-in response. Try Initialize Protocol again.');
      } else {
        setAuthError('Sign-in failed. Check the browser console for the Firebase error details.');
      }
    } finally {
      setIsAuthenticating(false);
      setIsPoweringUp(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingScreen /></div>;

  if (isAuthenticating) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingScreen label="Authenticating_EDGE" detail="Verifying secure access..." />
      </div>
    );
  }

  if (isPoweringUp) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingScreen label="Powering_Up_EDGE" detail="Session verified. Preparing workspace..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col p-10 h-full justify-center space-y-16 bg-white relative overflow-hidden">
        <div className="scanline" />
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-slate-100 rounded-full blur-[100px] opacity-50" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-neutral-200 rounded-full blur-[100px] opacity-30" />

        <div className="space-y-6 relative z-10">
          <motion.img
            initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 12 }}
            transition={{ type: 'spring', damping: 20 }}
            className="edge-mark edge-mark-lg"
            src={EDGE_MARK_SRC}
            alt="EDGE"
          />
          <div className="space-y-2">
            <h1 className="text-7xl font-black tracking-tighter leading-tight">EDGE</h1>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] opacity-40">System_Initializing</p>
            </div>
          </div>
          <p className="text-2xl text-slate-500 font-semibold leading-tight max-w-[280px]">Structured performance booking protocol.</p>
        </div>

        <div className="space-y-6 relative z-10">
          <button
            onClick={handleSignIn}
            disabled={isAuthenticating}
            aria-busy={isAuthenticating}
            className="w-full flex items-center justify-between p-8 bg-black text-white rounded-[2.5rem] font-bold group overflow-hidden relative shadow-2xl shadow-black/20 active:scale-95 transition-all"
          >
            <span className="relative z-10 text-xl font-black uppercase tracking-tight">Initialize Protocol</span>
            <div className="relative z-10 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform">
              <ArrowRight size={24} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl -z-0" />
          </button>

          {(authError || firebaseAuthError) && (
            <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-xs font-semibold leading-relaxed text-red-600">
              {authError || firebaseAuthError}
            </p>
          )}

          <div className="flex justify-between items-center px-2">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">Build_2026.4.20</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">SECURE_CLOUD</p>
          </div>
        </div>
      </div>
    );
  }

  return <MainApp />;
};

export default function App() {
  // The provider supplies auth/profile state; the mobile-container class defines
  // the phone-like presentation visible on desktop screens.
  console.log('[App] Mounting...');
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-h-screen flex items-center justify-center py-12 md:py-24">
          <div className="mobile-container">
            <AuthWrapper />
          </div>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
