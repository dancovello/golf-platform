/**
 * Sets the founder card's name and "about you" text, and the ICO registration number, in the
 * marketing settings (Dan, 19 Nov 2026). The same fields can be edited by hand in the admin
 * (Marketing settings → Founder card, and → Contact); this does it in one go.
 * Run with:  pnpm update-founder-and-ico
 *
 * - It asks which database (hidden) and makes you type its name.
 * - It asks for the ICO registration number (the reference on the ICO certificate). Never type
 *   the ICO security number: it is shown in the site's footer.
 * - Press Enter at the final question to stop: that is the dry run, nothing is written.
 * Running it against PRODUCTION needs Dan's explicit approval.
 */
import { ask, chooseDatabase, connect } from './lib/prompts'

const NAME = 'Daniel Covello'
const ABOUT =
  'An experienced Product designer with more than 9 years designing, delivering and scaling sports platforms. Transitioning my love for the game and the real desire to assist golf clubs with their digital identity is the drive for this company.'

const main = async () => {
  console.log('Update the founder card and the ICO number\n')
  await chooseDatabase('update the marketing settings')
  const payload = await connect()
  const settings = await payload.findGlobal({
    slug: 'marketing-settings',
    depth: 0,
    overrideAccess: true,
  })
  const ico = (await ask('ICO registration number (Enter to leave it as it is): ')).trim()
  console.log(`\nName: “${settings.founder?.name}” → “${NAME}”`)
  console.log(`About: “${settings.founder?.role}”\n   → “${ABOUT}”`)
  if (ico) console.log(`ICO registration: “${settings.contact?.icoNumber ?? ''}” → “${ico}”`)
  const answer = await ask(
    '\nType "update" to make the changes, or press Enter to stop (dry run): ',
  )
  if (answer !== 'update') {
    console.log('\nDry run only. Nothing was changed.')
    process.exit(0)
  }
  await payload.updateGlobal({
    slug: 'marketing-settings',
    overrideAccess: true,
    data: {
      founder: { ...settings.founder, name: NAME, role: ABOUT },
      ...(ico ? { contact: { ...settings.contact, icoNumber: ico } } : {}),
    } as never,
  })
  console.log('\nDone.')
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
