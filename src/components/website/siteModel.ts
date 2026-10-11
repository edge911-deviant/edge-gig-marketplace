export type SiteRole = 'artist' | 'organiser' | 'venue' | 'audience';
export type DemoCity = 'Kolkata' | 'Mumbai' | 'Bengaluru';
export type DiscoveryMode = 'work' | 'shows';
export type DateOrder = 'soonest' | 'latest';
export type DemoSignal = { id: string; city: DemoCity; venue: string; genre: string; date: string; dateISO: string; time: string; title: string; show: string; budget: string; brief: string; duration: string };

export const siteRoles = [
  { id: 'artist', label: 'Artist', verb: 'Perform', headline: 'Find your next stage.', detail: 'Find a stage that fits your sound. Apply with your profile and keep every booking state in view.', action: 'Explore artist tools' },
  { id: 'organiser', label: 'Organiser', verb: 'Produce', headline: 'Bring the right act into the room.', detail: 'Publish a clear brief, compare applicants, and take the booking from open to completed.', action: 'Explore organiser tools' },
  { id: 'venue', label: 'Venue', verb: 'Host', headline: 'Give your open dates a purpose.', detail: 'Turn available dates into a programme. Bring the right artists into your space and manage the booking.', action: 'Explore venue tools' },
  { id: 'audience', label: 'Audience', verb: 'Discover', headline: 'Find a live moment worth showing up for.', detail: 'Explore artists and nearby live moments by place and sound. Discovery gets its own place in the network.', action: 'Explore audience tools' },
] as const;

export const siteRoleOrder: SiteRole[] = ['artist', 'organiser', 'venue', 'audience'];

export function getSiteRoleRoute(from: SiteRole, to: SiteRole): SiteRole[] {
  const fromIndex = siteRoleOrder.indexOf(from);
  const toIndex = siteRoleOrder.indexOf(to);
  const direction = fromIndex <= toIndex ? 1 : -1;
  const length = Math.abs(toIndex - fromIndex) + 1;
  return Array.from({ length }, (_, index) => siteRoleOrder[fromIndex + index * direction]);
}

export const bookingJourney = [
  { label: 'Brief', title: 'A clear brief starts it.', owner: 'Organiser + venue', detail: 'Set the date, place, sound, artist fee, and stage needs. Artists can decide whether the opportunity fits.', output: 'A complete opportunity', action: 'See a demo brief' },
  { label: 'Artist', title: 'The right context travels with the artist.', owner: 'Artist', detail: 'Apply once with a profile and performance links. The booking owner compares applications against the same brief.', output: 'An application with context', action: 'Explore artist tools' },
  { label: 'Booking', title: 'Keep the decision and the next steps together.', owner: 'Booking owner + artist', detail: 'Track the accepted artist and booking state through completion. History and mutual reviews help build trust.', output: 'A visible booking journey', action: 'See the full protocol' },
  { label: 'Show', title: 'A booked stage becomes a discoverable night.', owner: 'Host + audience', detail: 'EDGE plans host-approved public event details, so audiences can find the artists and shows around them.', output: 'A host-published live event', action: 'Explore demo shows' },
] as const;

export const demoCities: DemoCity[] = ['Kolkata', 'Mumbai', 'Bengaluru'];
export const demoPins: Record<string, DemoCity> = { '700001': 'Kolkata', '400001': 'Mumbai', '560001': 'Bengaluru' };

