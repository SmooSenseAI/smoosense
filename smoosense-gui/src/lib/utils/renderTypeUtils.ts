import { RenderType } from './agGridCellRenderers'

/**
 * Check if a render type is a media type (image, video, pdf, or image mask)
 */
export function isMediaType(renderType: RenderType): boolean {
  return renderType === RenderType.ImageUrl ||
         renderType === RenderType.VideoUrl ||
         renderType === RenderType.PdfUrl ||
         renderType === RenderType.ImageMask
}

/**
 * Check if a render type supports visual content (media + iframe + bbox)
 */
export function isVisualType(renderType: RenderType): boolean {
  return isMediaType(renderType) || renderType === RenderType.IFrame || renderType === RenderType.Bbox
}