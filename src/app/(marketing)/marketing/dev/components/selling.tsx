import { Assurance, CompareRows, Objections, Steps } from '@/marketing/site/selling/SellingBlocks'
import { RoleTabs } from '@/marketing/site/selling/RoleTabs'

/** Sample content for the v2 selling blocks, with the words from the Figma v2 frames. */
const id = (n: number) => `sample-${n}`

export const SellingSamples = () => (
  <>
    <div className="mk-review-demo">
      <Assurance
        block={{
          blockType: 'mkAssurance',
          items: [
            {
              id: id(1),
              title: 'Unlimited editors',
              body: 'Your whole committee can post, at no extra cost.',
            },
            {
              id: id(2),
              title: 'Your content moves across',
              body: 'Pages, news and photos copied from your current site.',
            },
            {
              id: id(3),
              title: 'Supported until live',
              body: 'We set it up with you and stay until it is live.',
            },
            {
              id: id(4),
              title: 'Designed for phones first',
              body: 'Every block has its own phone layout.',
            },
          ],
        }}
      />
    </div>
    <div className="mk-review-demo">
      <CompareRows
        block={{
          blockType: 'mkCompareRows',
          oldLabel: 'How it usually goes',
          ourLabel: 'With us',
          rows: [
            {
              id: id(1),
              oldWay: 'Every change goes to an agency and waits in a queue.',
              ourWay: 'Change it yourself and publish in minutes.',
            },
            {
              id: id(2),
              oldWay: 'Only one person knows how to edit it.',
              ourWay: 'Your whole committee can post, with no extra cost.',
            },
            {
              id: id(3),
              oldWay: 'Pages that are hard to read on a phone.',
              ourWay: 'Every block has its own phone layout.',
            },
          ],
        }}
      />
    </div>
    <div className="mk-review-demo">
      <Steps
        block={{
          blockType: 'mkSteps',
          steps: [
            {
              id: id(1),
              title: 'See your club on it',
              body: 'Your demo shows your own homepage, rebuilt on the platform.',
            },
            {
              id: id(2),
              title: 'We move your content',
              body: 'Pages, news and photos, copied across.',
            },
            {
              id: id(3),
              title: 'We build it with you',
              body: 'Your colours, your photos, your words.',
            },
            { id: id(4), title: 'You run it', body: 'Your whole committee can post from day one.' },
          ],
        }}
      />
    </div>
    <div className="mk-review-demo">
      <Objections
        block={{
          blockType: 'mkObjections',
          items: [
            {
              id: id(1),
              topic: 'Switching',
              question: '“We already have a website.”',
              answer:
                'Keep your domain. We move your content across, and your old page addresses redirect to the new ones.',
            },
            {
              id: id(2),
              topic: 'Cost',
              question: '“What will it cost?”',
              answer:
                'One monthly fee and a one-off setup fee agreed with you, with nothing hidden.',
            },
          ],
        }}
      />
    </div>
    <div className="mk-review-demo">
      <RoleTabs
        block={{
          blockType: 'mkRoleTabs',
          roles: [
            {
              id: id(1),
              tab: 'Secretary',
              eyebrow: 'For the secretary',
              headline: 'Post it once. Members see it.',
              points: [
                { id: id(1), text: 'Course status posted before the phone starts ringing.' },
                { id: id(2), text: 'News, results and notices published in minutes.' },
                {
                  id: id(3),
                  text: 'No agency queue, and no waiting for the member who’s good with computers.',
                },
              ],
              visual: 'courseStatus',
            },
            {
              id: id(2),
              tab: 'Committee',
              eyebrow: 'For the committee',
              headline: 'A website the whole club is proud of.',
              points: [
                { id: id(1), text: 'Your colours, your photos, your layout.' },
                { id: id(2), text: 'Competitions and socials listed the moment they’re set.' },
                { id: id(3), text: 'However many people post, the site still looks right.' },
              ],
              visual: 'events',
            },
            {
              id: id(3),
              tab: 'Treasurer',
              eyebrow: 'For the treasurer',
              headline: 'One fee your committee can sign off.',
              points: [
                {
                  id: id(1),
                  text: 'One monthly fee, with hosting, security and backups included.',
                },
                { id: id(2), text: 'Unlimited editors at no extra cost.' },
                { id: id(3), text: 'No agency invoices for small changes.' },
              ],
              visual: 'greenFees',
            },
            {
              id: id(4),
              tab: 'Members & visitors',
              eyebrow: 'For members and visitors',
              headline: 'The answers they want, on their phone.',
              points: [
                { id: id(1), text: 'Is the course open? Course status, kept up to date.' },
                { id: id(2), text: 'What does a round cost? Green fees for every season.' },
                { id: id(3), text: 'Search that goes straight to the answer.' },
              ],
              visual: 'search',
            },
          ],
        }}
      />
    </div>
  </>
)
