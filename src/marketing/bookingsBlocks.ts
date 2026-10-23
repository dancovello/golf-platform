import type { Block } from 'payload'

/**
 * Bookings page blocks (Figma "Bookings — Desktop" 184:3614), a Coming next preview (hand-off
 * §6): simulations of booking that isn't built yet, always labelled as such. Nothing is booked.
 */
const bookingDemo: Block = {
  slug: 'mkBookingDemo',
  dbName: 'mk_booking_demo',
  interfaceName: 'MarketingBookingDemoBlock',
  labels: { singular: 'Booking preview', plural: 'Booking previews' },
  fields: [
    {
      name: 'demo',
      label: 'Preview',
      type: 'select',
      required: true,
      defaultValue: 'teeSheet',
      options: [
        { label: 'Tee sheet (book a slot)', value: 'teeSheet' },
        { label: 'Club booking settings', value: 'clubSettings' },
        { label: 'Facilities (range, simulators, spa)', value: 'facilities' },
      ],
    },
    {
      name: 'showLabel',
      label: 'Show the “Coming next · not live yet” label above it',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Keep it on for the first preview on a page, so visitors know none of this is live.',
      },
    },
  ],
}

export const bookingsBlocks: Block[] = [bookingDemo]
