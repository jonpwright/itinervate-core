import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedWallClockToInstant, tzOffsetMinutes, isValidTimeZone, meetingStart, isPastMeeting } from '../dist/index.js';

test('Singapore 11:30 is 03:30Z; Sydney (AEST) 11:30 is 01:30Z', () => {
  assert.equal(zonedWallClockToInstant('2026-09-16', '11:30', 'Asia/Singapore').toISOString(), '2026-09-16T03:30:00.000Z');
  assert.equal(zonedWallClockToInstant('2026-09-16', '11:30', 'Australia/Sydney').toISOString(), '2026-09-16T01:30:00.000Z');
  assert.equal(tzOffsetMinutes('Asia/Singapore', new Date('2026-09-16T00:00:00Z')), 480);
});

test('DST: Sydney 11:30 in late October is AEDT (00:30Z)', () => {
  assert.equal(zonedWallClockToInstant('2026-10-20', '11:30', 'Australia/Sydney').toISOString(), '2026-10-20T00:30:00.000Z');
});

test('a Singapore meeting is not past when viewed from Sydney two hours ahead', () => {
  const m = { date: '2026-09-16', time: '11:30', duration: 60, timezone: 'Asia/Singapore' };
  assert.equal(isPastMeeting(m, new Date('2026-09-16T02:50:00Z')), false); // 12:50 AEST = 10:50 SGT
  assert.equal(isPastMeeting(m, new Date('2026-09-16T04:31:00Z')), true);  // 12:31 SGT
  assert.equal(meetingStart(m).toISOString(), '2026-09-16T03:30:00.000Z');
});

test('invalid or missing zone falls back to device-local parsing', () => {
  assert.equal(isValidTimeZone('Not/AZone'), false);
  assert.equal(isValidTimeZone(undefined), false);
  assert.ok(meetingStart({ date: '2026-09-16', time: '11:30' }) instanceof Date);
});

test('zonedTimeLabel: venue zone + viewer translation with GMT offsets', async () => {
  const { zonedTimeLabel, gmtOffsetLabel } = await import('../dist/index.js');
  const l = zonedTimeLabel('2026-09-16', '11:30', 'Asia/Singapore', 'Australia/Sydney');
  assert.equal(l.time, '11:30'); assert.match(l.zone, /GMT\+8\)$/); assert.match(l.viewer, /^13:30 .*GMT\+10\)$/); assert.equal(l.viewerDayShift, '');
  const ny = zonedTimeLabel('2026-09-16', '21:00', 'Asia/Tokyo', 'America/New_York');
  assert.match(ny.viewer, /^08:00 .*GMT-4\)$/); assert.equal(ny.viewerDayShift, '');            // 21:00 JST = 08:00 EDT same day
  const late = zonedTimeLabel('2026-09-16', '09:00', 'Asia/Tokyo', 'America/Los_Angeles');
  assert.equal(late.viewerDayShift, '-1');                                                       // 09:00 JST 16th = 17:00 PDT 15th
  assert.equal(zonedTimeLabel('2026-09-16', '11:30', 'Asia/Singapore', 'Asia/Singapore').viewer, null);
  assert.equal(gmtOffsetLabel('Asia/Kolkata', new Date('2026-09-16T00:00:00Z')), 'GMT+5:30');
});
