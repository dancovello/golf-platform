'use client'

/**
 * A number whose digits roll when it changes (interaction rules: "Prices roll digit by digit when
 * the calculator changes"). Tabular figures, so nothing shifts. Screen readers get the plain
 * text; with reduced motion it simply changes.
 */
export const RollingNumber = ({ text }: { text: string }) => (
  <span className="mk-roll">
    <span className="mk-visually-hidden">{text}</span>
    <span aria-hidden="true" className="mk-roll-digits">
      {[...text].map((char, i) =>
        /\d/.test(char) ? (
          <span key={i} className="mk-roll-digit">
            <span className="mk-roll-strip" style={{ transform: `translateY(-${Number(char)}em)` }}>
              {'0123456789'.split('').map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i}>{char}</span>
        ),
      )}
    </span>
  </span>
)
