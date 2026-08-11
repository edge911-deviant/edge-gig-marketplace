import { Gig } from '../types';

export interface ReliabilitySummary {
  completed: number;
  userCancelled: number;
  noShows: number;
  reliability: number | null;
}

export function calculateReliability(gigs: Gig[], userId: string): ReliabilitySummary {
  const completed = gigs.filter((gig) => gig.status === 'completed').length;
  const noShows = gigs.filter((gig) => gig.noShowUid === userId).length;
  const userCancelled = gigs.filter((gig) => (
    gig.status === 'cancelled' &&
    gig.cancelledByUid === userId &&
    gig.cancellationReason !== 'no_show'
  )).length;
  const scoredOutcomes = completed + userCancelled + noShows;

  return {
    completed,
    userCancelled,
    noShows,
    reliability: scoredOutcomes === 0 ? null : Math.round((completed / scoredOutcomes) * 100),
  };
}

export function averageRating(scores: number[]) {
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10;
}
