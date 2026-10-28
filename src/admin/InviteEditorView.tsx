import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'

import { isSuperAdminWithCode } from '../auth/fullyAuthenticated'

import { InviteEditorForm } from './InviteEditorForm'

/** /admin/invite-editor: super-admins (with their two-factor code entered) only. */
export const InviteEditorView = async ({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) => {
  const { req } = initPageResult
  const allowed = isSuperAdminWithCode(req.user)

  const clubs = allowed
    ? (
        await req.payload.find({
          collection: 'tenants',
          limit: 0,
          sort: 'name',
          depth: 0,
          overrideAccess: false,
          user: req.user,
        })
      ).docs.map((club) => ({ id: club.id, name: club.name }))
    : []

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <h1>Invite a club editor</h1>
        {allowed ? (
          <>
            <p>
              They’ll get an account for one club only. You’ll get a link to send them; there’s no
              email from the platform yet.
            </p>
            <InviteEditorForm clubs={clubs} />
          </>
        ) : (
          <p>You are not allowed to access this page.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
