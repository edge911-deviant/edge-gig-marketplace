import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gig } from '../types';

export interface MarketplaceTelemetry {
  activeGigs: number | null;
  registeredArtists: number | null;
  recentGigs: Gig[];
}

export function useMarketplaceTelemetry(): MarketplaceTelemetry {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [activeGigs, setActiveGigs] = useState<number | null>(null);
  const [registeredArtists, setRegisteredArtists] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribeGigs = onSnapshot(collection(db, 'gigs'), (snapshot) => {
      const nextGigs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Gig));
      setGigs(nextGigs);
      setActiveGigs(nextGigs.filter((gig) => gig.status === 'open').length);
    }, (error) => console.error('[Telemetry] Gig metrics failed:', error));

    const artistQuery = query(collection(db, 'users'), where('role', '==', 'artist'));
    const unsubscribeArtists = onSnapshot(artistQuery, (snapshot) => {
      setRegisteredArtists(snapshot.size);
    }, (error) => console.error('[Telemetry] Artist metrics failed:', error));

    return () => {
      unsubscribeGigs();
      unsubscribeArtists();
    };
  }, []);

  const recentGigs = useMemo(() => [...gigs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5), [gigs]);

  return { activeGigs, registeredArtists, recentGigs };
}
