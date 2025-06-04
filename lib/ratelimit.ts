interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimit = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowMs: number = 60 * 1000 // 1 dakika
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  // Eski kayıtları temizle
  const entry = rateLimit.get(key)
  if (entry && now > entry.resetTime) {
    rateLimit.delete(key)
  }
  
  const currentEntry = rateLimit.get(key) || { count: 0, resetTime: now + windowMs }
  
  if (currentEntry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: currentEntry.resetTime
    }
  }
  
  currentEntry.count++
  rateLimit.set(key, currentEntry)
  
  return {
    success: true,
    remaining: maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime
  }
}

export function getRateLimitHeaders(remaining: number, resetTime: number) {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString()
  }
} 