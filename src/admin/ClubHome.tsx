import { getTenantFromCookie } from '@payloadcms/plugin-multi-tenant/utilities'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import type { CSSProperties, ReactNode } from 'react'

import { editorTenantID } from '../access/roles'
import { isFullyAuthenticated, isSuperAdminWithCode } from '../auth/fullyAuthenticated'

import { allClubsProgress, clubHomeData, type ClubHomeData } from './clubSetup'

/**
 * The club home screen, above the dashboard's list of sections (plan part E, from Dan's
 * dashboard review on 20 October). A club secretary sees what's left to set up, new messages,
 * shortcuts to the everyday jobs and the course status. The super-admin sees the same for the
 * club picked in the club selector, plus every club's setup progress.
 */

const card: CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 6,
  padding: '1.25rem 1.5rem',
  background: 'var(--theme-elevation-0)',
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={card} aria-label={title}>
    <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.75rem' }}>{title}</h2>
    {children}
  </section>
)

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })

const ClubCards = ({ data }: { data: ClubHomeData }) => {
  const remaining = data.steps.filter((s) => !s.done)
  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
      }}
    >
      {remaining.length > 0 ? (
        <Card title={`Get your website ready: ${data.doneCount} of ${data.steps.length} done`}>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.4rem' }}>
            {data.steps.map((step) => (
              <li key={step.key}>
                {step.done ? (
                  <span style={{ color: 'var(--theme-elevation-500)' }}>
                    <span aria-hidden="true">✓ </span>
                    {step.label}: done
                  </span>
                ) : (
                  <Link href={step.href}>{step.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title={data.newEnquiries === 0 ? 'Messages' : `Messages: ${data.newEnquiries} new`}>
        {data.enquiries.length === 0 ? (
          <p style={{ margin: 0 }}>No new messages from your Contact page.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.4rem' }}>
            {data.enquiries.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/collections/enquiries/${e.id}`}>{e.name}</Link>{' '}
                <span style={{ color: 'var(--theme-elevation-500)' }}>
                  · {when(e.createdAt)} · {e.reference}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ margin: '0.75rem 0 0' }}>
          <Link href="/admin/collections/enquiries">All messages</Link>
        </p>
      </Card>

      <Card title="Everyday jobs">
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.4rem' }}>
          <li>
            <Link href="/admin/collections/course-status">Update the course status</Link>
          </li>
          <li>
            <Link href="/admin/collections/news/create">Add a news story</Link>
          </li>
          <li>
            <Link href="/admin/collections/events/create">Add an event</Link>
          </li>
          <li>
            <Link
              href={
                data.homePageID
                  ? `/admin/collections/pages/${data.homePageID}`
                  : '/admin/collections/pages/create'
              }
            >
              Edit the home page
            </Link>
          </li>
        </ul>
      </Card>

      {data.courseStatus ? (
        <Card title="Course status">
          <p style={{ margin: 0, fontSize: '1.25rem' }}>
            <strong>{data.courseStatus.label}</strong>
          </p>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--theme-elevation-500)' }}>
            {data.courseStatus.updatedAt
              ? `Last updated ${when(data.courseStatus.updatedAt)}`
              : 'Not updated yet'}
          </p>
          {data.courseStatus.stale ? (
            <p style={{ margin: '0.75rem 0 0' }}>
              <strong>Not updated today.</strong> Your website asks visitors to phone until you{' '}
              <Link href="/admin/collections/course-status">update it</Link>.
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}

export const ClubHome = async ({ payload, user }: ServerProps) => {
  // Reads with access rules off, so it checks the code itself rather than relying on the
  // admin's two-factor redirect (docs/security/audit-auth.md, A3).
  if (!isFullyAuthenticated(user)) return null
  const superAdmin = isSuperAdminWithCode(user)
  const tenantID = superAdmin
    ? (getTenantFromCookie(await headers(), 'text') as string | null)
    : editorTenantID(user)
  const data = tenantID ? await clubHomeData(payload, tenantID) : null
  const clubs = superAdmin ? await allClubsProgress(payload) : []

  return (
    <div style={{ display: 'grid', gap: '1.5rem', margin: '0 0 2rem' }}>
      {data ? (
        <div>
          <h1 style={{ margin: '0 0 1rem' }}>{data.clubName}</h1>
          <ClubCards data={data} />
        </div>
      ) : null}
      {superAdmin ? (
        <Card title="Clubs">
          {clubs.length === 0 ? (
            <p style={{ margin: 0 }}>
              No clubs yet. <Link href="/admin/collections/tenants/create">Add a club</Link>.
            </p>
          ) : (
            <>
              {!data ? (
                <p style={{ margin: '0 0 0.75rem' }}>
                  Pick a club in the club selector to see its home screen.
                </p>
              ) : null}
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.4rem' }}>
                {clubs.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/collections/tenants/${c.id}`}>{c.name}</Link>{' '}
                    <span style={{ color: 'var(--theme-elevation-500)' }}>
                      · setup {c.done} of {c.total} done
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      ) : null}
    </div>
  )
}
