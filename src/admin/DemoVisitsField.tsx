'use client'

import { FieldLabel, useDocumentInfo } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useEffect, useState } from 'react'

/** How many recent visits are listed. */
const SHOWN = 20

type Visit = { id: string; visitedAt: string; page: string }
type Loaded = { total: number; visits: Visit[] } | 'error' | null

/** "24 Nov, 13:09" in UK time, whatever the computer's own time zone. */
export const ukTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/** "Opened 3 times", "Opened once", "Not opened yet". */
export const visitsSummary = (total: number) =>
  total === 0 ? 'Not opened yet' : total === 1 ? 'Opened once' : `Opened ${total} times`

/**
 * Shown on a demo club's page, to the super-admin only: how many times pages of the demo were
 * opened, and the latest ones with their time and page (src/site/demoVisits.ts). Your own visits
 * are counted too.
 */
export const DemoVisitsField: UIFieldClientComponent = () => {
  const { id } = useDocumentInfo()
  const [loaded, setLoaded] = useState<Loaded>(null)

  useEffect(() => {
    if (!id) return
    const query = new URLSearchParams({
      'where[clubId][equals]': String(id),
      sort: '-visitedAt',
      limit: String(SHOWN),
      depth: '0',
    })
    fetch(`/api/demo-visits?${query}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: { totalDocs: number; docs: Visit[] }) =>
        setLoaded({ total: body.totalDocs, visits: body.docs }),
      )
      .catch(() => setLoaded('error'))
  }, [id])

  if (!id) return null
  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <FieldLabel label="Demo visits" />
      {loaded === null && <p className="field-description">Loading…</p>}
      {loaded === 'error' && (
        <p className="field-description">Couldn’t load the visits. Reload the page to try again.</p>
      )}
      {loaded && loaded !== 'error' && (
        <>
          <p style={{ margin: '0.5rem 0' }}>
            <strong>{visitsSummary(loaded.total)}</strong>
            {loaded.visits[0] && ` · last opened ${ukTime(loaded.visits[0].visitedAt)}`}
          </p>
          {loaded.visits.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {loaded.visits.map((v) => (
                <li key={v.id}>
                  {ukTime(v.visitedAt)} · {v.page === '/' ? 'Home' : v.page}
                </li>
              ))}
            </ul>
          )}
          {loaded.total > SHOWN && <p className="field-description">Showing the latest {SHOWN}.</p>}
        </>
      )}
      <p className="field-description">
        Each page opened counts once. Only the time and page are kept, not who opened it, so your
        own visits show here too. Deleted 120 days after the visit.
      </p>
    </div>
  )
}
