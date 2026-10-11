import { AccountActions as AccountActions_5939924b736c0af7dc12cb105215f5ae } from '../../../admin/AccountActions'
import { TOTPField as TOTPField_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { InviteEditorButton as InviteEditorButton_ed6924b166afdc0cc951a5635a759e32 } from '../../../admin/InviteEditorButton'
import { WatchTenantCollection as WatchTenantCollection_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { TenantField as TenantField_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { AssignTenantFieldTrigger as AssignTenantFieldTrigger_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { GlobalViewRedirect as GlobalViewRedirect_d6d5f193a167989e2ee7d14202901e62 } from '@payloadcms/plugin-multi-tenant/rsc'
import { TenantSelector as TenantSelector_d6d5f193a167989e2ee7d14202901e62 } from '@payloadcms/plugin-multi-tenant/rsc'
import { TenantSelectionAfterTwoFactor as TenantSelectionAfterTwoFactor_81c53e0ef025a5e59bab11a3e58579bd } from '../../../admin/TenantSelectionAfterTwoFactor'
import { TOTPProvider as TOTPProvider_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { TOTPSetup as TOTPSetup_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { TOTPVerify as TOTPVerify_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { InviteEditorView as InviteEditorView_81c4e00104ce61dd8de9811588af1e2c } from '../../../admin/InviteEditorView'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "/admin/AccountActions#AccountActions": AccountActions_5939924b736c0af7dc12cb105215f5ae,
  "payload-totp/rsc#TOTPField": TOTPField_4eaf6cb33cfb75be01716613e3c9a512,
  "/admin/InviteEditorButton#InviteEditorButton": InviteEditorButton_ed6924b166afdc0cc951a5635a759e32,
  "@payloadcms/plugin-multi-tenant/client#WatchTenantCollection": WatchTenantCollection_1d0591e3cf4f332c83a86da13a0de59a,
  "@payloadcms/plugin-multi-tenant/client#TenantField": TenantField_1d0591e3cf4f332c83a86da13a0de59a,
  "@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger": AssignTenantFieldTrigger_1d0591e3cf4f332c83a86da13a0de59a,
  "@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect": GlobalViewRedirect_d6d5f193a167989e2ee7d14202901e62,
  "@payloadcms/plugin-multi-tenant/rsc#TenantSelector": TenantSelector_d6d5f193a167989e2ee7d14202901e62,
  "/admin/TenantSelectionAfterTwoFactor#TenantSelectionAfterTwoFactor": TenantSelectionAfterTwoFactor_81c53e0ef025a5e59bab11a3e58579bd,
  "payload-totp/rsc#TOTPProvider": TOTPProvider_4eaf6cb33cfb75be01716613e3c9a512,
  "payload-totp/rsc#TOTPSetup": TOTPSetup_4eaf6cb33cfb75be01716613e3c9a512,
  "payload-totp/rsc#TOTPVerify": TOTPVerify_4eaf6cb33cfb75be01716613e3c9a512,
  "/admin/InviteEditorView#InviteEditorView": InviteEditorView_81c4e00104ce61dd8de9811588af1e2c,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
