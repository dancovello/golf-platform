# Privacy policy for a1engine.co (company site)

**Written:** 10 November 2026 · **Status:** draft built from the club privacy policy template that Dan's solicitor reviewed (`src/site/privacy/PrivacyPolicy.tsx`). The wording and section order are the same; only what is different for the company's own site has changed (list below). Send the list to the solicitor before publishing, if you want their sign-off on the changes.

## What changed from the version the solicitor saw

1. **Who we are.** The template is written as a club, with the platform company as its "processor". On a1engine.co the company runs the site itself, so the processor paragraph is replaced by a short note that clubs' own websites have their own policy.
2. **What we collect.** The club rows (enquiries, newsletter, member accounts, bookings, payments) are replaced by what a1engine.co really collects: the Request your homepage form, the demo booking form, emails to us, analytics (only with consent) and server logs.
3. **Cookies.** The spam check is described as covering the two forms (not a Contact form), and one line is added about the browser remembering your cookie choice and that you have seen the opening animation.
4. **Who we share it with.** The list names the services the company site really uses: Vercel, Neon, Cloudflare, Resend, Sentry and Google. It no longer says "our website provider".
5. **How long we keep it.** Homepage requests and demo bookings: 12 months after the last contact (this is what the nightly clean-up does, `src/privacy/cleanUp.ts`). Server logs, Google Analytics and backups keep the template's periods.
6. **Security.** The sentence about passwords is dropped (visitors have no passwords here).
7. **Contact and legal name.** Dan's legal name and postal address (given by Dan on 10 Nov 2026) are included as the controller, trading as A1 Engine. Contact email `daniel@a1engine.co`.
8. **Google Calendar and Meet.** Demo bookings create a Google Calendar event with a Google Meet link, and Google emails the invite to the person who booked. This is said in the demo booking row and in the list of services.

## Still needed (not in the text below)

- **Your address on a public page.** The postal address below will be visible to anyone. If that is a home address, you can use a business address or a PO box, or leave the address line out of sections 1 and 12; the policy still works with just your name and email.
- **ICO registration.** Not mentioned, as it isn't done yet (launch checklist D1; Dan is doing it on 10 Nov). Once you have the registration number, add a sentence such as "We are registered with the Information Commissioner's Office (registration number ...)" to section 1.
- **Backups "within 35 days".** Kept from the template. The backup notes say copies are kept for 30 days, but there is no rule in Cloudflare that deletes them automatically (not confirmed). This is added to step 5 of the audit fix plan: set one, so the sentence is true.
- **Google Analytics retention 14 months.** True only once the setting in Google Analytics is saved (launch checklist D7).

## How to paste it

In the admin: **Marketing → Pages → Privacy policy**. The page already has its title and a "last reviewed" block. In the text block:

1. Delete the whole line that starts with the double square brackets.
2. Paste the text below, starting at "This policy explains".
3. Set each numbered heading line (1. Who we are, 2. What we collect and why, and so on) to a heading style, using the editor's heading menu. The bullet lines can be made bullets in the same way.
4. In the "last reviewed" block, set the date to the day you publish.
5. Save as draft, then Publish. Then open a1engine.co/privacy to check it, and the banner's link.

## The text to paste

This policy explains how A1 Engine collects and uses your personal information when you use our website, a1engine.co. We keep it short and plain. If anything is unclear, get in touch using the details at the end.

1. Who we are

Daniel Covello, trading as A1 Engine, of 41 Clarence Embankment, Cardiff, CF10 5GR, is responsible for your personal information. In data protection law, that makes us the controller. We follow the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

We build and run websites for golf clubs. This policy covers our own website, a1engine.co. A golf club's website that we run for the club has its own privacy policy, because the club decides how its own visitors' information is used.

2. What we collect and why

We only collect what we need for the purpose below. The legal basis is the reason the law allows us to use it.

When you ask us to build your homepage (the Request your homepage form): we collect your club name, your club's current website address and your email address. We use them so we can build the homepage and send it to you. Legal basis: legitimate interests (replying to your request).

When you book a demo call: we collect your name, your role at your club (optional), your club name, your email address, and the day and time you choose. We use them to arrange the call, and we create an event in our Google Calendar with a Google Meet link, so Google can email you the invitation. Legal basis: legitimate interests (arranging the call you asked for).

When you email us: we collect what you send, including your email address. We use it to reply to you. Legal basis: legitimate interests.

When you visit the website (analytics): we collect the pages viewed, device and browser type, approximate location (country or region) and the site that sent you. We use it to understand how the site is used and keep it working well. Legal basis: consent, and only if you accept analytics cookies.

When you visit the website (server logs): we collect your IP address, the date and time and the pages requested. We use them to keep the site secure and fix problems. Legal basis: legitimate interests.

We use the details you give us only for the reason shown above. We never sell your personal information, and we don't use it for automated decisions that affect you.

3. Cookies and analytics

We use a small number of cookies and similar technologies.

Essential: needed for the site to work. Your browser remembers your cookie choice, and that you have seen the opening animation. These don't need consent.

Spam protection: our request and booking forms use Cloudflare Turnstile to check that a message comes from a person, not a robot. It looks at technical details of your browser when you use the form, doesn't track you across websites, and doesn't need consent.

Google Analytics: only runs if you accept analytics cookies in our cookie banner. It helps us understand how visitors use the site. You can change your choice any time using the "Cookie settings" link in the footer.

4. Who we share it with

We only share your information with organisations that help us run the website and our business:

- Vercel, which hosts the website
- Neon, which keeps our database
- Cloudflare, for spam protection and file storage
- Resend, which sends our emails
- Sentry, which tells us when something goes wrong on the site (reports have personal details removed)
- Google, for our email, calendar and video calls (Google Workspace, Google Calendar and Google Meet), and for analytics, only if you consent

We may also share information if the law requires it, for example with the police or a court.

5. Transfers outside the UK

Some of these providers store or access data outside the UK, including in the USA. Where they do, the transfer is protected by UK adequacy regulations (including the UK-US Data Bridge) or the ICO's approved contract terms.

6. How long we keep it

- Homepage requests and demo bookings: 12 months after our last contact with you about them
- Emails you send us: as long as we need them to deal with your message
- Server logs: up to 30 days
- Google Analytics data: 14 months

After that we delete it or make it anonymous. Encrypted backup copies are deleted as the backups expire, within 35 days.

7. Keeping it secure

The site runs over an encrypted connection (HTTPS) and access to personal information is limited to people who need it. No system is completely secure, but we take reasonable steps to protect your information.

8. Children

Our website isn't aimed at children.

9. Your rights

You have the right to:

- ask for a copy of the information we hold about you
- ask us to correct anything that's wrong
- ask us to delete your information
- ask us to limit how we use it, or object to us using it
- withdraw consent at any time, where we rely on consent
- ask for your information in a format you can take elsewhere

To use any of these rights, email daniel@a1engine.co. We'll respond within one month. There's no charge.

10. Complaints

If you're unhappy with how we've handled your information, please contact us first at daniel@a1engine.co so we can put it right.

You can also complain to the Information Commissioner's Office (ICO) at ico.org.uk/make-a-complaint or on 0303 123 1113.

11. Changes to this policy

We may update this policy when our website or the law changes. The date at the top shows when it last changed.

12. Contact us

Daniel Covello, trading as A1 Engine
41 Clarence Embankment
Cardiff
CF10 5GR
Email: daniel@a1engine.co
