// Masks contact info and off-platform payment references in chat messages
// so transactions stay on the platform. Conservative patterns to avoid
// mangling prices, years, or addresses.

const MASK = '[hidden — keep transactions on Tabende]';

const PATTERNS = [
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone numbers: 7+ digits allowing spaces, dashes, dots, parens between
  // (won't match prices like 1,000 or years like 2026)
  /(?:\+?\d[\s\-.()]?){7,15}\d/g,
  // Payment services, optionally followed by an @handle or :handle
  /\b(?:venmo|cash\s?app|cashapp|zelle|paypal(?:\.me)?|revolut)\b(?:\s*[:@]\s*[\w.-]+)?/gi,
  // Messaging apps used to move the conversation off-platform
  /\b(?:whatsapp|telegram|signal)\b(?:\s*[:@]\s*[\w+.-]+)?/gi,
];

export function scrubContactInfo(text) {
  let scrubbed = text;
  let flagged = false;
  for (const pattern of PATTERNS) {
    if (pattern.test(scrubbed)) {
      flagged = true;
      scrubbed = scrubbed.replace(pattern, MASK);
    }
    pattern.lastIndex = 0;
  }
  return { content: scrubbed, flagged };
}
