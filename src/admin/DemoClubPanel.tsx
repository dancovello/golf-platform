import { sitePreviewEnabled } from '@/site/preview'

import { DemoClubButton } from './DemoClubButton'

/** Above the Clubs list, only where club previews exist (staging and local, not production). */
export const DemoClubPanel = () => (sitePreviewEnabled() ? <DemoClubButton /> : null)
