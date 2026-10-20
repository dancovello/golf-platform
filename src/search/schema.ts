import { sql } from '@payloadcms/db-postgres'
import {
  type AnyPgColumn,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from '@payloadcms/db-postgres/drizzle/pg-core'
import type { PostgresAdapterArgs } from '@payloadcms/db-postgres'

/**
 * The site search index: two plain database tables, not Payload collections. Nothing in the
 * admin or the API can reach them. Only the website's own server code (src/search) reads them,
 * and every query it runs names one club (docs/architecture/decisions.md, "Site search").
 *
 * - search_entries: one row per thing a visitor can find on a club's live site, rebuilt from
 *   that club's published content whenever it changes (src/search/build.ts).
 * - search_state: per club, a count of content changes and the count the index was built at.
 */

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' })

export const searchEntries = pgTable(
  'search_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenant: uuid('tenant_id')
      .notNull()
      .references(() => tenantsID, { onDelete: 'cascade' }),
    /** event | page | news | course | person | document */
    kind: varchar('kind', { length: 16 }).notNull(),
    /** The page, article, event, etc. it came from. */
    sourceID: uuid('source_id').notNull(),
    title: text('title').notNull(),
    /** The small line above the title, e.g. a news category or a person's role. */
    eyebrow: text('eyebrow'),
    excerpt: text('excerpt'),
    /** Searched, never shown. */
    body: text('body'),
    /** Where the result goes (a SiteLink: a club page address or a full web address). */
    link: jsonb('link').notNull(),
    /** Extra details for the result row (photo, file type, booking button). */
    details: jsonb('details'),
    /** Event start, news publish date or document review date. */
    date: timestamp('date', { withTimezone: true, mode: 'string' }),
    /** News: hidden until its publish date. */
    visibleFrom: timestamp('visible_from', { withTimezone: true, mode: 'string' }),
    /** Events: hidden once started, as on the rest of the site. */
    visibleUntil: timestamp('visible_until', { withTimezone: true, mode: 'string' }),
    search: tsvector('search').generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("eyebrow", '') || ' ' || coalesce("excerpt", '')), 'B') || setweight(to_tsvector('english', coalesce("body", '')), 'C')`,
    ),
  },
  (t) => [
    // One row per item. (Not a three-column primary key: local schema auto-sync can't read those
    // back from the database and stops.)
    uniqueIndex('search_entries_source_idx').on(t.tenant, t.kind, t.sourceID),
    index('search_entries_search_idx').using('gin', t.search),
  ],
)

export const searchState = pgTable('search_state', {
  tenant: uuid('tenant_id')
    .primaryKey()
    .references(() => tenantsID, { onDelete: 'cascade' }),
  /** Goes up by one with every change to the club's searchable content. */
  changes: integer('changes').notNull().default(0),
  /** `changes` when the index was last built; behind means it needs rebuilding. */
  builtChanges: integer('built_changes').notNull().default(-1),
  /** SEARCH_INDEX_VERSION it was built with, so a new way of indexing rebuilds every club. */
  version: integer('version').notNull().default(0),
  builtAt: timestamp('built_at', { withTimezone: true, mode: 'string' }),
})

// Filled in by the hook below with Payload's own tenants table, so the references above point
// at it without this file building a second copy of that table.
let tenantsID: AnyPgColumn = undefined as never

/** Adds the two search tables to Payload's database schema (payload.config.ts). */
export const addSearchTables: NonNullable<PostgresAdapterArgs['afterSchemaInit']>[number] = ({
  schema,
}) => {
  tenantsID = schema.tables.tenants.id as AnyPgColumn
  return {
    ...schema,
    tables: { ...schema.tables, search_entries: searchEntries, search_state: searchState },
  }
}
