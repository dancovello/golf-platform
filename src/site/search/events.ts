/** Opens the header search panel from anywhere: the header button, the phone menu, "/". */
export const OPEN_SEARCH_EVENT = 'club-search:open'

export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))
