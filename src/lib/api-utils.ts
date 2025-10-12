import { showToast } from './toast'

/**
 * Utility to handle API calls with retry logic for sleeping backends
 */

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
}

export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const { 
    maxRetries = 3, 
    retryDelay = 2000, 
    onRetry 
  } = retryOptions

  let lastError: Error = new Error('Unknown error')

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      // If successful or it's a client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }
      
      // For server errors (5xx) or network errors, retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt)
      }
      
      // Show retry notification
      if (attempt === 1) {
        showToast('Backend is waking up, retrying...', 'warning', 3000)
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
    }
  }
  
  throw lastError
}

export function isBackendSleeping(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || ''
  return (
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('connection refused') ||
    error?.name === 'TypeError'
  )
}

export function showBackendSleepingMessage() {
  showToast(
    'Backend is sleeping (Render free tier). Please wait 30-60s and try again.',
    'warning',
    8000
  )
}