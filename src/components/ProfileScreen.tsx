import { FormEvent, useState } from 'react';
import { ChevronRight, FileText, Info, LogOut, Mail, Pencil, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from './AuthContext';
import { Haptics } from '../lib/haptics';
import { useProfileMetrics } from '../hooks/useProfileMetrics';
import { UserProfile } from '../types';

const SUPPORT_LINKS = [
  {
    label: 'Contact EDGE',
    detail: 'edge911info@gmail.com',
    href: 'mailto:edge911info@gmail.com',
    icon: Mail,
  },
  {
    label: 'About EDGE',
    detail: 'What the marketplace is building',
    href: `${import.meta.env.BASE_URL}about.html`,
    icon: Info,
  },
  {
    label: 'Privacy policy',
    detail: 'How account information is used',
    href: `${import.meta.env.BASE_URL}privacy.html`,
    icon: ShieldCheck,
  },
  {
    label: 'Terms of use',
    detail: 'Rules for using the marketplace',
    href: `${import.meta.env.BASE_URL}terms.html`,
    icon: FileText,
  },
] as const;

export function ProfileScreen({ profile }: { profile: UserProfile }) {
  const { logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState(() => ({
    name: profile?.name ?? '',
    bio: profile?.bio ?? '',
    genres: profile?.genres.join(', ') ?? '',
    location: profile?.location ?? '',
    portfolio: profile?.portfolio.join('\n') ?? '',
  }));
  const metrics = useProfileMetrics(profile);
  const isAudience = profile.role === 'audience';
  const genreLabel = isAudience ? 'Sounds you follow, separated by commas' : 'Genres, separated by commas';
  const portfolioLabel = profile.role === 'venue'
    ? 'Venue, stage, or technical links, one per line'
    : profile.role === 'organiser'
      ? 'Past event links, one per line'
      : profile.role === 'audience'
        ? 'Favourite artist or event links, one per line'
        : 'Portfolio links, one per line';
  const signalChecks = [
    { label: 'name', ready: Boolean(profile.name.trim()) },
    { label: 'bio', ready: Boolean(profile.bio.trim()) },
    { label: 'location', ready: Boolean(profile.location.trim()) },
    { label: isAudience ? 'sound preferences' : 'genres', ready: profile.genres.length > 0 },
    ...(!isAudience ? [{ label: 'links', ready: profile.portfolio.length > 0 }] : []),
  ];
  const completedSignalChecks = signalChecks.filter((item) => item.ready).length;
  const profileSignal = Math.round((completedSignalChecks / signalChecks.length) * 100);
  const nextSignalField = signalChecks.find((item) => !item.ready)?.label;

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        genres: form.genres.split(','),
        location: form.location,
        portfolio: form.portfolio.split('\n'),
      });
      Haptics.success();
      setEditing(false);
    } catch (error) {
      Haptics.error();
      setFeedback(error instanceof Error ? error.message : 'EDGE could not save the profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center space-y-6 overflow-y-auto p-6 pb-44 no-scrollbar sm:p-10 lg:pb-12 lg:px-12 xl:px-16">
      <div className="scanline" />
      <div className="flex w-full max-w-6xl shrink-0 items-center justify-between">
        <div>
          <span className="col-header opacity-100 text-black">PROFILE_NODE</span>
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-400 mt-1">Session_Active</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing((value) => !value)} aria-label="Edit profile" title="Edit profile" className="w-11 h-11 rounded-2xl border border-black/10 flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-colors">
            {editing ? <X size={17} /> : <Pencil size={17} />}
          </button>
          <button onClick={() => { Haptics.medium(); void logout(); }} aria-label="Disconnect session" title="Disconnect session" className="w-11 h-11 rounded-2xl border border-black/10 flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-colors">
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="z-10 w-full max-w-6xl space-y-4 rounded-[2.5rem] border border-black/5 bg-white p-6 shadow-xl lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="w-full rounded-2xl bg-slate-50 p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black" />
          <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" rows={3} className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          <input value={form.genres} onChange={(event) => setForm({ ...form, genres: event.target.value })} placeholder={genreLabel} className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          <textarea value={form.portfolio} onChange={(event) => setForm({ ...form, portfolio: event.target.value })} placeholder={portfolioLabel} rows={3} className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          {feedback && <p role="alert" className="text-xs font-semibold text-red-600">{feedback}</p>}
          <button disabled={saving} type="submit" className="w-full rounded-2xl bg-black p-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40 lg:col-span-2">{saving ? 'Saving...' : 'Save profile'}</button>
        </form>
      )}

      <div className="group relative flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-[4rem] bg-black ring-[16px] ring-slate-50 lg:mt-4">
        <UserIcon size={80} className="text-slate-300 group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">Node_Active</span></div>
        <h2 className="text-5xl font-black tracking-tighter">{profile.name}</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">{profile.role}_ID</p>
      </div>

      <div className="grid w-full max-w-6xl shrink-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
        {isAudience ? (
          <div className="grid grid-cols-3 gap-2 rounded-[2.5rem] bg-slate-50 p-2">
            <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm"><p className="truncate text-lg font-black tracking-tighter">{profile.location || 'Anywhere'}</p><p className="col-header">Area</p></div>
            <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm"><p className="text-3xl font-black tracking-tighter text-blue-600">{profile.genres.length}</p><p className="col-header">Sounds</p></div>
            <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm"><p className="text-lg font-black tracking-tighter text-emerald-500">Active</p><p className="col-header">Discovery</p></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 rounded-[2.5rem] bg-slate-50 p-2">
            <div className="rounded-[2rem] bg-white p-6 text-center shadow-sm"><p className="text-3xl font-black tracking-tighter">{metrics.rating ?? '—'}</p><p className="col-header">Trust</p></div>
            <div className="rounded-[2rem] bg-white p-6 text-center shadow-sm"><p className="text-3xl font-black tracking-tighter text-blue-600">{metrics.completed}</p><p className="col-header">Gigs</p></div>
            <div className="rounded-[2rem] bg-white p-6 text-center shadow-sm"><p className="text-3xl font-black tracking-tighter text-emerald-500">{metrics.reliability === null ? '—' : `${metrics.reliability}%`}</p><p className="col-header">Reliability</p></div>
          </div>
        )}
        <div className="profile-signal-panel shrink-0 space-y-5 p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <span className="col-header opacity-100 text-white">Profile_Signal</span>
              <p className="mt-2 text-[10px] font-medium leading-5 text-white/50">Real completeness based on the profile fields you have added.</p>
            </div>
            <span className="font-mono text-3xl font-black tracking-[-0.08em] text-emerald-400">{profileSignal}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Profile completeness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={profileSignal}
            className="h-2 overflow-hidden bg-white/10"
          >
            <motion.div initial={{ width: 0 }} animate={{ width: `${profileSignal}%` }} className="h-full bg-emerald-400" />
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-white/50 sm:grid-cols-3">
            {signalChecks.map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 ${item.ready ? 'bg-emerald-400' : 'bg-white/20'}`} />
                {item.label}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4 text-[10px]">
            <span className="font-mono uppercase tracking-[0.16em] text-white/40">Node status · active</span>
            <button type="button" onClick={() => setEditing(true)} className="font-black text-white underline decoration-emerald-400 underline-offset-4">
              {nextSignalField ? `Add ${nextSignalField}` : 'Signal complete'}
            </button>
          </div>
        </div>
        </div>
        <section aria-labelledby="support-and-legal-heading" className="shrink-0 border border-black/5 rounded-[2.5rem] p-4 space-y-3">
          <div className="px-4 pt-3 pb-2">
            <span id="support-and-legal-heading" className="col-header opacity-100 text-black">Support &amp; legal</span>
            <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400">Help, product information, and marketplace policies.</p>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-slate-50">
            {SUPPORT_LINKS.map(({ label, detail, href, icon: Icon }, index) => {
              const opensNewTab = !href.startsWith('mailto:');
              return (
                <a
                  key={label}
                  href={href}
                  target={opensNewTab ? '_blank' : undefined}
                  rel={opensNewTab ? 'noreferrer' : undefined}
                  className={`group flex items-center gap-3 bg-white px-4 py-4 transition-colors hover:bg-slate-50 ${index < SUPPORT_LINKS.length - 1 ? 'border-b border-black/5' : ''}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-black group-hover:text-white">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black uppercase tracking-[0.12em] text-black">{label}</span>
                    <span className="mt-1 block truncate text-[10px] font-medium text-slate-400">{detail}</span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-black" />
                </a>
              );
            })}
          </div>
        </section>
      </div>
      <div className="w-full max-w-6xl shrink-0 pb-2 pt-3"><button onClick={() => { Haptics.medium(); void logout(); }} className="w-full btn-secondary py-6 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50">Disconnect_Session</button></div>
    </div>
  );
}
