// Polyfill global for Supabase
if (typeof global === 'undefined') {
  (window as any).global = window;
}