// Fictional public POC inventory. Never mix these records with authenticated gigs.
export const demoSignals: DemoSignal[] = [
  { id: 'CAL/01', city: 'Kolkata', venue: 'The Black Box', genre: 'Indie', date: '18 OCT', dateISO: '2026-10-18', time: '7:30 PM', title: 'Indie night support act', show: 'The city after dark', budget: '₹18,000', brief: 'A 45-minute opening set for a small-room indie night. Original material preferred; share a live performance link and your stage setup.', duration: '45-minute set' },
  { id: 'CAL/02', city: 'Kolkata', venue: 'Park Street Sessions', genre: 'Jazz', date: '24 OCT', dateISO: '2026-10-24', time: '8:00 PM', title: 'Late-night jazz trio', show: 'Blue hour sessions', budget: '₹24,000', brief: 'A three-piece jazz set for a seated listening room. Piano and house PA available. Include lineup, repertoire and technical needs.', duration: 'Two 40-minute sets' },
  { id: 'CAL/03', city: 'Kolkata', venue: 'Warehouse 07', genre: 'Electronic', date: '31 OCT', dateISO: '2026-10-31', time: '9:00 PM', title: 'Electronic live opener', show: 'Signal / after hours', budget: '₹20,000', brief: 'A live electronic opening slot. Share your setup, a recent live recording and the inputs needed for a quick stage change.', duration: '60-minute set' },
  { id: 'BOM/01', city: 'Mumbai', venue: 'Lower Parel Rooftop', genre: 'Jazz', date: '02 NOV', dateISO: '2026-11-02', time: '7:00 PM', title: 'Rooftop jazz trio', show: 'Jazz above the city', budget: '₹32,000', brief: 'An evening rooftop jazz programme. Acoustic or lightly amplified trio; include lineup and a live recording. House PA supplied.', duration: 'Two 45-minute sets' },
  { id: 'BOM/02', city: 'Mumbai', venue: 'Bandra Listening Room', genre: 'Indie', date: '08 NOV', dateISO: '2026-11-08', time: '8:00 PM', title: 'Acoustic indie duo', show: 'Songs from the west', budget: '₹22,000', brief: 'Original songs for an intimate listening room. A duo or solo act with an acoustic setup. Share repertoire and stage requirements.', duration: '50-minute set' },
  { id: 'BOM/03', city: 'Mumbai', venue: 'Dockside Studio', genre: 'Electronic', date: '14 NOV', dateISO: '2026-11-14', time: '9:30 PM', title: 'Hardware live set', show: 'Dockside frequencies', budget: '₹28,000', brief: 'A hardware-led electronic set. Include a live link, equipment list, input count and changeover time.', duration: '60-minute set' },
  { id: 'BLR/01', city: 'Bengaluru', venue: 'Indiranagar Sessions', genre: 'Electronic', date: '15 NOV', dateISO: '2026-11-15', time: '8:30 PM', title: 'Electronic live set', show: 'Frequency / Bengaluru', budget: '₹25,000', brief: 'A live electronic set in a standing room. Share a performance recording, stage footprint and a concise technical rider.', duration: '60-minute set' },
  { id: 'BLR/02', city: 'Bengaluru', venue: 'Church Street Room', genre: 'Indie', date: '21 NOV', dateISO: '2026-11-21', time: '7:30 PM', title: 'Original indie showcase', show: 'New voices / south', budget: '₹20,000', brief: 'A showcase slot for original indie artists. Solo, duo and small bands welcome. Include your lineup and a live performance link.', duration: '40-minute set' },
  { id: 'BLR/03', city: 'Bengaluru', venue: 'The Sunday Lounge', genre: 'Jazz', date: '29 NOV', dateISO: '2026-11-29', time: '6:00 PM', title: 'Sunday jazz quartet', show: 'A slower Sunday', budget: '₹30,000', brief: 'A Sunday jazz programme for a seated audience. Share the quartet lineup, a recent recording and instrument requirements.', duration: 'Two 45-minute sets' },
];

export function resolveDemoPlace(input: string): { city: DemoCity; error?: never } | { city?: never; error: string } {
  const value = input.trim();
  const pin = Object.hasOwn(demoPins, value) ? demoPins[value] : undefined;
  if (pin) return { city: pin };
  const aliases: Record<string, DemoCity> = { kolkata: 'Kolkata', calcutta: 'Kolkata', mumbai: 'Mumbai', bombay: 'Mumbai', bengaluru: 'Bengaluru', bangalore: 'Bengaluru' };
  const name = value.toLowerCase();
  const place = Object.hasOwn(aliases, name) ? aliases[name] : undefined;
  if (place) return { city: place };
  if (!value) return { error: 'Enter a demo PIN or city, such as 700001 or Kolkata.' };
  if (/^\d+$/.test(value) && !/^[1-9]\d{5}$/.test(value)) return { error: 'Enter a six-digit PIN code, such as 700001, or choose a demo city.' };
  return { error: 'This demo covers Kolkata (700001), Mumbai (400001), and Bengaluru (560001). Try one of these places.' };
}

export function getDemoSignals(city: DemoCity, genre = 'All sounds', order: DateOrder = 'soonest') {
  return demoSignals.filter((signal) => signal.city === city && (genre === 'All sounds' || signal.genre === genre))
    .sort((a, b) => (order === 'soonest' ? 1 : -1) * a.dateISO.localeCompare(b.dateISO));
}
