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

test('speechText: markdown reads aloud sensibly', async () => {
  const { speechText } = await import('../dist/speechText.js');
  const md = `### Your Tokyo trip\n\n- **Flight:** JAL JL52 SYD → HND, departs 08:55\n- **Hotel:** [Park Hyatt](https://example.com) 4 nights\n\n| Meeting | Time |\n|---|---|\n| Kanda renewal | 10:00 |\n| Tsukuba pitch | 14:00 |\n| Dinner | 19:30 |\n| Debrief | 21:00 |\n\nROI so far: 0%`;
  const out = speechText(md);
  assert.ok(!/[*#|\[\]]/.test(out), out);
  assert.ok(out.includes('Your Tokyo trip.'));
  assert.ok(out.includes('SYD to HND'));
  assert.ok(out.includes('Park Hyatt') && !out.includes('example.com'));
  assert.ok(out.includes('4 rows. Meeting: Kanda renewal, Tsukuba pitch, Dinner, and more in the message.'));
  assert.ok(out.includes('R O I'));
});

test('speechText: long answers are cut at a sentence with a spoken tail', async () => {
  const { speechText } = await import('../dist/speechText.js');
  const out = speechText(Array.from({ length: 80 }, (_, i) => `Sentence number ${i} is here.`).join(' '), { maxChars: 300 });
  assert.ok(out.length < 340);
  assert.ok(out.endsWith('and more in the message.'));
});

import { detectLanguage, speechLocaleFor } from '../dist/languageDetect.js';
test('detectLanguage: scripts and stop words', () => {
  assert.equal(detectLanguage('次の会議はいつですか？'), 'ja');
  assert.equal(detectLanguage('我的下一个会议是什么时候？'), 'zh');
  assert.equal(detectLanguage('다음 회의는 언제인가요?'), 'ko');
  assert.equal(detectLanguage('Quelle est ma prochaine réunion à Tokyo ?'), 'fr');
  assert.equal(detectLanguage('¿Cuál es mi próxima reunión?'), 'es');
  assert.equal(detectLanguage('Wann ist mein nächstes Meeting in Tokio?'), 'de');
  assert.equal(detectLanguage('What is my next meeting in Tokyo?'), 'en');
  assert.equal(detectLanguage('Коли моя наступна зустріч?'), 'uk');
  assert.equal(detectLanguage('Когда моя следующая встреча?'), 'ru');
  assert.equal(detectLanguage('JL52'), null);
});
test('speechLocaleFor picks regional defaults, honours a matching preference', () => {
  assert.equal(speechLocaleFor('ja'), 'ja-JP');
  assert.equal(speechLocaleFor('en', 'en-AU'), 'en-AU');
  assert.equal(speechLocaleFor('en', 'ja-JP'), 'en-US');
});
