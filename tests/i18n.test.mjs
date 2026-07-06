import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve as resolveKey, lookup } from '../lib/i18n-core.mjs';

const locales = ['en', 'nl', 'es', 'pap'];
const dicts = Object.fromEntries(
  locales.map((l) => [l, JSON.parse(readFileSync(new URL(`../locales/${l}.json`, import.meta.url)))])
);

function flatKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

test('all locale files parse and are non-empty', () => {
  for (const l of locales) {
    assert.ok(flatKeys(dicts[l]).length > 100, `${l} has enough keys`);
  }
});

test('every locale covers every English key (full parity)', () => {
  const enKeys = flatKeys(dicts.en);
  for (const l of ['nl', 'es', 'pap']) {
    const keys = new Set(flatKeys(dicts[l]));
    const missing = enKeys.filter((k) => !keys.has(k));
    assert.deepEqual(missing, [], `${l} missing: ${missing.join(', ')}`);
  }
});

test('papiamento translations are available and distinct from English', () => {
  assert.equal(lookup(dicts.pap, 'nav.browse'), 'Busca');
  assert.equal(lookup(dicts.pap, 'auth.welcomeBack'), 'Bon bini bek');
  assert.equal(lookup(dicts.pap, 'home.badge'), 'Cumpra & Bende Local');
  assert.notEqual(lookup(dicts.pap, 'home.heroText'), lookup(dicts.en, 'home.heroText'));
});

test('missing key in a locale falls back to English', () => {
  const partial = { ...dicts, nl: { nav: { browse: 'Ontdekken' } } };
  assert.equal(resolveKey('nav.browse', 'nl', partial), 'Ontdekken');
  assert.equal(resolveKey('dashboard.title', 'nl', partial), 'Dashboard'); // en fallback
  assert.equal(resolveKey('auth.signIn', 'nl', partial), lookup(dicts.en, 'auth.signIn'));
});

test('unknown key returns the key itself as a visible marker', () => {
  assert.equal(resolveKey('does.not.exist', 'pap', dicts), 'does.not.exist');
});

test('admin overrides win over locale files', () => {
  assert.equal(
    resolveKey('nav.browse', 'pap', dicts, 'en', null, { 'nav.browse': 'Buska Awor' }),
    'Buska Awor'
  );
});

test('variable interpolation works', () => {
  assert.equal(
    resolveKey('email.welcomeTitle', 'pap', dicts, 'en', { name: 'Serge' }),
    'Bon bini, Serge!'
  );
});

test('unknown locale falls back to English entirely', () => {
  assert.equal(resolveKey('nav.browse', 'fr', dicts), 'Browse');
});
