import { pageview, event as gtagEvent } from './gtag'

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const trackPageview = (url: string) => {
  if (GA_TRACKING_ID) {
    pageview(GA_TRACKING_ID, url)
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const trackEvent = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (GA_TRACKING_ID) {
    gtagEvent(action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}