export type FormatCountOptions = {
  /** Above this the count shows as `max+`, such as 99+. */
  max?: number
  /** `compact` shortens counts from 1,000 up, such as 1.2K. */
  notation?: "standard" | "compact"
  /** Puts a plus before the count, for things not shown, such as +4. */
  plus?: boolean
  /** BCP 47 locale for the digits and separators. */
  locale?: string
}

/**
 * A count as it should be shown: capped, shortened or signed. The exact
 * number is for speech, so a capped or shortened count says it in full.
 */
export function formatCount(
  value: number,
  { max, notation = "standard", plus = false, locale }: FormatCountOptions = {}
) {
  const standard = new Intl.NumberFormat(locale)
  const exact = standard.format(value)
  let shown: string
  if (max !== undefined && value > max) {
    shown = `${standard.format(max)}+`
  } else if (notation === "compact" && Math.abs(value) >= 1000) {
    shown = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  } else {
    shown = exact
  }
  return { shown: plus ? `+${shown}` : shown, exact }
}
