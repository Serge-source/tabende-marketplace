// Pure translation resolution — no framework imports, so it is unit-testable
// under plain Node and reusable by lib/i18n.js inside the Next bundle.

export function lookup(dict, key) {
  let node = dict;
  for (const part of key.split('.')) {
    node = node?.[part];
    if (node === undefined) return undefined;
  }
  return typeof node === 'string' ? node : undefined;
}

export function resolve(key, locale, dictionaries, fallbackLocale = 'en', vars = null, overrides = null) {
  let value =
    overrides?.[key] ??
    lookup(dictionaries[locale] || {}, key) ??
    lookup(dictionaries[fallbackLocale] || {}, key) ??
    key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${k}}`, String(v));
    }
  }
  return value;
}
