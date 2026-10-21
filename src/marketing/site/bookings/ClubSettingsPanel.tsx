'use client'

import { useState } from 'react'

import { Switch } from '../controls/interactive'
import { MarketingIcon } from '../MarketingIcon'

/**
 * Marketing/Club Settings Panel (184:3519): "Toggle card guarantee: the golfer flow on the right
 * gains a Card details step and the no-show fee unlocks." A simulation of settings that are
 * coming next.
 */
export const ClubSettingsPanel = () => {
  const [guarantee, setGuarantee] = useState(true)
  const steps = guarantee
    ? ['Choose a time', 'Add players', 'Card details', 'Confirm']
    : ['Choose a time', 'Add players', 'Confirm']
  return (
    <div className="mk-settings-demo">
      <div className="mk-settings-list">
        <p className="mk-settings-heading">Booking settings</p>
        <div className="mk-setting">
          <div>
            <p className="mk-setting-name">Card guarantee</p>
            <p className="mk-setting-note">Take card details to secure a booking.</p>
          </div>
          <Switch label="Card guarantee" checked={guarantee} onChange={setGuarantee} />
        </div>
        <div className="mk-setting" data-disabled={!guarantee || undefined}>
          <div>
            <p className="mk-setting-name">No-show fee</p>
            <p className="mk-setting-note">£10 per player, only if nobody turns up.</p>
          </div>
          <Switch label="No-show fee" checked={guarantee} disabled={!guarantee} />
        </div>
        <div className="mk-setting">
          <div>
            <p className="mk-setting-name">Visitor booking window</p>
            <p className="mk-setting-note">7 days ahead</p>
          </div>
          <Switch label="Visitor booking window" defaultChecked />
        </div>
      </div>
      <div className="mk-settings-flow">
        <p className="mk-settings-flow-label" id="mk-golfer-sees">
          What the golfer sees
        </p>
        <ol className="mk-flow-steps" aria-labelledby="mk-golfer-sees">
          {steps.map((step, i) => (
            <li key={step} data-new={step === 'Card details' || undefined}>
              {i > 0 ? (
                <span className="mk-flow-arrow" aria-hidden="true">
                  <MarketingIcon name="arrow-right" size={16} />
                </span>
              ) : null}
              <span className="mk-flow-step">
                <span className="mk-flow-step-num">Step {i + 1}</span>
                <span className="mk-flow-step-name">{step}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mk-settings-flow-text" aria-live="polite">
          {guarantee
            ? 'Card is saved, not charged. If nobody turns up, your team can charge the no-show fee in one click.'
            : 'No card needed. Members and visitors book in three steps.'}
        </p>
      </div>
    </div>
  )
}
