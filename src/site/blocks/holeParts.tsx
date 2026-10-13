import type { SiteHole, SiteTee } from './resolve'

/** "1" → "01". */
export const pad2 = (n: number) => String(n).padStart(2, '0')

/** Figma "Tee Marker": a 10px dot in the tee's system colour, always beside its name. */
export const TeeDot = ({ tee }: { tee: SiteTee }) => (
  <span className={`tee-dot is-${tee.colour}`} aria-hidden="true" />
)

/** Each tee's yardage for a hole, as label/value rows (Hole Card "Guide"). */
export const TeeYards = ({ hole, tees }: { hole: SiteHole; tees: SiteTee[] }) => (
  <dl className="hole-tees">
    {tees.map((t, i) =>
      hole.yards[i] == null ? null : (
        <div key={t.colour} className="hole-tee">
          <dt className="t-label-s">
            <TeeDot tee={t} />
            {t.name}
          </dt>
          <dd className="t-body-s">{hole.yards[i]}</dd>
        </div>
      ),
    )}
  </dl>
)

/** The first tee with a yardage for this hole (the club's default tee comes first). */
export const mainYards = (hole: SiteHole) => hole.yards.find((y) => y != null) ?? null

/** Front nine, back nine (only for 18 holes). */
export const nines = (holes: SiteHole[]) =>
  holes.length > 9 ? [holes.slice(0, 9), holes.slice(9)] : [holes]
