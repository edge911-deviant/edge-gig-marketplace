import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface CompatibilityAnalysis {
  score: number;
  reason: string;
}

const requestCompatibilityScore = httpsCallable<
  { gigId: string; artistId: string },
  CompatibilityAnalysis
>(functions, 'getCompatibilityScore');

// Compatibility decisions run in a callable Firebase Function. The browser
// sends only document IDs; the trusted backend verifies the organiser,
// application relationship, and source records before contacting Gemini.
export async function getCompatibilityScore(gigId: string, artistId: string) {
  const response = await requestCompatibilityScore({ gigId, artistId });
  return response.data;
}
