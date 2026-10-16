import type { Payload, PayloadRequest } from 'payload'

import { AGREEMENT_VERSION, type AgreementParty } from './text'

/** Whether the club has accepted the current version of the data processing agreement. */
export const clubHasAccepted = async (
  payload: Payload,
  tenantID: string,
  req?: PayloadRequest,
): Promise<boolean> => {
  const { totalDocs } = await payload.count({
    collection: 'agreement-acceptances',
    where: {
      and: [{ tenant: { equals: tenantID } }, { version: { equals: AGREEMENT_VERSION } }],
    },
    overrideAccess: true,
    req,
  })
  return totalDocs > 0
}

/** The club's side of the agreement: its legal name (or club name) and address. */
export const agreementParty = async (
  payload: Payload,
  tenantID: string,
): Promise<AgreementParty> => {
  const { docs } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: tenantID } },
    select: { clubName: true, footer: { address: true }, privacy: { legalName: true } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const s = (docs[0] ?? {}) as {
    clubName?: string | null
    footer?: { address?: string | null }
    privacy?: { legalName?: string | null }
  }
  const clubName = s.clubName?.trim() || 'the Club'
  return {
    clubName,
    legalName: s.privacy?.legalName?.trim() || clubName,
    address: s.footer?.address?.trim() || null,
  }
}
