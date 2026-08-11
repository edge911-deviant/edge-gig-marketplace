import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Calendar, History, MapPin } from 'lucide-react';
import { db } from '../lib/firebase';
import { Application, Gig } from '../types';
import { useAuth } from './AuthContext';
import { cancelApplication, MarketplaceOperationError } from '../lib/applications';
import { Haptics } from '../lib/haptics';
import { ReviewForm } from './ReviewForm';

export function ArtistApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const applicationQuery = query(collection(db, 'applications'), where('artistId', '==', user.uid));
    const unsubscribeApplications = onSnapshot(applicationQuery, (snapshot) => {
      setApplications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Application)));
      setLoading(false);
    }, (error) => {
      console.error('[ArtistApplications] Application history failed:', error);
      setFeedback('EDGE could not load application history.');
      setLoading(false);
    });
    const unsubscribeGigs = onSnapshot(collection(db, 'gigs'), (snapshot) => {
      setGigs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Gig)));
    }, (error) => console.error('[ArtistApplications] Gig history failed:', error));

    return () => {
      unsubscribeApplications();
      unsubscribeGigs();
    };
  }, [user]);

  const sortedApplications = useMemo(() => [...applications]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()), [applications]);
  const gigsById = useMemo(() => new Map(gigs.map((gig) => [gig.id, gig])), [gigs]);

  const handleCancel = async (application: Application, gig?: Gig) => {
    setCancellingId(application.id);
    setFeedback('');
    try {
      await cancelApplication(application, gig);
      Haptics.success();
    } catch (error) {
      Haptics.error();
      setFeedback(error instanceof MarketplaceOperationError ? error.message : 'EDGE could not cancel this application.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 pb-32 no-scrollbar">
      <header className="mb-10 pt-3">
        <span className="col-header opacity-100 text-black">ARTIST JOURNEY</span>
        <div className="mt-2 flex items-center gap-3">
          <History size={28} />
          <h2 className="text-4xl font-black tracking-tighter">Application Signals</h2>
        </div>
      </header>

      {feedback && <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-600">{feedback}</p>}
      {loading && <p className="py-16 text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">Loading signal history...</p>}
      {!loading && sortedApplications.length === 0 && (
        <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 p-16 text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">
          No applications transmitted yet.
        </div>
      )}

      <div className="space-y-5">
        {sortedApplications.map((application) => {
          const gig = gigsById.get(application.gigId);
          const displayStatus = gig?.status === 'completed' ? 'completed' : application.status;
          return (
            <article key={application.id} className="space-y-4 rounded-[2.5rem] border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">{gig?.title ?? application.gigTitle ?? 'Gig unavailable'}</h3>
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <MapPin size={11} /> {gig?.location ?? 'Location unavailable'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest">{displayStatus}</span>
              </div>
              <p className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                <Calendar size={11} /> Applied {new Date(application.appliedAt).toLocaleDateString()}
              </p>

              {(application.status === 'pending' || (application.status === 'accepted' && gig?.status === 'filled')) && (
                <button
                  type="button"
                  disabled={cancellingId === application.id}
                  onClick={() => void handleCancel(application, gig)}
                  className="w-full rounded-2xl bg-red-50 p-3 text-[10px] font-black uppercase tracking-widest text-red-600 disabled:opacity-40"
                >
                  {cancellingId === application.id ? 'Cancelling...' : application.status === 'pending' ? 'Withdraw application' : 'Cancel booking'}
                </button>
              )}

              {user && application.status === 'accepted' && gig?.status === 'completed' && (
                <ReviewForm compact gigId={gig.id} fromUid={user.uid} toUid={application.organiserId} />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
