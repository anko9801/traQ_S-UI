import { resolveBasicTheme, ResolvedBasicTheme } from './basic'
import { Theme, CSSColorType, BrowserTheme } from '/@/types/theme'

export type ResolvedTheme = {
  basic: ResolvedBasicTheme
  browser: BrowserTheme
  specific: SpecificTheme
}

type SpecificTheme = {
  channelHashOpened: CSSColorType
  channelUnreadBadgeText: CSSColorType
}

const resolveBrowserTheme = (
  original: Partial<BrowserTheme> | undefined,
  basic: ResolvedBasicTheme
): BrowserTheme => ({
  themeColor: original?.themeColor ?? basic.accent.primary.default
})

const resolveSpecificTheme = (basic: ResolvedBasicTheme): SpecificTheme => ({
  channelHashOpened: basic.background.secondary.border,
  channelUnreadBadgeText: basic.background.secondary.border
})

export const resolveTheme = (original: Theme): ResolvedTheme => {
  const resolvedBasicTheme = resolveBasicTheme(original.basic)
  return {
    basic: resolvedBasicTheme,
    browser: resolveBrowserTheme(original.browser, resolvedBasicTheme),
    specific: resolveSpecificTheme(resolvedBasicTheme)
  }
}
