// These types describe the shape of the data stored in Firestore.
// Change a type here when you add/remove a field, then update the matching
// form, Firestore write, and security rule as well.
export type UserRole = 'organiser' | 'artist';

// One document in the /users collection.
export interface UserProfile {
  uid: string;
  name: string;
  role: UserRole;
  bio: string;
  genres: string[];
  location: string;
  rating: number;
  completedGigsCount: number;
  portfolio: string[];
  createdAt: string;
}

export type GigStatus = 'open' | 'filled' | 'completed' | 'cancelled';
export type CancellationReason = 'cancelled' | 'no_show';

// One document in the /gigs collection.
export interface Gig {
  id: string;
  organiserId: string;
  title: string;
  description: string;
  budget: number;
  date: string;
  location: string;
  genre: string;
  status: GigStatus;
  acceptedApplicationId?: string;
  acceptedArtistId?: string;
  filledAt?: unknown;
  completedAt?: unknown;
  cancelledAt?: unknown;
  cancelledByUid?: string;
  cancellationReason?: CancellationReason;
  noShowUid?: string;
  createdAt: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

// One document in the /applications collection.
export interface Application {
  id: string;
  gigId: string;
  artistId: string;
  organiserId: string;
  status: ApplicationStatus;
  appliedAt: string;
  gigTitle?: string;
  status_updatedAt?: unknown;
}

export interface Review {
  id: string;
  gigId: string;
  fromUid: string;
  toUid: string;
  score: number;
  comment: string;
  createdAt: string;
}
