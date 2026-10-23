/**
 * The data processing agreement every club accepts in the admin (UK GDPR Article 28).
 *
 * DRAFT for legal review. Square-bracketed text is for Dan and his solicitor to complete.
 * Changing the wording? Change AGREEMENT_VERSION too: every club is then asked to accept
 * again before its next settings save.
 */

export const AGREEMENT_VERSION = '2026-10-22-draft'

/** False until a solicitor has approved the wording; the admin then shows a "draft" notice. */
export const AGREEMENT_APPROVED = false

/** The platform company. Filled in by Dan before the first real club. */
export const PROVIDER = {
  name: '[Provider legal name]',
  tradingAs: 'Clubhouse',
  companyNumber: '[company number]',
  address: '[registered office address]',
  email: '[privacy contact email]',
}

export type AgreementBlock =
  | { kind: 'p'; text: string }
  | { kind: 'clause'; number: string; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] }

export type AgreementSection = { id: string; title: string; blocks: AgreementBlock[] }

export type AgreementParty = { clubName: string; legalName: string; address: string | null }

const p = (text: string): AgreementBlock => ({ kind: 'p', text })
const c = (number: string, text: string): AgreementBlock => ({ kind: 'clause', number, text })
const list = (...items: string[]): AgreementBlock => ({ kind: 'list', items })

