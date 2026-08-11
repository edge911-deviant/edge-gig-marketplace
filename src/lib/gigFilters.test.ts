import assert from 'node:assert/strict';
import test from 'node:test';
import { Gig } from '../types';
import { filterGigs } from './gigFilters';

const gigs: Gig[] = [
  {
    id: 'jazz-gig',
    organiserId: 'organiser-1',
    title: 'Underground Jazz Jam',
    description: 'Late-night quartet needed',
    budget: 500,
    date: '2026-08-20',
    location: 'Kolkata',
    genre: 'Jazz',
    status: 'open',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'electronic-gig',
    organiserId: 'organiser-2',
    title: 'Rooftop Session',
    description: 'Electronic live set',
    budget: 900,
    date: '2026-08-22',
    location: 'Mumbai',
    genre: 'Electronic',
    status: 'open',
    createdAt: '2026-08-02T00:00:00.000Z',
  },
];

test('returns every gig when no filters are active', () => {
  assert.deepEqual(filterGigs(gigs, '', 'All'), gigs);
});

test('searches title, description, genre, and location without case sensitivity', () => {
  assert.deepEqual(filterGigs(gigs, 'KOLKATA', 'All').map((gig) => gig.id), ['jazz-gig']);
  assert.deepEqual(filterGigs(gigs, 'live set', 'All').map((gig) => gig.id), ['electronic-gig']);
});

test('combines genre and text filters', () => {
  assert.deepEqual(filterGigs(gigs, 'session', 'Electronic').map((gig) => gig.id), ['electronic-gig']);
  assert.deepEqual(filterGigs(gigs, 'session', 'Jazz'), []);
});
