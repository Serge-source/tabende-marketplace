# Translations Guide — Ta Bende Bon

The app supports four languages. **Papiamento is the default.**

| Code | Language    | File                |
|------|-------------|---------------------|
| pap  | Papiamento  | `locales/pap.json`  |
| en   | English     | `locales/en.json`   |
| nl   | Nederlands  | `locales/nl.json`   |
| es   | Español     | `locales/es.json`   |

## How resolution works

`t('dashboard.title')` resolves in this order:

1. **Admin override** — a row in the `Translation` table (locale + key)
2. **The locale's JSON file** — `locales/<locale>.json`
3. **English** — automatic fallback for keys missing in nl/es/pap
4. **The key itself** — a visible marker that a string was never translated

The user's choice is stored in `localStorage` (works logged out) and on the
`User.language` column (restored at login on any device).

## Using translations in components

```jsx
import { useT } from '@/components/I18nProvider';

function MyComponent() {
  const t = useT();
  return <button>{t('buttons.save')}</button>;
}
```

Server-side (API routes, emails):

```js
import { t } from '@/lib/i18n';
t('email.welcomeSubject', user.language);              // per-user locale
t('email.welcomeTitle', 'pap', { name: user.name });   // {name} interpolation
```

## Adding a new string

1. Add the key to **`locales/en.json` first** (English is the fallback and
   the source of truth for key parity).
2. Add the same key to `nl.json`, `es.json`, and `pap.json`.
3. The unit test `tests/i18n.test.mjs` fails CI if any locale is missing a
   key that exists in English — so you can't forget step 2.
4. For Papiamento, use natural Aruban wording (papiamento.aw spelling:
   *cumpra*, *bende*, *busca*, *mensahe*) — never literal machine output.

## Updating translations WITHOUT a deploy (admins)

Admin Panel → **Translations** tab:

1. Pick the locale.
2. Enter the key (e.g. `dashboard.title`) and the new text, hit Save.
3. The override is stored in the database and takes priority over the JSON
   file for every user on their next page load. Delete the override to
   return to the file value.

## Adding a whole new language

1. Create `locales/<code>.json` (copy `en.json`, translate the values).
2. Register it in `lib/i18n.js`: import the file, add it to `DICTIONARIES`
   and `LANGUAGES` (label shown in the selector).
3. Add the code to the `isValidLocale` set automatically via DICTIONARIES.
4. Run `node --test tests/i18n.test.mjs`.

## Tests

- `tests/i18n.test.mjs` (runs in CI): locale parsing, full key parity,
  Papiamento availability, English fallback, override priority,
  interpolation, unknown-locale handling.
- `e2e/i18n.spec.js` (runs in CI): Papiamento default, selecting each of
  the four languages, persistence across reloads, major screens rendering
  in the selected language.
