'use client'

import { useAppSelector } from '@/lib/hooks'
import CellPopover from '@/components/ui/CellPopover'

interface ImageBlockProps {
  src: string
  alt?: string
  className?: string
  style?: React.CSSProperties
  neverFitCover?: boolean
  showPopover?: boolean
}

export default function ImageBlock({
  src,
  alt = 'Image',
  className = '',
  style,
  neverFitCover = false,
  showPopover = false
}: ImageBlockProps) {
  const cropMediaToFitCover = useAppSelector((state) => state.ui.cropMediaToFitCover)

  const finalClassName = `${className} ${(cropMediaToFitCover && !neverFitCover) ? 'object-cover' : 'object-contain'}`.trim()

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Always show broken image fallback
    const target = e.target as HTMLImageElement
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+SW52YWxpZCBJbWFnZTwvdGV4dD48L3N2Zz4='
  }

  const imageContent = (
    <img
      src={src}
      alt={alt}
      className={finalClassName}
      style={style}
      onError={handleError}
    />
  )

  if (!showPopover) {
    return imageContent
  }

  return (
    <CellPopover
      cellContent={imageContent}
      popoverContent={
        <div className="p-2">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onError={handleError}
          />
        </div>
      }
      url={src}
      popoverClassName="w-[500px] h-[500px]"
      cellContentClassName="items-center justify-center"
      copyValue={src}
      side="right"
    />
  )
}