'use client'

import { useState } from 'react'

import { SWITCHER_BLOCK, SWITCHER_CLUBS, SWITCHER_DESIGNS } from '@/marketing/demo/switcher'

import { Segmented, TenantChips } from '../controls/interactive'
import { DeviceStage } from './DeviceStage'

/**
 * Marketing/Block Switcher (Figma 359:5798): the same Block Flipper stage, for one block shown
 * in three designs and two demo clubs' colours and fonts. The designs are a segmented control and
 * the clubs are chips; the laptop and phone change together. The real Two-Column block draws
 * every one, in an embedded page, so nothing here is a picture of a block.
 */
export const BlockSwitcher = () => {
  const [design, setDesign] = useState(0)
  const [club, setClub] = useState(0)

  const chosenDesign = SWITCHER_DESIGNS[design]
  const chosenClub = SWITCHER_CLUBS[club]
  const description = `${chosenDesign.name} design, in ${chosenClub.name}’s colours and fonts`

  return (
    <div className="mk-flipper mk-switcher" data-fit-screen="">
      <DeviceStage
        src={`/frame/two-column/${chosenClub.id}/${chosenDesign.id}`}
        address={chosenClub.domain}
        laptopLabel={`Demo club: the ${SWITCHER_BLOCK} block, ${chosenDesign.name} design, on a laptop`}
        phoneLabel={`Demo club: the same block on a phone`}
        onSwipe={(by) =>
          setDesign((i) => (i + by + SWITCHER_DESIGNS.length) % SWITCHER_DESIGNS.length)
        }
      >
        {(laptop) => (
          <div className="mk-switcher-controls" style={{ width: `min(${laptop}px, 100%)` }}>
            <p className="mk-flipper-label" aria-live="polite">
              <span className="mk-flipper-name">{SWITCHER_BLOCK}</span>
              <span className="mk-flipper-count">
                Design {design + 1} of {SWITCHER_DESIGNS.length} · {chosenDesign.name} ·{' '}
                {chosenClub.name}’s colours and fonts
              </span>
            </p>
            <div className="mk-switcher-pickers">
              <Segmented
                label="Design"
                options={SWITCHER_DESIGNS.map((d) => d.label)}
                defaultIndex={design}
                onChange={setDesign}
              />
              <span className="mk-switcher-divider" aria-hidden="true" />
              <TenantChips
                label="Club"
                clubs={SWITCHER_CLUBS.map((c) => ({
                  name: c.name.replace(' Links', ''),
                  style: 'Demo club',
                  swatch: c.swatch,
                }))}
                value={club}
                onChange={setClub}
              />
            </div>
          </div>
        )}
      </DeviceStage>
    </div>
  )
}
