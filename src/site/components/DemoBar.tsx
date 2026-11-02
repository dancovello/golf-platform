import { demoLabel } from '@/site/demo'

import './demoBar.css'

/**
 * The strip on every prospect demo page: "Demo - expires in 12 days". Fixed to the bottom of
 * the window so it can't be scrolled away, in plain neutral colours whatever the club's brand
 * (src/site/demo.ts).
 */
export const DemoBar = ({ expiresAt }: { expiresAt: string }) => (
  <div className="demo-bar" role="status">
    {demoLabel(expiresAt)}
  </div>
)

/** What a visitor sees once a demo's 30 days have run out: nothing about the club. */
export const ExpiredDemo = () => (
  <main style={{ padding: '96px 24px', fontFamily: 'system-ui, sans-serif', maxWidth: 640 }}>
    <h1>This demo has expired</h1>
    <p>
      Demos are only available for 30 days. Ask the person who sent you the link to share it again.
    </p>
  </main>
)
