import { Gig } from '../types';

export const GIG_GENRES = ['All', 'Jazz', 'Rock', 'Electronic', 'Pop', 'Classical', 'Indie', 'Folk'] as const;

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function filterGigs(gigs: Gig[], searchQuery: string, selectedGenre: string) {
  const query = normalize(searchQuery);
  const genre = normalize(selectedGenre);

  return gigs.filter((gig) => {
    const matchesGenre = genre === 'all' || normalize(gig.genre) === genre;
    if (!matchesGenre) return false;
    if (!query) return true;

    return [gig.title, gig.description, gig.genre, gig.location]
      .some((value) => normalize(value).includes(query));
  });
}
