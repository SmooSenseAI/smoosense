import _ from 'lodash'
import { getFileType, FileType } from './fileTypes'

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

/**
 * Check if a URL points to a specific file type
 */
export function isUrlOfType(url: string, type: FileType): boolean {
  if (!isUrl(url)) return false
  const urlParts = url.split('/')
  const filename = urlParts[urlParts.length - 1].split('?')[0]
  return getFileType(filename) === type
}

/**
 * Check if all non-empty strings in a list are URLs of a specific file type
 */
export function isAllUrlType(valueList: unknown[], type: FileType): boolean {
  if (!_.isArray(valueList) || valueList.length === 0) return false

  const stringItems = valueList.filter(
    item => typeof item === 'string' && item.trim() !== ''
  ) as string[]

  return stringItems.length > 0 && stringItems.every(item => isUrlOfType(item, type))
}

