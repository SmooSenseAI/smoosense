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

/**
 * Check if a string is a URL (http, https, s3, ftp, file, or relative path)
 */
export function isUrl(str: string): boolean {
  return str.startsWith('http://') ||
         str.startsWith('https://') ||
         str.startsWith('iframe+http://') ||
         str.startsWith('iframe+https://') ||
         str.startsWith('s3://') ||
         str.startsWith('ftp://') ||
         str.startsWith('file://') ||
         str.startsWith('./') ||
         str.startsWith('~/') ||
         str.startsWith('/')
}

export const isOnCloud = (fullPath: string): string => {
  const scheme = getScheme(fullPath);
  return scheme;
}

