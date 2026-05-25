/**
 * HTML sanitizer for Tiptap content using DOMPurify.
 * Safe for use in the browser (client components only).
 * Falls back to basic regex stripping on the server.
 */

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class']

export function sanitizeHTML(html: string): string {
  if (!html) return ''

  // On the server (SSR) there is no DOM — strip tags to be safe
  if (typeof window === 'undefined') {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  // Dynamically require DOMPurify so it only runs client-side
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('dompurify')

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target'],
    FORCE_BODY: false,
  })
}
