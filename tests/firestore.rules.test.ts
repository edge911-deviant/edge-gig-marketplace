import { readFileSync } from 'node:fs';
import { after, afterEach, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-edge';
const ORGANISER_ID = 'organiser-1';
const ARTIST_ID = 'artist-1';
const OUTSIDER_ID = 'outsider-1';
const GIG_ID = 'gig-1';
const APPLICATION_ID = `${GIG_ID}_${ARTIST_ID}`;

let environment: RulesTestEnvironment;

const profile = (uid: string, role: 'organiser' | 'artist') => ({
  uid,
  name: role === 'artist' ? 'Test Artist' : 'Test Organiser',
  role,
  bio: '',
  genres: [],
  location: '',
  rating: 5,
  completedGigsCount: 0,
  portfolio: [],
  createdAt: '2026-08-11T00:00:00.000Z',
});

const openGig = () => ({
  organiserId: ORGANISER_ID,
  title: 'Warehouse Session',
  description: 'Live electronic performance.',
  budget: 12000,
  date: '2026-09-01T18:30:00.000Z',
  location: 'Kolkata',
  genre: 'Electronic',
  status: 'open',
  createdAt: '2026-08-11T00:00:00.000Z',
});

async function seedBase() {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await Promise.all([
      setDoc(doc(firestore, 'users', ORGANISER_ID), profile(ORGANISER_ID, 'organiser')),
      setDoc(doc(firestore, 'users', ARTIST_ID), profile(ARTIST_ID, 'artist')),
      setDoc(doc(firestore, 'users', OUTSIDER_ID), profile(OUTSIDER_ID, 'artist')),
      setDoc(doc(firestore, 'gigs', GIG_ID), openGig()),
    ]);
  });
}

async function applyAsArtist() {
  const firestore = environment.authenticatedContext(ARTIST_ID).firestore();
  await setDoc(doc(firestore, 'applications', APPLICATION_ID), {
    gigId: GIG_ID,
    artistId: ARTIST_ID,
    organiserId: ORGANISER_ID,
    status: 'pending',
    appliedAt: '2026-08-11T01:00:00.000Z',
    gigTitle: 'Warehouse Session',
    status_updatedAt: serverTimestamp(),
  });
}

