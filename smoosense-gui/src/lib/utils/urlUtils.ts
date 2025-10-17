export const API_PREFIX = './api';

export const CDN_URL = 'https://cdn.smoosense.ai'

export const getScheme = (url: string): string => {
  if (!url) {
    return '';
  } else if (url.includes('://')) {
    return url.split('://')[0].toLowerCase();
  } else {
    return '';
  }
}

export const needProxy = (url: string): boolean => {
  const scheme = getScheme(url);
  return !['http', 'https', ''].includes(scheme);
}

export const proxyedUrl = (url: string): string => {
  // Assert that relative URLs should have been handled before this stage
  if (url.startsWith('./') || url.startsWith('/') || url.startsWith('~/')) {
    return url
  }

  // At this point, url should be an absolute URL (http://, https://, s3://, etc.)
  if (!needProxy(url)) {
    return url
  } else {
    // Proxy cloud storage URLs (s3://, etc.)
    return `${API_PREFIX}/s3-proxy?url=${encodeURIComponent(url)}`
  }
}

export const isOnCloud = (fullPath: string): string => {
  const scheme = getScheme(fullPath);
  return scheme;
}

