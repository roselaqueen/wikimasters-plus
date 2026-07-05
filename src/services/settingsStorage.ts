import type { Settings } from '../types/domain'
const KEY = 'wikimasters-plus:v1'
export const defaults: Settings = {
  theme: 'dark',
  density: 'comfortable',
  cardStyle: 'classic',
  accent: '#7667e8',
  banner: 'atlas',
  background: true,
}
export function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as Settings
  } catch {
    return defaults
  }
}
export function saveSettings(value: Settings) {
  localStorage.setItem(KEY, JSON.stringify(value))
}
