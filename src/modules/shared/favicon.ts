/** 校验 URL 是否合法（SSRF 防护） */
export function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    const hostname = url.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return false

    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = hostname.match(ipv4Pattern)
    if (match) {
      const [, a, b] = match.map(Number)
      if (a === 10) return false
      if (a === 172 && b >= 16 && b <= 31) return false
      if (a === 192 && b === 168) return false
      if (a === 127) return false
      if (a === 169 && b === 254) return false
      if (a === 0) return false
    }
    return true
  } catch {
    return false
  }
}
