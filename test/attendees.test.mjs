import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attendeeNames } from '../meetingFilterCore.js';

test('attendeeNames reads a JSON-string attendee array instead of showing raw JSON', () => {
  const names = attendeeNames({ attendees: '[{"name":"Kyowa","email":"k@example.com"},{"email":"jon@example.com"}]' });
  assert.deepEqual(names, ['Kyowa', 'jon@example.com']);
  assert.deepEqual(attendeeNames({ attendees: 'Ann, Bob' }), ['Ann', 'Bob']);
  assert.deepEqual(attendeeNames({ attendees: [{ name: 'Zoe' }, 'Max'] }), ['Zoe', 'Max']);
});
