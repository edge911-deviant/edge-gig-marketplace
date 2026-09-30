import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingJourney, demoSignals, getDemoSignals, resolveDemoPlace, siteRoles } from './siteModel';

test('all four profile pillars and the complete product journey are explicit', () => {
  assert.deepEqual(siteRoles.map((role) => role.id), ['artist', 'organiser', 'venue', 'audience']);
  assert.deepEqual(bookingJourney.map((step) => step.label), ['Brief', 'Artist', 'Booking', 'Show']);
  assert.match(bookingJourney[3].detail, /plans host-approved/);
});
test('demo location accepts supported PINs, cities and common aliases', () => {
  for (const [input, city] of [['700001', 'Kolkata'], ['400001', 'Mumbai'], ['560001', 'Bengaluru'], ['  MuMbAi  ', 'Mumbai'], ['Bangalore', 'Bengaluru'], ['Calcutta', 'Kolkata']]) {
    assert.deepEqual(resolveDemoPlace(input), { city });
  }
});
test('invalid or unsupported places have recoverable errors, not guessed locations', () => {
  for (const input of ['', '123', '000001', '999999', 'Delhi', '__proto__', 'constructor', 'toString']) {
    assert.ok(resolveDemoPlace(input).error, input);
  }
});
test('dated city timelines sort both directions without mutating source data', () => {
  const original = demoSignals.map((signal) => signal.id);
  assert.deepEqual(getDemoSignals('Kolkata').map((signal) => signal.dateISO), ['2026-10-18', '2026-10-24', '2026-10-31']);
  assert.deepEqual(getDemoSignals('Mumbai', 'All sounds', 'latest').map((signal) => signal.dateISO), ['2026-11-14', '2026-11-08', '2026-11-02']);
  assert.deepEqual(demoSignals.map((signal) => signal.id), original);
});
test('shared genre filters produce truthful single-result and empty states', () => {
  assert.equal(getDemoSignals('Bengaluru', 'Jazz').length, 1);
  assert.equal(getDemoSignals('Mumbai', 'Unsupported sound').length, 0);
  assert.equal(getDemoSignals('Kolkata').length, 3);
  assert.equal(new Set(demoSignals.map((signal) => signal.id)).size, demoSignals.length);
});
