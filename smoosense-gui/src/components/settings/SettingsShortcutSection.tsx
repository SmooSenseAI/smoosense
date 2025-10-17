'use client'

import UISettingToggle from '@/components/ui/UISettingToggle'
import RowHeightButtons from '@/components/ui/RowHeightButtons'
import { useSingleColumnRenderType } from '@/lib/hooks/useRenderType'
import { RenderType } from '@/lib/utils/agGridCellRenderers'
import { isMediaType, isVisualType } from '@/lib/utils/renderTypeUtils'

interface SettingsShortcutSectionProps {
  columnName: string
}

export default function SettingsShortcutSection({ columnName }: SettingsShortcutSectionProps) {
  const renderType = useSingleColumnRenderType(columnName)

  // Don't render anything if no specific controls are needed
  if (!isVisualType(renderType)) {
    return null
  }


  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">
        Setting all medias (image/video)
      </div>


      <div className="space-y-3">
        {isVisualType(renderType) && (
          <RowHeightButtons />
        )}

        {isMediaType(renderType) && (
          <UISettingToggle
            settingKey="cropMediaToFitCover"
            label="Crop images/videos to cover"
          />
        )}

        {renderType === RenderType.VideoUrl && (
          <>
            <UISettingToggle
              settingKey="autoPlayAllVideos"
              label="Auto Play All Videos"
            />

            <UISettingToggle
              settingKey="galleryVideoMuted"
              label="Mute Videos"
            />
          </>
        )}
      </div>
    </div>
  )
}