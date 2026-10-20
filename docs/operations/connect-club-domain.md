# Connecting a club's own web address

How a club's site goes live on its own address, for example `www.heathcotegolf.co.uk`. It takes about 10 minutes of clicking, then up to a day for the internet to catch up.

**Decided 2026-10-20:** club sites point **straight at Vercel**, not through Cloudflare. Vercel issues the security certificate (the padlock) automatically.

## Before you start

- The club's site is ready on staging (`/preview/<club>`), and its Club Settings are filled in.
- You know who controls the club's domain: the club itself, its old web agency, or a domain company such as 123-reg, GoDaddy or Cloudflare. That person needs to add **one or two records**, so send them step 3 as it is.
- Choose the **main address**. Usually `www.theirclub.co.uk`, with `theirclub.co.uk` (no www) forwarding to it.

## 1. In the admin: give the club its addresses

Admin → **Clubs** → the club → **Web addresses**:

1. First row: the main address, e.g. `www.theirclub.co.uk`.
2. Second row: `theirclub.co.uk`. Visitors there are forwarded to the main address.
3. Save.

Only the super-admin can change these, and two clubs can never share an address (the database refuses it).

## 2. In Vercel: add the addresses

Vercel → project **golf-platform** → **Settings** → **Domains** → **Add Domain**:

1. Type `theirclub.co.uk`. Vercel offers to add `www.theirclub.co.uk` too and to redirect one to the other. Choose **"Redirect theirclub.co.uk to www.theirclub.co.uk"**.
2. For **Environment**, choose **Production**. (For a trial on staging, choose the staging environment instead.)
3. Vercel then shows the records the club needs to add, and marks them "Invalid configuration" until they exist. That's expected.

## 3. The club adds the records (send them this)

> Please add these records to the DNS for theirclub.co.uk. Leave any email (MX) records exactly as they are.
>
> | Type | Name | Value |
> |---|---|---|
> | A | `@` (or blank) | the A value Vercel shows, e.g. `76.76.21.21` |
> | CNAME | `www` | the CNAME value Vercel shows, e.g. `xxxx.vercel-dns-017.com` |
>
> If an existing A or CNAME record already uses the same name, replace it. Don't add a second one.
> If the domain is on Cloudflare, set both records to **"DNS only"** (grey cloud), not "Proxied".

Copy the exact values from Vercel's Domains page. The CNAME value is unique to our project.

If Vercel asks for a **TXT** record called `_vercel` (it does when the domain was used on another Vercel account before), send that too.

## 4. Check it

Within an hour or so (sometimes up to 48 hours):

- Vercel's Domains page shows both addresses as **Valid Configuration**, with a certificate.
- `https://www.theirclub.co.uk` shows the club's home page with the padlock.
- `https://theirclub.co.uk/membership` forwards to `https://www.theirclub.co.uk/membership`.
- `https://www.theirclub.co.uk/admin` says "Page not found". The admin only lives on the platform's own address.
- On production, `https://www.theirclub.co.uk/robots.txt` lists the sitemap, so search engines can find the site.

## 5. Afterwards

- Add the home page to the uptime monitor (Better Stack) once step 6 is set up.
- If the club had an old site, ask whether its old page addresses need forwarding. That's done in Vercel → Domains → Redirects, or ask Claude.

## Taking a club's address off

Remove it from the club's **Web addresses** in the admin, then remove it in Vercel → Domains. Do it in that order, so the address stops showing the club before Vercel lets it go.

## Not built yet

- Adding addresses to Vercel automatically from the admin. That needs a Vercel access token stored as a secret, so it's a later decision.
- A fallback address for every club (e.g. `heathcote.<platform domain>`). It needs the platform's own domain, which waits for the platform name.
