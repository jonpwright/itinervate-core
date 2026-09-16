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
