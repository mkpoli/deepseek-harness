import { readFileSync } from 'node:fs'
import * as desktop from '../apps/desktop/src/locale.ts'
import { INSTALLER_LOCALE_IDS, readInstallerLocales } from '../apps/desktop/scripts/installer-locales.mjs'
/** Translations preserve executable command examples and named interpolation fields. */
import { expect, it } from 'vitest'
import { SHIPPED_LOCALE_IDS, shippedLocaleExportName, localeTokens, hasInvisibleLocaleCharacters } from './shipped-locales.ts'

it('retains repeated placeholders, commands, and API identifiers', () => {
  expect(localeTokens('Use /plan off, /compact and /THEME=dark with {count}, {count} and reasoning_effort.'))
    .toEqual(['/THEME=dark', '/compact', '/plan off', 'reasoning_effort', '{count}', '{count}'])
})

it('ignores translated prose and non-command slashes', () => {
  expect(localeTokens('Cmd/Ctrl+Enter · tok/s · https://example.test/v1')).toEqual([])
  expect(localeTokens('Используйте /plan off и {count}'))
    .toEqual(localeTokens('Use /plan off and {count}'))
})

it.each([['/plan off', '/plan désactivé'], ['/THEME=light', '/THEME=claro'], ['reasoning_effort', 'Reasoning_effort'], ['{count}', '{other}']])('detects a change from %s to %s', (source, translated) => {
  expect(localeTokens(translated)).not.toEqual(localeTokens(source))
})

it('recognizes commands at the start of copy or after CJK punctuation', () => {
  expect(localeTokens('/THEME=auto、/THEME=light')).toEqual(['/THEME=auto', '/THEME=light'])
})

it.each(['\u200b', '\ufeff'])('rejects an invisible translation character', (character) => {
  expect(hasInvisibleLocaleCharacters(`text${character}text`)).toBe(true)
  expect(hasInvisibleLocaleCharacters('normal text')).toBe(false)
})

it('matches Desktop dictionaries, resolution and installer resources to the shipped catalog', () => {
  const names = SHIPPED_LOCALE_IDS.map(shippedLocaleExportName).sort()
  expect(Object.keys(desktop).filter(name => names.includes(name)).sort()).toEqual(names)
  for (const id of SHIPPED_LOCALE_IDS) {
    const desktopId = id === 'zh' ? 'zh-CN' : id
    expect(desktop.resolveDesktopLocale(id).id).toBe(desktopId)
    expect(desktop.resolveDesktopStartupLocale(null, [id]).id).toBe(desktopId)
  }
  expect(INSTALLER_LOCALE_IDS).toHaveLength(SHIPPED_LOCALE_IDS.length)
  expect(readInstallerLocales().map(locale => locale.id).sort()).toEqual([...INSTALLER_LOCALE_IDS].sort())
})

it('rejects invisible characters in the Desktop locale source', () => {
  expect(hasInvisibleLocaleCharacters(readFileSync(new URL('../apps/desktop/src/locale.ts', import.meta.url), 'utf8'))).toBe(false)
})
