'use client'

import dynamic from 'next/dynamic'

/**
 * Loads the tuning page in the browser only: its sliders start from values saved in this
 * browser, which the server can't see.
 */
export const IntroLabLoader = dynamic(() => import('./IntroLab').then((mod) => mod.IntroLab), {
  ssr: false,
})
