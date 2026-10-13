'use client'

import { useRef, useState } from 'react'

import { Close } from '../components/Icons'
import { Paragraphs } from './parts'
import type { SitePerson } from './resolve'
import { ContactLinks, Portrait } from './teamShared'

const CARD_SIZES = '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 282px'

const NameAndRole = ({ person }: { person: SitePerson }) => (
  <div className="team-card-text">
    <h3 className="t-heading-m team-name">{person.name}</h3>
    <p className="team-role-row">
      <span className="t-label-s team-role">{person.role}</span>
      {person.qualification ? (
        <span className="t-data-label team-tag">{person.qualification}</span>
      ) : null}
    </p>
  </div>
)

/**
 * Team style A: a 4-across portrait grid (3 on tablets, 2 on phones). A person with a bio
 * opens a profile (a native modal dialog: focus is kept inside, Esc closes it).
 */
export const TeamGrid = ({ people }: { people: SitePerson[] }) => {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState<SitePerson | null>(null)

  const show = (person: SitePerson) => {
    setOpen(person)
    dialog.current?.showModal()
  }

  return (
    <>
      <ul className="team-grid">
        {people.map((person) => (
          <li key={person.id} className="team-card">
            {person.bio ? (
              <button
                type="button"
                className="team-card-button"
                onClick={() => show(person)}
                aria-haspopup="dialog"
              >
                <Portrait person={person} shape="card" sizes={CARD_SIZES} />
                <NameAndRole person={person} />
              </button>
            ) : (
              <>
                <Portrait person={person} shape="card" sizes={CARD_SIZES} />
                <NameAndRole person={person} />
              </>
            )}
          </li>
        ))}
      </ul>
      <dialog
        ref={dialog}
        className="team-profile"
        aria-label={open ? open.name : undefined}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close()
        }}
      >
        {open ? (
          <div className="team-profile-body">
            <Portrait person={open} shape="card" sizes="(max-width: 767px) 100vw, 320px" />
            <div className="team-profile-text">
              <p className="t-data-label team-featured-tag">{open.role}</p>
              <h2 className="t-heading-l">{open.name}</h2>
              {open.qualification ? (
                <p className="t-data-label team-tag">{open.qualification}</p>
              ) : null}
              <div className="team-bio">
                <Paragraphs text={open.bio} className="t-body-m" />
              </div>
              <ContactLinks person={open} className="t-body-s" />
            </div>
            <button
              type="button"
              className="team-profile-close"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
            >
              <Close />
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