async function acceptAsOrganiser() {
  const firestore = environment.authenticatedContext(ORGANISER_ID).firestore();
  await runTransaction(firestore, async (transaction) => {
    transaction.update(doc(firestore, 'applications', APPLICATION_ID), {
      status: 'accepted',
      status_updatedAt: serverTimestamp(),
    });
    transaction.update(doc(firestore, 'gigs', GIG_ID), {
      status: 'filled',
      acceptedApplicationId: APPLICATION_ID,
      acceptedArtistId: ARTIST_ID,
      filledAt: serverTimestamp(),
    });
  });
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8085,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterEach(async () => environment.clearFirestore());
after(async () => environment.cleanup());

describe('profiles', () => {
  test('allows a valid owner profile and blocks identity or role changes', async () => {
    const artistDb = environment.authenticatedContext(ARTIST_ID).firestore();
    await assertSucceeds(setDoc(doc(artistDb, 'users', ARTIST_ID), profile(ARTIST_ID, 'artist')));
    await assertFails(setDoc(doc(artistDb, 'users', OUTSIDER_ID), profile(OUTSIDER_ID, 'artist')));
    await assertSucceeds(updateDoc(doc(artistDb, 'users', ARTIST_ID), { bio: 'Live set specialist.' }));
    await assertFails(updateDoc(doc(artistDb, 'users', ARTIST_ID), { role: 'organiser' }));
  });
});

describe('applications and acceptance', () => {
  test('enforces deterministic, one-per-gig applications', async () => {
    await seedBase();
    await assertSucceeds(applyAsArtist());

    const artistDb = environment.authenticatedContext(ARTIST_ID).firestore();
    await assertFails(setDoc(doc(artistDb, 'applications', `forged-${ARTIST_ID}`), {
      gigId: GIG_ID,
      artistId: ARTIST_ID,
      organiserId: ORGANISER_ID,
      status: 'pending',
      appliedAt: '2026-08-11T01:00:00.000Z',
    }));
    await assertFails(setDoc(doc(artistDb, 'applications', APPLICATION_ID), {
      gigId: GIG_ID,
      artistId: ARTIST_ID,
      organiserId: ORGANISER_ID,
      status: 'pending',
      appliedAt: '2026-08-11T01:00:00.000Z',
    }));
  });

  test('requires organiser acceptance and the reciprocal gig transition', async () => {
    await seedBase();
    await applyAsArtist();
    const artistDb = environment.authenticatedContext(ARTIST_ID).firestore();
    await assertFails(updateDoc(doc(artistDb, 'applications', APPLICATION_ID), {
      status: 'accepted',
      status_updatedAt: serverTimestamp(),
    }));

    const organiserDb = environment.authenticatedContext(ORGANISER_ID).firestore();
    await assertFails(updateDoc(doc(organiserDb, 'applications', APPLICATION_ID), {
      status: 'accepted',
      status_updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(acceptAsOrganiser());
  });
});

describe('booking lifecycle and reviews', () => {
  test('allows completion and only participant reviews', async () => {
    await seedBase();
    await applyAsArtist();
    await acceptAsOrganiser();
    const organiserDb = environment.authenticatedContext(ORGANISER_ID).firestore();
    await assertSucceeds(updateDoc(doc(organiserDb, 'gigs', GIG_ID), {
      status: 'completed',
      completedAt: serverTimestamp(),
    }));

    const artistDb = environment.authenticatedContext(ARTIST_ID).firestore();
    await assertSucceeds(setDoc(doc(artistDb, 'reviews', `${GIG_ID}_${ARTIST_ID}`), {
      gigId: GIG_ID,
      fromUid: ARTIST_ID,
      toUid: ORGANISER_ID,
      score: 5,
      comment: 'Clear brief and smooth production.',
      createdAt: '2026-09-02T00:00:00.000Z',
    }));

    const outsiderDb = environment.authenticatedContext(OUTSIDER_ID).firestore();
    await assertFails(setDoc(doc(outsiderDb, 'reviews', `${GIG_ID}_${OUTSIDER_ID}`), {
      gigId: GIG_ID,
      fromUid: OUTSIDER_ID,
      toUid: ORGANISER_ID,
      score: 5,
      comment: '',
      createdAt: '2026-09-02T00:00:00.000Z',
    }));
  });

  test('requires accepted booking cancellation to be atomic', async () => {
    await seedBase();
    await applyAsArtist();
    await acceptAsOrganiser();
    const artistDb = environment.authenticatedContext(ARTIST_ID).firestore();
    await assertFails(updateDoc(doc(artistDb, 'applications', APPLICATION_ID), {
      status: 'cancelled',
      status_updatedAt: serverTimestamp(),
    }));

    await assertSucceeds(runTransaction(artistDb, async (transaction) => {
      transaction.update(doc(artistDb, 'applications', APPLICATION_ID), {
        status: 'cancelled',
        status_updatedAt: serverTimestamp(),
      });
      transaction.update(doc(artistDb, 'gigs', GIG_ID), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledByUid: ARTIST_ID,
        cancellationReason: 'cancelled',
      });
    }));
  });

  test('blocks reviews before a gig is completed', async () => {
    await seedBase();
    await applyAsArtist();
    await acceptAsOrganiser();
    const artistDb = environment.authenticatedContext(ARTIST_ID).firestore();
    await assert.rejects(() => setDoc(doc(artistDb, 'reviews', `${GIG_ID}_${ARTIST_ID}`), {
      gigId: GIG_ID,
      fromUid: ARTIST_ID,
      toUid: ORGANISER_ID,
      score: 4,
      comment: '',
      createdAt: '2026-09-01T00:00:00.000Z',
    }));
  });
});
