import { doc, runTransaction, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Application, Gig, Review } from '../types';

export type ApplicationDecision = Extract<Application['status'], 'accepted' | 'rejected'>;

export class MarketplaceOperationError extends Error {
  constructor(
    public readonly code: 'already-applied' | 'application-changed' | 'gig-closed',
    message: string,
  ) {
    super(message);
    this.name = 'MarketplaceOperationError';
  }
}

export function applicationDocumentId(gigId: string, artistId: string) {
  return `${gigId}_${artistId}`;
}

export async function submitApplication(gig: Gig, artistId: string) {
  const applicationRef = doc(db, 'applications', applicationDocumentId(gig.id, artistId));

  await runTransaction(db, async (transaction) => {
    const existingApplication = await transaction.get(applicationRef);
    if (existingApplication.exists()) {
      throw new MarketplaceOperationError('already-applied', 'You have already applied to this gig.');
    }

    transaction.set(applicationRef, {
      gigId: gig.id,
      artistId,
      organiserId: gig.organiserId,
      status: 'pending',
      appliedAt: new Date().toISOString(),
      gigTitle: gig.title,
      status_updatedAt: serverTimestamp(),
    });
  });
}

export async function updateApplicationDecision(
  application: Application,
  gig: Gig,
  decision: ApplicationDecision,
) {
  const applicationRef = doc(db, 'applications', application.id);

  if (decision === 'rejected') {
    await updateDoc(applicationRef, {
      status: decision,
      status_updatedAt: serverTimestamp(),
    });
    return;
  }

  const gigRef = doc(db, 'gigs', gig.id);
  await runTransaction(db, async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationRef);
    const gigSnapshot = await transaction.get(gigRef);

    if (!applicationSnapshot.exists() || applicationSnapshot.data().status !== 'pending') {
      throw new MarketplaceOperationError('application-changed', 'This application is no longer pending.');
    }
    if (!gigSnapshot.exists() || gigSnapshot.data().status !== 'open') {
      throw new MarketplaceOperationError('gig-closed', 'This gig is no longer open.');
    }
    if (applicationSnapshot.data().gigId !== gig.id) {
      throw new MarketplaceOperationError('application-changed', 'This application does not belong to the selected gig.');
    }

    transaction.update(applicationRef, {
      status: 'accepted',
      status_updatedAt: serverTimestamp(),
    });
    transaction.update(gigRef, {
      status: 'filled',
      acceptedApplicationId: application.id,
      acceptedArtistId: application.artistId,
      filledAt: serverTimestamp(),
    });
  });
}

export async function cancelApplication(application: Application, gig?: Gig) {
  const applicationRef = doc(db, 'applications', application.id);
  if (application.status === 'pending') {
    await updateDoc(applicationRef, {
      status: 'cancelled',
      status_updatedAt: serverTimestamp(),
    });
    return;
  }

  if (application.status !== 'accepted' || !gig || gig.status !== 'filled') {
    throw new MarketplaceOperationError('application-changed', 'This booking can no longer be cancelled.');
  }

  const gigRef = doc(db, 'gigs', gig.id);
  await runTransaction(db, async (transaction) => {
    const [applicationSnapshot, gigSnapshot] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(gigRef),
    ]);
    if (applicationSnapshot.data()?.status !== 'accepted' || gigSnapshot.data()?.status !== 'filled') {
      throw new MarketplaceOperationError('application-changed', 'This booking changed before cancellation completed.');
    }

    transaction.update(applicationRef, {
      status: 'cancelled',
      status_updatedAt: serverTimestamp(),
    });
    transaction.update(gigRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledByUid: application.artistId,
      cancellationReason: 'cancelled',
    });
  });
}

export async function completeGig(gig: Gig) {
  if (gig.status !== 'filled') {
    throw new MarketplaceOperationError('gig-closed', 'Only a filled gig can be completed.');
  }
  await updateDoc(doc(db, 'gigs', gig.id), {
    status: 'completed',
    completedAt: serverTimestamp(),
  });
}

export async function cancelGig(gig: Gig, organiserId: string) {
  const gigRef = doc(db, 'gigs', gig.id);
  if (gig.status === 'open') {
    await updateDoc(gigRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledByUid: organiserId,
      cancellationReason: 'cancelled',
    });
    return;
  }

  if (gig.status !== 'filled' || !gig.acceptedApplicationId) {
    throw new MarketplaceOperationError('gig-closed', 'This gig can no longer be cancelled.');
  }
  const applicationRef = doc(db, 'applications', gig.acceptedApplicationId);
  await runTransaction(db, async (transaction) => {
    const [applicationSnapshot, gigSnapshot] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(gigRef),
    ]);
    if (applicationSnapshot.data()?.status !== 'accepted' || gigSnapshot.data()?.status !== 'filled') {
      throw new MarketplaceOperationError('application-changed', 'This booking changed before cancellation completed.');
    }
    transaction.update(applicationRef, {
      status: 'cancelled',
      status_updatedAt: serverTimestamp(),
    });
    transaction.update(gigRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledByUid: organiserId,
      cancellationReason: 'cancelled',
    });
  });
}

export async function markArtistNoShow(gig: Gig) {
  if (gig.status !== 'filled' || !gig.acceptedApplicationId || !gig.acceptedArtistId) {
    throw new MarketplaceOperationError('gig-closed', 'Only a filled booking can be marked as a no-show.');
  }
  const gigRef = doc(db, 'gigs', gig.id);
  const applicationRef = doc(db, 'applications', gig.acceptedApplicationId);
  await runTransaction(db, async (transaction) => {
    const [applicationSnapshot, gigSnapshot] = await Promise.all([
      transaction.get(applicationRef),
      transaction.get(gigRef),
    ]);
    if (applicationSnapshot.data()?.status !== 'accepted' || gigSnapshot.data()?.status !== 'filled') {
      throw new MarketplaceOperationError('application-changed', 'This booking changed before the no-show was recorded.');
    }
    transaction.update(applicationRef, {
      status: 'cancelled',
      status_updatedAt: serverTimestamp(),
    });
    transaction.update(gigRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledByUid: gig.acceptedArtistId,
      cancellationReason: 'no_show',
      noShowUid: gig.acceptedArtistId,
    });
  });
}

export async function submitReview(review: Omit<Review, 'id' | 'createdAt'>) {
  const reviewId = `${review.gigId}_${review.fromUid}`;
  const reviewRef = doc(db, 'reviews', reviewId);
  await runTransaction(db, async (transaction) => {
    const existingReview = await transaction.get(reviewRef);
    if (existingReview.exists()) {
      throw new MarketplaceOperationError('application-changed', 'You already reviewed this completed gig.');
    }
    transaction.set(reviewRef, {
      ...review,
      score: Math.min(5, Math.max(1, Math.round(review.score))),
      comment: review.comment.trim().slice(0, 1000),
      createdAt: new Date().toISOString(),
    });
  });
}
