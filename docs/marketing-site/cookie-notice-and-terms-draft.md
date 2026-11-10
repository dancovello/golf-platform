# Cookie notice and Terms for a1engine.co (drafts)

**Written:** 10 November 2026 · **Status:** DRAFTS. Not checked by a solicitor. The privacy policy (`privacy-policy-company.md`) was built from wording the solicitor had approved; these two were not, so they should be seen by the solicitor before they are published, the Terms especially (they limit liability and set the governing law).

How to paste each one: in the admin, Marketing → Pages → the page. Delete the line in double square brackets, paste the text, make the numbered lines headings, set the "last reviewed" date, then Publish. Publishing each page also makes its footer link appear (the footer hides links to unpublished pages).

## What the cookie notice is based on (checked in the code, 10 Nov)

- The banner asks before Google Analytics loads. Nothing from Google loads until you accept (`src/site/privacy/CookieConsent.tsx`).
- Your choice is saved in the browser's local storage under `cookie-consent:marketing`.
- The golf ball opening animation sets a flag in the browser's session storage, cleared when the tab closes (`src/marketing/intro/`).
- When analytics is switched off after being on, the Google Analytics cookies are removed.
- Google Analytics' standard cookies are `_ga` and `_ga_` followed by the measurement ID, kept up to 2 years (Google's documented default). The data itself is kept 14 months (the Google Analytics retention setting).
- Cloudflare Turnstile checks the two forms; as in the approved privacy policy, it needs no consent.

## Open points for the solicitor and Dan

- Terms: whether to name England and Wales as the governing law (written that way, as Dan is in Cardiff).
- Terms: the liability wording is a standard plain-English version and should be reviewed.
- Terms do not repeat the minimum term or notice period; they refer to the agreement each club signs. The pricing page takes those numbers from the admin settings.
- The cookie notice names the cookie names and lifetimes above; if Google changes them, the notice needs updating.

---

## COOKIE NOTICE (paste into the Cookie notice page)

```text
This notice explains the cookies and similar technologies a1engine.co uses, and what each one is for. It goes with our privacy policy, which explains how we use personal information.

1. What cookies are

Cookies are small files a website saves in your browser. Similar technologies, such as your browser's local storage, do the same job. Some are needed for a site to work. Others are optional, and we only use those if you say yes.

2. Essential

These make the site work and don't need your consent.

- Your cookie choice. We save whether you accepted or rejected analytics cookies in your browser's local storage, so we don't keep asking. It stays until you clear your browser's data or change your choice.
- The opening animation. On the home page, your browser remembers for the rest of your visit that you have seen the golf ball animation, so it doesn't play again as you move around. It is removed when you close the tab or window.
- Spam protection. Our request and booking forms use Cloudflare Turnstile to check that a message comes from a person, not a robot. It looks at technical details of your browser when you use a form, doesn't track you across websites, and doesn't need consent.

3. Analytics (only if you accept)

If you accept analytics cookies in our cookie banner, we use Google Analytics to understand how visitors use the site, such as which pages are read. It sets two cookies:

- _ga, which tells visitors apart. It lasts up to 2 years.
- _ga_ followed by our measurement ID, which keeps track of a visit. It lasts up to 2 years.

They collect the pages you view, your device and browser type, your approximate location (country or region) and the site that sent you. Google keeps this data for us for 14 months. Nothing from Google loads until you accept.

4. Your choice

You can accept or reject analytics cookies in the banner when you first visit. To change your mind at any time, use the "Cookie settings" link in the footer. If you switch analytics off, we remove the Google Analytics cookies we set.

You can also block or delete cookies in your browser's settings. If you block all cookies, the site still works, but your cookie choice can't be remembered.

5. More information

Our privacy policy explains how we use personal information and your rights. If you have a question about cookies, email daniel@a1engine.co.
```

---

## TERMS (paste into the Terms page)

```text
These terms explain how you may use our website, a1engine.co. By using it, you agree to them. If you don't agree, please don't use the site.

1. Who we are

The website is run by Daniel Covello, trading as A1 Engine, of 41 Clarence Embankment, Cardiff, CF10 5GR. You can email us at daniel@a1engine.co.

2. What the site is for

The site tells golf clubs about the websites we build and run, and lets you ask us to build a homepage for your club or book a demo call. What it shows is for information. It isn't an offer, and nothing is agreed until you sign up.

3. Our service

Clubs sign up under a separate agreement that we send before you commit. It sets out the monthly cost, the one-off setup fee (which depends on the size and needs of your club), the minimum term and how to cancel. It also includes our data processing agreement. If anything in these terms conflicts with that agreement, the agreement applies to the service.

4. Using the site

Please use the site honestly. You must not:

- try to break into, overload or interfere with the site or the systems behind it
- use automated tools to copy the site or to send forms in bulk
- send us anything unlawful, or information about someone else without their permission
- pretend to be another person or club

We may block anyone who does.

5. Our content

The text, design, pictures, logos and code on the site belong to us or to the people who license them to us. You may view the site, and print or share a page, to find out about our service. You may not copy or reuse it for another purpose without our written permission.

6. Links to other sites

The site may link to other websites. We don't control them and aren't responsible for them.

7. Availability and accuracy

We try to keep the site accurate and running, but we can't promise it will always be available or free of mistakes. We may change or remove parts of it at any time.

8. Our responsibility

Nothing in these terms limits anything that the law doesn't allow us to limit, including responsibility for death or personal injury caused by our negligence, or for fraud. Otherwise, we aren't responsible for losses that result from using the website, or from not being able to use it, except where we have broken the law. This doesn't change what the separate agreement with a club says about our service.

9. Privacy and cookies

How we use personal information is explained in our privacy policy, and how we use cookies in our cookie notice.

10. Changes to these terms

We may change these terms. The date at the top of the page shows when they last changed. If you keep using the site after a change, you accept the new terms.

11. The law

These terms are governed by the law of England and Wales, and its courts can deal with any dispute about them.

12. Contact us

Daniel Covello, trading as A1 Engine
41 Clarence Embankment
Cardiff
CF10 5GR
Email: daniel@a1engine.co
```
