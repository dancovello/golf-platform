/**
 * Marketing/Proof Stat (264:8700): big number, one-line claim, source and date. Only numbers we
 * can show a source for (doc 19 honesty rules; docs/marketing-site/claims-register.md).
 */
export const ProofStat = ({
  number,
  claim,
  source,
  methodHref,
}: {
  number: string
  claim: string
  source: string
  methodHref?: string | null
}) => (
  <figure className="mk-proof-stat">
    <p className="mk-proof-number">{number}</p>
    <figcaption className="mk-proof-claim">{claim}</figcaption>
    <div className="mk-proof-source">
      <p>{source}</p>
      {methodHref ? (
        <a href={methodHref} rel="noopener">
          See the method
        </a>
      ) : null}
    </div>
  </figure>
)