/** The whole agreement for one club. */
export const agreementText = (club: AgreementParty): AgreementSection[] => {
  const provider = `${PROVIDER.name} (trading as ${PROVIDER.tradingAs}), company number ${PROVIDER.companyNumber}, of ${PROVIDER.address}`
  const clubLine = club.address
    ? `${club.legalName}, of ${club.address.replace(/\s*\r?\n\s*/g, ', ')}`
    : club.legalName
  return [
    {
      id: 'parties',
      title: 'Who this agreement is between',
      blocks: [
        p(
          `This data processing agreement is between ${clubLine} (“the Club”) and ${provider} (“the Provider”).`,
        ),
        p(
          'It applies whenever the Provider handles personal information for the Club while providing the Club’s website and its editing tools (“the Services”). It forms part of the agreement between the Club and the Provider for the Services (“the Main Agreement”). If the two conflict on how personal information is handled, this agreement wins.',
        ),
        p(
          'The Club accepts this agreement when a person with authority to act for the Club accepts it in the website’s editing tools. The Provider keeps a record of who accepted it, their role, and when.',
        ),
      ],
    },
    {
      id: 'definitions',
      title: 'Meaning of words used',
      blocks: [
        c(
          '2.1',
          '“Data Protection Law” means the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, the Privacy and Electronic Communications Regulations 2003, and any law that amends or replaces them in the UK.',
        ),
        c(
          '2.2',
          '“Personal Data”, “Controller”, “Processor”, “Processing”, “Data Subject”, “Personal Data Breach” and “Supervisory Authority” have the meanings given in the UK GDPR. The Supervisory Authority is the Information Commissioner’s Office (ICO).',
        ),
        c(
          '2.3',
          '“Club Personal Data” means the Personal Data the Provider processes for the Club under this agreement.',
        ),
        c(
          '2.4',
          '“Sub-processor” means another company the Provider uses to process Club Personal Data.',
        ),
      ],
    },
    {
      id: 'roles',
      title: 'Roles',
      blocks: [
        c(
          '3.1',
          'The Club is the Controller of Club Personal Data. The Provider is the Club’s Processor.',
        ),
        c(
          '3.2',
          'Schedule 1 describes the processing: its subject matter and length, its nature and purpose, the types of Personal Data and the kinds of people it is about.',
        ),
      ],
    },
    {
      id: 'provider',
      title: 'What the Provider will do',
      blocks: [
        c(
          '4.1',
          'Instructions. Process Club Personal Data only on the Club’s documented instructions, including on transfers outside the UK, unless UK law requires otherwise; in that case the Provider will tell the Club first unless the law forbids it. This agreement, the Main Agreement and the Club’s use of the Services’ settings and editing tools are the Club’s instructions. The Provider will tell the Club straight away if it believes an instruction breaks Data Protection Law.',
        ),
        c(
          '4.2',
          'Confidentiality. Make sure everyone it allows to process Club Personal Data is bound by a duty of confidentiality.',
        ),
        c(
          '4.3',
          'Security. Take the technical and organisational measures required by Article 32 of the UK GDPR, including those in Schedule 2, and keep them under review.',
        ),
        c('4.4', 'Sub-processors. Follow clause 6 when using Sub-processors.'),
        c(
          '4.5',
          'People’s rights. Help the Club, as far as reasonably possible, to respond to requests from people using their rights under Data Protection Law (for example to see, correct or delete their information). If the Provider receives such a request directly, it will pass it to the Club without undue delay and will not answer it unless the Club asks it to.',
        ),
        c(
          '4.6',
          'Helping the Club. Help the Club meet its duties under Articles 32 to 36 of the UK GDPR (security, reporting breaches, data protection impact assessments and prior consultation with the ICO), taking into account the nature of the processing and the information available to the Provider.',
        ),
        c(
          '4.7',
          'Breaches. Tell the Club without undue delay, and in any event within 48 hours, after becoming aware of a Personal Data Breach affecting Club Personal Data. The Provider will give the information the Club reasonably needs to report it to the ICO and to affected people, as it becomes available, and will take reasonable steps to contain it.',
        ),
        c(
          '4.8',
          'Records. Keep the record of processing activities required of processors by Article 30(2) of the UK GDPR.',
        ),
        c(
          '4.9',
          'Showing compliance and audits. Give the Club the information it reasonably needs to show that both parties meet Article 28 of the UK GDPR, and allow for and contribute to audits, including inspections, by the Club or an auditor it appoints. The Club will give at least 30 days’ written notice, audit no more than once a year unless there has been a Personal Data Breach or the ICO requires it, keep what it learns confidential, and pay its own costs. Where possible the Provider may first answer by providing documents and written answers.',
        ),
        c(
          '4.10',
          'Authorities. Cooperate with the ICO on request in the performance of its tasks.',
        ),
      ],
    },
    {
      id: 'club',
      title: 'What the Club will do',
      blocks: [
        c(
          '5.1',
          'Make sure it has a lawful basis for the Personal Data it puts into, or collects through, the Services, and that it tells people how their information is used. The Services publish a privacy policy written from the Club’s settings; the Club is responsible for checking those settings are accurate.',
        ),
        c(
          '5.2',
          'Not put special category data (for example health information) or criminal offence data into the Services unless the Provider has agreed in writing.',
        ),
        c(
          '5.3',
          'Keep its editors’ logins secure, give editing access only to people who need it, and remove access promptly when someone leaves.',
        ),
        c('5.4', 'Make sure its instructions to the Provider comply with Data Protection Law.'),
      ],
    },
    {
      id: 'subprocessors',
      title: 'Sub-processors',
      blocks: [
        c(
          '6.1',
          'The Club gives the Provider general written authorisation to use the Sub-processors listed in Schedule 3, and new Sub-processors under this clause.',
        ),
        c(
          '6.2',
          'The Provider will tell the Club at least 30 days before adding or replacing a Sub-processor, by email to the Club’s contact email and by a notice in the editing tools. The Club may object on reasonable data protection grounds within that time. The parties will discuss the objection in good faith; if they cannot resolve it, the Club may end the Services without penalty.',
        ),
        c(
          '6.3',
          'The Provider will put a written contract in place with each Sub-processor giving at least the same level of protection for Club Personal Data as this agreement, as Article 28(4) of the UK GDPR requires. The Provider remains fully liable to the Club for its Sub-processors’ performance of those obligations.',
        ),
      ],
    },
    {
      id: 'transfers',
      title: 'Transfers outside the UK',
      blocks: [
        c(
          '7.1',
          'The Provider will transfer Club Personal Data outside the UK, or allow it to be accessed from outside the UK, only where the transfer is covered by UK adequacy regulations (including the UK Extension to the EU–US Data Privacy Framework) or by appropriate safeguards such as the ICO’s International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses.',
        ),
        c(
          '7.2',
          'Schedule 3 shows where each Sub-processor processes data and the safeguard used.',
        ),
      ],
    },
    {
      id: 'end',
      title: 'When the Services end',
      blocks: [
        c(
          '8.1',
          'For 30 days after the Services end, the Club may ask the Provider for a copy of its content and settings in a commonly used electronic format.',
        ),
        c(
          '8.2',
          'After that, the Provider will delete Club Personal Data, unless UK law requires it to keep some. Copies in backups are deleted as the backups expire, within 35 days at most; until then they are kept encrypted, not used, and protected by this agreement.',
        ),
        c('8.3', 'The Provider will confirm the deletion in writing if the Club asks.'),
      ],
    },
    {
      id: 'liability',
      title: 'Liability',
      blocks: [
        c(
          '9.1',
          'Each party is responsible for its own failures to comply with Data Protection Law and this agreement. [Solicitor to confirm: liability caps and exclusions, and whether they follow the Main Agreement.]',
        ),
        c(
          '9.2',
          'Nothing in this agreement limits either party’s liability where the law does not allow it to be limited, or reduces the rights of Data Subjects.',
        ),
      ],
    },
    {
      id: 'general',
      title: 'Length, changes and law',
      blocks: [
        c(
          '10.1',
          'This agreement lasts for as long as the Provider processes Club Personal Data, including after the Services end until clause 8 is complete.',
        ),
        c(
          '10.2',
          'The Provider may update this agreement to reflect changes in Data Protection Law or in the Services. The Club will be asked to accept each new version in the editing tools. A change that reduces the protection of Club Personal Data needs the Club’s acceptance before it applies.',
        ),
        c(
          '10.3',
          'This agreement is governed by the law of England and Wales, and the courts of England and Wales have exclusive jurisdiction over any dispute about it.',
        ),
        c(
          '10.4',
          'The Provider’s contact for anything about this agreement is ' + PROVIDER.email + '.',
        ),
      ],
    },
    {
      id: 'schedule-1',
      title: 'Schedule 1: Details of the processing',
      blocks: [
        {
          kind: 'table',
          caption: 'Details of the processing',
          head: ['', 'Details'],
          rows: [
            [
              'Subject matter',
              'Hosting and running the Club’s website and the tools its editors use to manage it.',
            ],
            [
              'Duration',
              'For as long as the Services are provided, then until deletion under clause 8.',
            ],
            [
              'Nature',
              'Storing, organising, displaying, transmitting, backing up, restoring and deleting data, and keeping security records.',
            ],
            [
              'Purpose',
              'To provide, secure, support and maintain the Club’s website and editing tools.',
            ],
            [
              'Types of Personal Data',
              'Names, job titles, email addresses and phone numbers; photos and biographies of staff and others the Club chooses to publish; news, documents and other content the Club adds, which may mention people; editor account details (name, email, encrypted password, two-factor login settings, login sessions); messages people send through the website, when that feature is used; and technical records such as IP addresses, dates and times, and pages requested.',
            ],
            [
              'Kinds of people',
              'The Club’s staff, officers and volunteers; its members and visitors; people featured in the Club’s content; people who contact the Club through the website; the Club’s editors; and visitors to the website.',
            ],
            ['Special category or criminal offence data', 'None intended (see clause 5.2).'],
          ],
        },
      ],
    },
    {
      id: 'schedule-2',
      title: 'Schedule 2: Security measures',
      blocks: [
        list(
          'All connections use encryption (HTTPS). The database, stored files and backups are encrypted at rest.',
          'Every editing account needs a strong password (at least 12 characters) and is locked for 10 minutes after 5 wrong attempts. A Club editor is signed out 8 hours after logging in and is emailed whenever their password is set or changed; Club editors may also turn on two-factor login. The Provider’s own administrator accounts must use two-factor login. Accounts are created only by the Provider.',
          'Each club’s information is kept separate. Automated tests check, on every change to the software, that one club’s editors cannot see or change another club’s information, and a change cannot go live until they pass.',
          'The website uses a database account that can only read and write data, not change the database’s structure.',
          'Nightly backups are encrypted before they leave the hosting environment, and restoring from them is tested.',
          'Uploaded files are checked by their content, not just their name, and are served from a separate address.',
          'Software dependencies and code are scanned automatically for known weaknesses and leaked secrets.',
          'Access to the production systems is limited to the Provider’s authorised personnel.',
        ),
      ],
    },
    {
      id: 'schedule-3',
      title: 'Schedule 3: Sub-processors',
      blocks: [
        {
          kind: 'table',
          caption: 'Sub-processors',
          head: ['Company', 'What it does', 'Where', 'Transfer safeguard'],
          rows: [
            [
              'Vercel Inc.',
              'Hosts and runs the website and editing tools',
              '[USA (Washington, D.C.), or London if the hosting region is changed]',
              'UK Extension to the EU–US Data Privacy Framework; UK Addendum to the EU Standard Contractual Clauses',
            ],
            [
              'Neon Inc. (Databricks)',
              'Database hosting',
              'Stored in London (AWS eu-west-2); support access may be from the USA',
              '[Solicitor/Dan to confirm from Neon’s data processing agreement]',
            ],
            [
              'Cloudflare, Inc.',
              'Network security and delivery, including the spam check on contact forms; storage of photos, documents and encrypted backups',
              'Western Europe and the EU for storage; global network for delivery',
              'UK Extension to the EU–US Data Privacy Framework; UK Addendum to the EU Standard Contractual Clauses',
            ],
            [
              'Resend, Inc.',
              'Sends the website’s emails, such as new contact form messages to the Club',
              'Sent from Ireland (AWS eu-west-1); account data and email logs stored in the USA',
              '[Solicitor/Dan to confirm from Resend’s data processing agreement]',
            ],
            [
              'Functional Software, Inc. (Sentry)',
              'Error monitoring: reports of technical errors in the website, with personal details removed before they are sent',
              'EU (Germany); support access may be from the USA',
              '[Solicitor/Dan to confirm from Sentry’s data processing agreement]',
            ],
            [
              'GitHub, Inc. (Microsoft)',
              'Runs the automated nightly backup job, which handles the database briefly before encrypting it',
              'USA',
              'UK Extension to the EU–US Data Privacy Framework; UK Addendum to the EU Standard Contractual Clauses',
            ],
          ],
        },
      ],
    },
  ]
}
