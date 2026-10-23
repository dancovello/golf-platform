import { createHmac } from 'node:crypto'
import { isIPv6 } from 'node:net'

import { sql } from '@payloadcms/db-postgres'
import {
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@payloadcms/db-postgres/drizzle/pg-core'

/**
 * Rate limits that hold across every server (job 4, 21 Oct grilling). Each Vercel instance used
 * to count in its own memory, so the real limit grew with the number of instances. Counts now
 * live in one database table that every instance shares. Inventory of every public endpoint and
 * its limit: docs/operations/rate-limits.md (src/security/rateLimitInventory.ts).
 *
 * Visitors are never stored by IP address: the key is a keyed hash of the address and today's
 * date (HMAC with PAYLOAD_SECRET), so it changes every day and can't be turned back into an
 * address. The nightly clean-up deletes old counts (src/privacy/cleanUp.ts).
 */

export const rateLimits = pgTable(
  'rate_limits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** "<what>:<hashed visitor>", e.g. "search:3f9a…". */
    key: varchar('key', { length: 96 }).notNull(),
    windowStart: timestamp('window_start', { withTimezone: true, mode: 'string' }).notNull(),
    count: integer('count').notNull().default(0),
  },
  // Not a two-column primary key: local schema auto-sync can't read those back.
  (t) => [uniqueIndex('rate_limits_key_window_idx').on(t.key, t.windowStart)],
)

export type Limit = {
  /** What is being limited; part of the key, so limits don't share counts. */
  name: string
  /** Most requests allowed in one window. */
  max: number
  windowSeconds: number
}

/** Searches, from the results page and the header panel together (as before). */
export const SEARCH_LIMIT: Limit = { name: 'search', max: 120, windowSeconds: 60 }
/** Upload links, per signed-in account: well above a big bulk upload (uploads audit, finding 2). */
export const UPLOAD_LINK_LIMIT: Limit = { name: 'upload-link', max: 100, windowSeconds: 60 * 60 }
/** Contact form sends per visitor, before anything is saved (public forms audit, finding 1). */
export const CONTACT_VISITOR_LIMIT: Limit = { name: 'contact', max: 5, windowSeconds: 10 * 60 }
/** Contact form saves per club, counted in one step so a burst can't overshoot (finding 3).
 * Matches HOURLY_LIMIT in src/site/contact/submit.ts. */
export const CONTACT_CLUB_LIMIT: Limit = { name: 'contact-club', max: 20, windowSeconds: 60 * 60 }
/** Contact alert emails per club per day: past this, messages are saved but not emailed, so
 * one club can't use up the email allowance every club shares (finding 2). */
export const CONTACT_ALERTS_PER_CLUB: Limit = {
  name: 'contact-alert',
  max: 25,
  windowSeconds: 24 * 60 * 60,
}
/** Contact alert emails for all clubs together per day. Resend's free plan sends 100 a day in
 * all; this keeps 30 free for password resets and invitations. Raise it on a paid plan. */
export const CONTACT_ALERTS_ALL_CLUBS: Limit = {
  name: 'contact-alert-all',
  max: 70,
  windowSeconds: 24 * 60 * 60,
}
/** Security policy reports, from all visitors together: they only go to the log. */
export const CSP_REPORT_LIMIT: Limit = { name: 'csp-report', max: 60, windowSeconds: 60 }

type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }

/**
 * The part of an address that identifies one visitor. An IPv6 home or cloud connection is given
 * a whole /64 network and can use any address in it, so IPv6 addresses count by their first 64
 * bits (search audit, finding 3). IPv4 and anything that isn't an address are unchanged.
 */
export const visitorNetwork = (address: string): string => {
  const bare = address.replace(/^\[|\]$/g, '').split('%')[0]
  if (!isIPv6(bare)) return address
  const mapped = bare.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (mapped) return mapped[1]
  const [head, tail = ''] = bare.toLowerCase().split('::')
  const left = head ? head.split(':') : []
  const right = bare.includes('::') ? (tail ? tail.split(':') : []) : []
  // An embedded IPv4 tail counts as two groups.
  const groups = (parts: string[]) => parts.reduce((n, p) => n + (p.includes('.') ? 2 : 1), 0)
  const full = [...left, ...Array(8 - groups(left) - groups(right)).fill('0'), ...right]
  return `${full
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ''))
    .join(':')}::/64`
}

/** A visitor's key for today: never the address itself. */
export const hashVisitor = (
  address: string,
  now = new Date(),
  secret = process.env.PAYLOAD_SECRET ?? '',
) =>
  createHmac('sha256', secret)
    .update(`${now.toISOString().slice(0, 10)}|${visitorNetwork(address)}`)
    .digest('hex')
    .slice(0, 32)

const windowStartOf = (limit: Limit, now: Date) => {
  const ms = limit.windowSeconds * 1000
  return new Date(Math.floor(now.getTime() / ms) * ms).toISOString()
}

/**
 * Counts this request and says whether it's within the limit. One database round trip: the
 * count goes up by one and comes back in the same statement, so two servers counting at the
 * same moment can't both see room for the last request.
 */
export const allowRequest = async (
  db: Executor,
  limit: Limit,
  visitor: string,
  now = new Date(),
): Promise<boolean> => {
  const key = `${limit.name}:${visitor === 'all' ? 'all' : hashVisitor(visitor, now)}`
  const { rows } = await db.execute(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStartOf(limit, now)}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`)
  return Number((rows[0] as { count?: number } | undefined)?.count ?? Infinity) <= limit.max
}

/** Counts older than a day are no use to any limit (the longest window is a day). */
export const deleteOldCounts = async (db: Executor, now = new Date()) => {
  // Two days, so a day-long window is never cut short.
  const cutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  const { rows } = await db.execute(
    sql`DELETE FROM rate_limits WHERE window_start < ${cutoff} RETURNING id`,
  )
  return rows.length
}

/**
 * Who is asking: the address the request came from, as the host saw it. Vercel sets x-real-ip
 * and x-forwarded-for itself and overwrites anything the visitor sends, so those are trusted.
 * cf-connecting-ip is only trusted with TRUSTED_PROXY=cloudflare. Club sites point straight at
 * Vercel (decided 20 Oct), so it stays unset: any visitor could otherwise send a made-up one
 * with every request and never reach a limit.
 */
export const visitorKey = (
  headers: Headers,
  trustedProxy: string | undefined = process.env.TRUSTED_PROXY,
): string =>
  (trustedProxy === 'cloudflare' ? headers.get('cf-connecting-ip')?.trim() : undefined) ||
  headers.get('x-real-ip')?.trim() ||
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  'unknown'
