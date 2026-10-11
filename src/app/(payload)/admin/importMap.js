import { TOTPField as TOTPField_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { WatchTenantCollection as WatchTenantCollection_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { TenantField as TenantField_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { AssignTenantFieldTrigger as AssignTenantFieldTrigger_1d0591e3cf4f332c83a86da13a0de59a } from '@payloadcms/plugin-multi-tenant/client'
import { GlobalViewRedirect as GlobalViewRedirect_d6d5f193a167989e2ee7d14202901e62 } from '@payloadcms/plugin-multi-tenant/rsc'
import { TenantSelector as TenantSelector_d6d5f193a167989e2ee7d14202901e62 } from '@payloadcms/plugin-multi-tenant/rsc'
import { TenantSelectionAfterTwoFactor as TenantSelectionAfterTwoFactor_81c53e0ef025a5e59bab11a3e58579bd } from '../../../admin/TenantSelectionAfterTwoFactor'
import { TOTPProvider as TOTPProvider_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { TOTPSetup as TOTPSetup_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { TOTPVerify as TOTPVerify_4eaf6cb33cfb75be01716613e3c9a512 } from 'payload-totp/rsc'
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "payload-totp/rsc#TOTPField": TOTPField_4eaf6cb33cfb75be01716613e3c9a512,
  "@payloadcms/plugin-multi-tenant/client#WatchTenantCollection": WatchTenantCollection_1d0591e3cf4f332c83a86da13a0de59a,
  "@payloadcms/plugin-multi-tenant/client#TenantField": TenantField_1d0591e3cf4f332c83a86da13a0de59a,
  "@payloadcms/plugin-multi-tenant/client#AssignTenantFieldTrigger": AssignTenantFieldTrigger_1d0591e3cf4f332c83a86da13a0de59a,
  "@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect": GlobalViewRedirect_d6d5f193a167989e2ee7d14202901e62,
  "@payloadcms/plugin-multi-tenant/rsc#TenantSelector": TenantSelector_d6d5f193a167989e2ee7d14202901e62,
  "/admin/TenantSelectionAfterTwoFactor#TenantSelectionAfterTwoFactor": TenantSelectionAfterTwoFactor_81c53e0ef025a5e59bab11a3e58579bd,
  "payload-totp/rsc#TOTPProvider": TOTPProvider_4eaf6cb33cfb75be01716613e3c9a512,
  "payload-totp/rsc#TOTPSetup": TOTPSetup_4eaf6cb33cfb75be01716613e3c9a512,
  "payload-totp/rsc#TOTPVerify": TOTPVerify_4eaf6cb33cfb75be01716613e3c9a512,
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
