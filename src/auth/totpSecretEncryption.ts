import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import type { Config, Field, FieldHook, Plugin } from 'payload'

/**
 * Two-factor secrets are stored encrypted (AES-256-GCM), so a leaked database or backup
 * doesn't reveal anyone's authenticator secret. The key lives only in the environment
 * (TOTP_ENCRYPTION_KEY: 64 hex characters), never in the database or the repo.
 *
 * payload-totp reads the secret with payload.findByID and writes it with payload.update, so
 * field hooks see every read and write (checked in docs/plans/step-2-spike-findings.md §4).
 */
const PREFIX = 'v1'

const key = (): Buffer => {
  const hex = process.env.TOTP_ENCRYPTION_KEY ?? ''
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error('TOTP_ENCRYPTION_KEY must be 64 hex characters (openssl rand -hex 32)')
  }
  return Buffer.from(hex, 'hex')
}

export const encryptSecret = (plain: string): string => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [PREFIX, iv, cipher.getAuthTag(), encrypted]
    .map((p) => (typeof p === 'string' ? p : p.toString('base64')))
    .join(':')
}

/** Fails closed: anything that isn't a valid encrypted value throws, so login is refused. */
export const decryptSecret = (stored: string): string => {
  const [prefix, iv, tag, encrypted] = stored.split(':')
  if (prefix !== PREFIX || !iv || !tag || !encrypted) {
    throw new Error('Stored two-factor secret is not encrypted')
  }
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'))
  decipher.setAuthTag(Buffer.from(tag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

const encryptOnWrite: FieldHook = ({ value }) =>
  typeof value === 'string' && value.length > 0 ? encryptSecret(value) : value

/**
 * Payload can run read hooks twice on the same in-memory record within one request, so this
 * hook may be handed a value it already decrypted. Those are remembered (a small, bounded,
 * in-memory set) and passed through. Anything else that isn't encrypted is refused, so a plain
 * secret planted in the database is never used.
 */
const recentlyDecrypted = new Set<string>()
const MAX_REMEMBERED = 1000

const decryptOnRead: FieldHook = ({ value }) => {
  if (typeof value !== 'string' || value.length === 0) return value
  if (recentlyDecrypted.has(value)) return value
  const plain = decryptSecret(value)
  recentlyDecrypted.add(plain)
  if (recentlyDecrypted.size > MAX_REMEMBERED) {
    recentlyDecrypted.delete(recentlyDecrypted.values().next().value as string)
  }
  return plain
}

/** Must run after payloadTotp in the plugins list, so the field it adds already exists. */
export const encryptTotpSecrets =
  (collectionSlug: string): Plugin =>
  (config: Config): Config => {
    let found = false
    const collections = (config.collections ?? []).map((collection) => {
      if (collection.slug !== collectionSlug) return collection
      const fields = collection.fields.map((field: Field) => {
        if (!('name' in field) || field.name !== 'totpSecret') return field
        found = true
        const hooks = (field as { hooks?: Record<string, FieldHook[] | undefined> }).hooks ?? {}
        return {
          ...field,
          hooks: {
            ...hooks,
            beforeChange: [...(hooks.beforeChange ?? []), encryptOnWrite],
            afterRead: [decryptOnRead, ...(hooks.afterRead ?? [])],
          },
        } as Field
      })
      return { ...collection, fields }
    })
    if (!found) throw new Error('encryptTotpSecrets: no totpSecret field found; check plugin order')
    return { ...config, collections }
  }
