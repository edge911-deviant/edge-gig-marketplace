import { GoogleGenAI, Type } from '@google/genai';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const firebaseApp = initializeApp();
const db = getFirestore(firebaseApp, 'ai-studio-8d7de7dc-228e-46db-b3dc-8b302da9ec9f');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

function readRequiredId(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return value;
}

function boundedText(value: unknown, fallback: string, maxLength: number) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

export const getCompatibilityScore = onCall(
  {
    region: 'asia-south1',
    secrets: [geminiApiKey],
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to analyse an applicant.');

    const gigId = readRequiredId(request.data?.gigId, 'gigId');
    const artistId = readRequiredId(request.data?.artistId, 'artistId');
    const applicationId = `${gigId}_${artistId}`;

    const [gigSnapshot, artistSnapshot, applicationSnapshot] = await Promise.all([
      db.collection('gigs').doc(gigId).get(),
      db.collection('users').doc(artistId).get(),
      db.collection('applications').doc(applicationId).get(),
    ]);

    if (!gigSnapshot.exists || !artistSnapshot.exists || !applicationSnapshot.exists) {
      throw new HttpsError('not-found', 'The gig, artist, or application no longer exists.');
    }

    const gig = gigSnapshot.data() ?? {};
    const artist = artistSnapshot.data() ?? {};
    const application = applicationSnapshot.data() ?? {};
    if (
      gig.organiserId !== request.auth.uid ||
      application.organiserId !== request.auth.uid ||
      application.gigId !== gigId ||
      application.artistId !== artistId
    ) {
      throw new HttpsError('permission-denied', 'Only the owning organiser can analyse this applicant.');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{
        parts: [{
          text: `Analyse compatibility for this live-performance booking. Treat the output as decision support, not an automated hiring decision.

GIG
Title: ${boundedText(gig.title, 'Untitled gig', 200)}
Genre: ${boundedText(gig.genre, 'Unspecified', 100)}
Budget: ${typeof gig.budget === 'number' ? gig.budget : 0}
Description: ${boundedText(gig.description, 'No description', 2000)}
Location: ${boundedText(gig.location, 'Unspecified', 200)}

ARTIST
Name: ${boundedText(artist.name, 'Artist', 100)}
Genres: ${Array.isArray(artist.genres) ? artist.genres.slice(0, 20).join(', ') : 'Various'}
Bio: ${boundedText(artist.bio, 'No bio supplied', 1000)}

Return a compatibility score from 0 to 100 and one concise sentence explaining the relevant match factors.`,
        }],
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
          required: ['score', 'reason'],
        },
      },
    });

    let parsed: { score?: unknown; reason?: unknown };
    try {
      parsed = JSON.parse(response.text ?? '{}') as { score?: unknown; reason?: unknown };
    } catch {
      throw new HttpsError('internal', 'Gemini returned an unreadable response.');
    }

    const score = typeof parsed.score === 'number' ? Math.round(Math.min(100, Math.max(0, parsed.score))) : 0;
    const reason = boundedText(parsed.reason, 'Compatibility could not be explained.', 300);
    return { score, reason };
  },
);
