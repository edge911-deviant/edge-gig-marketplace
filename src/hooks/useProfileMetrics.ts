import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Application, Gig, Review, UserProfile } from '../types';
import { averageRating, calculateReliability } from '../lib/reliability';

export function useProfileMetrics(profile: UserProfile) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const unsubscribeGigs = onSnapshot(collection(db, 'gigs'), (snapshot) => {
      setGigs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Gig)));
    });
    const applicationQuery = query(collection(db, 'applications'), where('artistId', '==', profile.uid));
    const unsubscribeApplications = onSnapshot(applicationQuery, (snapshot) => {
      setApplications(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Application)));
    });
    const reviewQuery = query(collection(db, 'reviews'), where('toUid', '==', profile.uid));
    const unsubscribeReviews = onSnapshot(reviewQuery, (snapshot) => {
      setReviews(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Review)));
    });

    return () => {
      unsubscribeGigs();
      unsubscribeApplications();
      unsubscribeReviews();
    };
  }, [profile.uid]);

  return useMemo(() => {
    const relevantGigs = profile.role === 'organiser'
      ? gigs.filter((gig) => gig.organiserId === profile.uid)
      : gigs.filter((gig) => applications.some((application) => (
        application.gigId === gig.id &&
        (application.status === 'accepted' || application.status === 'cancelled')
      )));
    const reliability = calculateReliability(relevantGigs, profile.uid);
    const rating = averageRating(reviews.map((review) => review.score));
    return { ...reliability, rating, reviewCount: reviews.length };
  }, [applications, gigs, profile.role, profile.uid, reviews]);
}
