/**
 * Decides, before the homepage first appears, whether the golf ball intro plays. Runs in the
 * page's <head> (src/app/(marketing)/layout.tsx), so nobody sees a flash of the page before the
 * intro, or of the intro when it won't play.
 *
 * It plays only when all of these hold:
 * - the visitor's device doesn't ask for reduced motion,
 * - it's the first time this session (HomeIntro marks the session once it starts), or the page
 *   was refreshed (a refresh or hard refresh always replays it, so it's easy to show to others),
 * - the address doesn't point to a section further down (#…),
 * - the browser has 3D graphics (WebGL 2), and the visitor hasn't asked to save data.
 *
 * Then it sets <html data-intro="play">, which hides the nav and page (marketing.css) until the
 * intro reveals them. If the intro's code hasn't started within a few seconds (slow or failed
 * download), it gives up and shows the page, so the intro can never leave a visitor stuck.
 */
export const INTRO_SEEN_KEY = 'mk-intro-seen'
export const INTRO_GIVE_UP_MS = 4000

export const introGateScript = `(function () {
  try {
    var html = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var nav = window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType('navigation')[0]
      : null;
    var refreshed = !!nav && nav.type === 'reload';
    if (!refreshed && window.sessionStorage.getItem('${INTRO_SEEN_KEY}')) return;
    if (window.location.hash) return;
    if (!window.WebGL2RenderingContext) return;
    if (navigator.connection && navigator.connection.saveData) return;
    if (refreshed) html.setAttribute('data-intro-refresh', '');
    if (refreshed && window.history && 'scrollRestoration' in window.history) {
      // A refresh would put the page back where it was scrolled to, which skips the intro.
      window.history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }
    html.setAttribute('data-intro', 'play');
    window.setTimeout(function () {
      if (html.hasAttribute('data-intro-started')) return;
      html.removeAttribute('data-intro');
      html.removeAttribute('data-intro-refresh');
      if (window.history && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    }, ${INTRO_GIVE_UP_MS});
  } catch (error) {
    // Storage blocked or anything else unexpected: no intro, the page shows as normal.
  }
})();`
