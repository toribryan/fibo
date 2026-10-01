/*
 * On phones the docs pages carry fibo's Floating nav in place of Storybook's
 * bottom bar. The nav lives in the preview and the page list in the manager,
 * so its Menu item asks the manager to open the list with this event.
 */
export const OPEN_MENU = "fibo/open-menu"

// Storybook's own switch to its mobile layout.
export const MOBILE_QUERY = "(max-width: 599px)"
