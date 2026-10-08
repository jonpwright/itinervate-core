import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findRideMatches, scopeAllows, anonymousProposal } from '../sharedRides.js';

const t0 = Date.parse('2026-11-25T09:00:00Z');
const c = (uid, minsAfter, dest, prefs = { scope: 'any' }) => ({ uid, airport: 'SIN', landsAt: t0 + minsAfter * 60000, flightId: `f-${uid}`, dest, prefs });
const marina = { lat: 1.2834, lng: 103.8607, label: 'Marina Bay Sands', areaLabel: 'Marina Bay' };
const orchard = { lat: 1.3048, lng: 103.8318, label: 'Orchard Hotel', areaLabel: 'Orchard' };
const changiBiz = { lat: 1.3339, lng: 103.9617, label: 'Changi Business Park', areaLabel: 'Changi' };

test('two members landing close together, heading to nearby places, are matched; a far destination or a long gap is not', () => {
  const m = findRideMatches([c('a', 0, marina), c('b', 15, orchard), c('c', 10, changiBiz), c('d', 60, marina)]);
  assert.equal(m.length, 1);
  assert.deepEqual([m[0].a.uid, m[0].b.uid].sort(), ['a', 'b']);
  assert.equal(m[0].gapMin, 15); assert.ok(m[0].destKm <= 4);
  assert.equal(m[0].meetAt, t0 + 15 * 60000 + 35 * 60000, 'meet when the later one is through the airport');
});

test('each person is in at most one match, the best one', () => {
  const m = findRideMatches([c('a', 0, marina), c('b', 5, marina), c('x', 8, marina)]);
  assert.equal(m.length, 1); assert.ok(m[0].gapMin <= 5);
});

test('scope preferences must be satisfied on both sides; blocks are honoured', () => {
  const acme = { scope: 'company', company: 'Acme' }, acme2 = { scope: 'any', company: 'Acme' }, other = { scope: 'any', company: 'Other' };
  assert.equal(scopeAllows(c('a', 0, marina, acme), c('b', 0, marina, acme2)), true);
  assert.equal(scopeAllows(c('a', 0, marina, acme), c('b', 0, marina, other)), false);
  assert.equal(findRideMatches([c('a', 0, marina), c('b', 5, marina)], { a: new Set(['b']) }).length, 0);
});

test('before mutual acceptance the other side is only a time and an area', () => {
  const [m] = findRideMatches([c('a', 0, marina), c('b', 12, orchard)]);
  const p = anonymousProposal(m, 'a');
  assert.equal(p.otherLandsInMin, 12); assert.equal(p.otherArea, 'Orchard');
  assert.equal(Object.keys(p).some((k) => /uid|name|email|company/.test(k)), false);
});
