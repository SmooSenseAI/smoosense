export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: any
    ) => void
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (trackingId: string, url: string) => {
  window.gtag('config', trackingId, {
    page_path: url,
  })
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (action: string, parameters: any) => {
  window.gtag('event', action, parameters)
}