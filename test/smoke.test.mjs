import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../index.js';
import { roiScoreColor, computeRoiScore } from '../meetingDebrief.js';
import { airlineLogoFromIata } from '../airlineLogo.js';
import { applyContactFilters, buildContactFacets } from '../contactFilters.js';
import { calculateDistance } from '../distanceUtils.js';

test('subpath modules load and behave', () => {
  assert.equal(typeof computeRoiScore, 'function');
  assert.equal(roiScoreColor(80), '#4ade80');
  assert.match(airlineLogoFromIata('QF') || '', /QF/i);
  const contacts = [{ id: '1', name: 'Ada Lovelace', company: 'Analytical', city: 'London', country: 'UK' }, { id: '2', name: 'Alan Turing', company: 'Bletchley' }];
  const facets = buildContactFacets(contacts);
  assert.deepEqual(facets.surname, ['L', 'T']);
  assert.equal(applyContactFilters(contacts, { query: '', surname: ['T'], country: [], city: [], firm: [], sort: 'surname' }).length, 1);
  // Sydney → Melbourne ≈ 714 km
  const d = calculateDistance({ latitude: -33.87, longitude: 151.21 }, { latitude: -37.81, longitude: 144.96 });
  assert.ok(d > 650 && d < 800, `distance ${d}`);
});

test('index re-exports the modules', () => {
  assert.equal(core.roiScoreColor(10), '#94a3b8');
  assert.equal(typeof core.filterMeetings, 'function');
});

test('flightAirlineIata: two-character designators, not greedy', async () => {
  const { flightAirlineIata } = await import('../dist/airlineLogo.js');
  assert.equal(flightAirlineIata({ flightNumber: 'JL52' }), 'JL');
  assert.equal(flightAirlineIata({ flightNumber: 'JL0052' }), 'JL');
  assert.equal(flightAirlineIata({ flightNumber: 'QF25' }), 'QF');
  assert.equal(flightAirlineIata({ flightNumber: 'BA 456' }), 'BA');
  assert.equal(flightAirlineIata({ flightNumber: '3K123' }), '3K');
  assert.equal(flightAirlineIata({ flightNumber: 'U2456' }), 'U2');
  assert.equal(flightAirlineIata({ airlineIata: 'nh', flightNumber: 'x' }), 'NH');
});
