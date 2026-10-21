import type { GlobalConfig } from 'payload'

import { MarketingSettings } from '../marketing/MarketingSettings'

// Every settings screen (Payload "global") must be listed here. tests/unit/access-guard.spec.ts
// checks that each defines its own read and update access functions.
export const globals: GlobalConfig[] = [MarketingSettings]
