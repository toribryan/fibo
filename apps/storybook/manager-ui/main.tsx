import "virtual:fibo-manager.css"

import { BRIDGE_READY } from "../.storybook/manager-bridge.js"
import { mountCommandSearch } from "./command-search.js"
import { mountThemeMenu } from "./theme-menu.js"

// manager.tsx sets the bridge once Storybook registers its addons, which can
// land before or after this script runs.
function start() {
  const bridge = window.__FIBO_MANAGER__
  if (!bridge) return false
  mountCommandSearch(bridge)
  mountThemeMenu(bridge)
  return true
}

if (!start()) window.addEventListener(BRIDGE_READY, start, { once: true })
