export type OptInPersonalWidget = 'weather' | 'focus' | 'note'

// Weather stays opt-in: showing it is what allows requests to Open-Meteo.
const VISIBLE_KEYS: Record<OptInPersonalWidget, string> = {
  weather: 'orca.status-bar.weather-visible.v1',
  focus: 'orca.status-bar.focus-visible.v1',
  note: 'orca.status-bar.quick-note-visible.v1'
}

export function readPersonalWidgetVisible(widget: OptInPersonalWidget): boolean {
  try {
    return localStorage.getItem(VISIBLE_KEYS[widget]) === 'true'
  } catch {
    return false
  }
}

export function savePersonalWidgetVisible(widget: OptInPersonalWidget, visible: boolean): void {
  try {
    if (visible) {
      localStorage.setItem(VISIBLE_KEYS[widget], 'true')
    } else {
      localStorage.removeItem(VISIBLE_KEYS[widget])
    }
  } catch {
    // Keep the current session usable if device storage is unavailable.
  }
}
