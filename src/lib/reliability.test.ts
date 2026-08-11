import assert from 'node:assert/strict';
import test from 'node:test';
import { Gig } from '../types';
import { averageRating, calculateReliability } from './reliability';

const baseGig = {
  organiserId: 'organiser-1',
  title: 'Test gig',
  description: 'Test',
  budget: 100,
  date: '2026-08-20',
  location: 'Kolkata',
  genre: 'Jazz',
  createdAt: '2026-08-01T00:00:00.000Z',
} as const;

test('calculates reliability from completed, user-cancelled, and no-show outcomes', () => {
  const gigs: Gig[] = [
    { ...baseGig, id: '1', status: 'completed' },
    { ...baseGig, id: '2', status: 'completed' },
    { ...baseGig, id: '3', status: 'cancelled', cancelledByUid: 'artist-1', cancellationReason: 'cancelled' },
    { ...baseGig, id: '4', status: 'cancelled', cancelledByUid: 'artist-1', cancellationReason: 'no_show', noShowUid: 'artist-1' },
    { ...baseGig, id: '5', status: 'cancelled', cancelledByUid: 'other-user', cancellationReason: 'cancelled' },
  ];

  assert.deepEqual(calculateReliability(gigs, 'artist-1'), {
    completed: 2,
    userCancelled: 1,
    noShows: 1,
    reliability: 50,
  });
});

test('returns no reliability before a scored outcome exists', () => {
  assert.equal(calculateReliability([], 'artist-1').reliability, null);
});

test('averages review scores to one decimal place', () => {
  assert.equal(averageRating([5, 4, 4]), 4.3);
  assert.equal(averageRating([]), null);
});
