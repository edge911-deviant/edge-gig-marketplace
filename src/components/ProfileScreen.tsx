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
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-10 pb-32 space-y-6 flex flex-col items-center relative">
      <div className="scanline" />
      <div className="shrink-0 w-full flex items-center justify-between">
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
        <form onSubmit={handleSave} className="z-10 w-full space-y-4 rounded-[2.5rem] border border-black/5 bg-white p-6 shadow-xl">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="w-full rounded-2xl bg-slate-50 p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-black" />
          <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" rows={3} className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          <input value={form.genres} onChange={(event) => setForm({ ...form, genres: event.target.value })} placeholder="Genres, separated by commas" className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          <textarea value={form.portfolio} onChange={(event) => setForm({ ...form, portfolio: event.target.value })} placeholder="Portfolio links, one per line" rows={3} className="w-full rounded-2xl bg-slate-50 p-4 text-sm outline-none focus:ring-2 focus:ring-black" />
          {feedback && <p role="alert" className="text-xs font-semibold text-red-600">{feedback}</p>}
          <button disabled={saving} type="submit" className="w-full rounded-2xl bg-black p-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40">{saving ? 'Saving...' : 'Save profile'}</button>
        </form>
      )}

      <div className="shrink-0 w-40 h-40 bg-black rounded-[4rem] ring-[16px] ring-slate-50 flex items-center justify-center overflow-hidden relative group">
        <UserIcon size={80} className="text-slate-300 group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">Node_Active</span></div>
        <h2 className="text-5xl font-black tracking-tighter">{profile.name}</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">{profile.role}_ID</p>
      </div>

      <div className="shrink-0 w-full space-y-4">
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-[2.5rem]">
          <div className="bg-white p-6 rounded-[2rem] text-center shadow-sm"><p className="text-3xl font-black tracking-tighter">{metrics.rating ?? '—'}</p><p className="col-header">Trust</p></div>
          <div className="bg-white p-6 rounded-[2rem] text-center shadow-sm"><p className="text-3xl font-black tracking-tighter text-blue-600">{metrics.completed}</p><p className="col-header">Gigs</p></div>
          <div className="bg-white p-6 rounded-[2rem] text-center shadow-sm"><p className="text-3xl font-black tracking-tighter text-emerald-500">{metrics.reliability === null ? '—' : `${metrics.reliability}%`}</p><p className="col-header">Reliability</p></div>
        </div>
        <div className="shrink-0 p-8 border border-black/5 rounded-[2.5rem] space-y-4">
          <span className="col-header opacity-100 text-black">System Preferences</span>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs"><span className="font-medium text-slate-500 uppercase tracking-widest">Signal Encryption</span><span className="font-mono font-bold">AES-256</span></div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-black" /></div>
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
      <div className="shrink-0 w-full pt-3 pb-2"><button onClick={() => { Haptics.medium(); void logout(); }} className="w-full btn-secondary text-red-500 font-black tracking-widest uppercase text-xs py-6 hover:bg-red-50">Disconnect_Session</button></div>
    </div>
  );
}
