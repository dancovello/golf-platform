/** Shared by the website's menu and the dashboard's drop-down preview, which can't import the
 * server-side loader. */

/** A one-page drop-down shows up to 3 columns of 6 neatly (spec 17); more gets a warning. */
export const MENU_DROPDOWN_LIMIT = 18

/** In a drop-down of several pages, each column lists this many child pages; any more are
 * reached through an "All … pages" link to the page itself. */
export const COLUMN_LINK_LIMIT = 8
