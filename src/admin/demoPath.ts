/**
 * The same path as demoBase in src/site/demo.ts (tests/unit/demo-link-field.spec.ts keeps them
 * equal). Written out here because that file uses Node's crypto, which can't run in the browser.
 */
export const demoPath = (slug: string, token: string) => `/demo/${slug}-${token}`
