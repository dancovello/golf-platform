'use client'

import { Button, FieldLabel, useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'
import { useState } from 'react'

import { demoPath } from './demoPath'

/**
 * Shown on a club's page when "Public demo" is ticked: the full link to the demo website, with a
 * copy button, so it can be pasted into an email (docs/operations/prospect-demos.md). The link
 * is /demo/<short name>-<ending> on the address the admin is open on, the same one the website
 * serves demos from. It appears once the club has been saved with the demo on (that is when the
 * ending is made).
 */
export const DemoLinkField: UIFieldClientComponent = () => {
  const slug = useFormFields(([fields]) => fields.slug?.value)
  const token = useFormFields(([fields]) => fields.demoToken?.value)
  const [copied, setCopied] = useState(false)

  if (typeof slug !== 'string' || typeof token !== 'string' || !slug || !token) {
    return (
      <p className="field-description">
        Save the club to get its demo link. It appears here once the demo is switched on and saved.
      </p>
    )
  }

  const link = `${window.location.origin}${demoPath(slug, token)}`
  return (
    <div className="field-type text">
      <FieldLabel label="Demo website link" />
      <input
        readOnly
        aria-label="Demo website link"
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        style={{ width: '100%', padding: '0.5rem', margin: '0.5rem 0', fontFamily: 'monospace' }}
      />
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Button
          buttonStyle="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(link)
            setCopied(true)
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <a href={link} target="_blank" rel="noopener noreferrer">
          Open the demo website
        </a>
      </div>
      <p className="field-description">
        Anyone with this link can see the club’s website until the demo expires. Send it to the
        club.
      </p>
    </div>
  )
}
