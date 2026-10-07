import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCancelledBooking, liveBookings } from '../bookingStatus.js';

test('isCancelledBooking covers every way a booking dies', () => {
  assert.equal(isCancelledBooking({ status: 'cancelled' }), true);
  assert.equal(isCancelledBooking({ confirmationStatus: 'cancelled' }), true);
  assert.equal(isCancelledBooking({ cancellation: { via: 'duffel' } }), true);
  assert.equal(isCancelledBooking({ status: 'confirmed', tripId: 't1' }, [{ id: 't1', status: 'cancelled' }]), true);
  assert.equal(isCancelledBooking({ status: 'confirmed', tripId: 't2' }, [{ id: 't1', status: 'cancelled' }]), false);
  assert.equal(isCancelledBooking({ status: 'Confirmed' }), false);
  assert.equal(isCancelledBooking(null), false);
});

test('liveBookings keeps order and drops the cancelled', () => {
  const out = liveBookings([{ id: 'a', status: 'confirmed' }, { id: 'b', status: 'cancelled' }, { id: 'c', tripId: 'tx' }], [{ id: 'tx', status: 'cancelled' }]);
  assert.deepEqual(out.map((x) => x.id), ['a']);
});
