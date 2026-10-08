import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attributeSegments, attributedTranscript, nearestDevice, UNKNOWN } from '../speakerAttribution.js';

const T0 = 1_700_000_000_000;
// Two phones; Jon's hears Jon at -20 dB and Paul at -32; Paul's hears the reverse.
const meter = (uid, name, loudWhen) => ({ uid, name, samples: Array.from({ length: 120 }, (_, i) => { const t = T0 + i * 500; const sec = i / 2; return { t, db: loudWhen(sec) ? -20 : -32 }; }) });
const jonTalks = (sec) => sec < 20 || (sec >= 40 && sec < 50);
const paulTalks = (sec) => sec >= 20 && sec < 40;
const devices = [meter('jon', 'Jon', jonTalks), meter('paul', 'Paul', paulTalks)];
const segs = [
  { speaker: 'A', start: 0, end: 10, text: 'We should move the launch to Q2.' },
  { speaker: 'A', start: 10, end: 19, text: 'The Singapore team needs the time.' },
  { speaker: 'B', start: 20, end: 30, text: 'Agreed, though two more weeks would help.' },
  { speaker: 'B', start: 30, end: 39, text: 'I can confirm with Priya tomorrow.' },
  { speaker: 'A', start: 40, end: 49, text: 'Good. Let us lock it then.' },
  { speaker: 'C', start: 50, end: 58, text: 'One more thing on budget.' },        // nobody's phone was clearly nearest
];

test('the phone that heard it loudest names the speaker; labels resolve to owners; the rest stay anonymous', () => {
  const r = attributeSegments(segs, devices, T0);
  const A = r.labels.find((l) => l.label === 'A'), B = r.labels.find((l) => l.label === 'B'), C = r.labels.find((l) => l.label === 'C');
  assert.equal(A.name, 'Jon'); assert.equal(B.name, 'Paul'); assert.equal(C.name, UNKNOWN);
  assert.ok(A.confidence >= 0.6 && B.confidence >= 0.6);
  const txt = attributedTranscript(r.segments);
  assert.match(txt, /^Jon: We should move the launch to Q2\. The Singapore team needs the time\.\nPaul: Agreed/);
  assert.match(txt, /A participant: One more thing on budget\./);
});

test('a single phone proves nothing about proximity; equal loudness is undecided', () => {
  assert.equal(nearestDevice([devices[0]], T0, T0 + 5000), null);
  const same = [meter('a', 'A', () => true), meter('b', 'B', () => true)];
  assert.equal(nearestDevice(same, T0, T0 + 5000), null);
});

test('an owner is never handed to two labels', () => {
  const r = attributeSegments([...segs, { speaker: 'D', start: 0, end: 9, text: 'overlap' }], devices, T0);
  const owners = r.labels.filter((l) => l.uid).map((l) => l.uid);
  assert.equal(new Set(owners).size, owners.length);
});
