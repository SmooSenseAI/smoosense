'use client'

import { Separator } from '@/components/ui/separator'
import { Settings } from 'lucide-react'
import IconPopover from '@/components/common/IconPopover'
import CommonSettingSection from './CommonSettingSection'
import TableSettingSection from './TableSettingSection'
import FolderBrowserSection from './FolderBrowserSection'
import RowDetailSection from './RowDetailSection'
import MediaSection from './MediaSection'
import Logo from '@/components/common/Logo'

interface GlobalSettingsDropdownProps {
  context?: 'Table' | 'FolderBrowser' | 'LiteTable' | 'MiniTable'
}

export default function GlobalSettingsDropdown({ context }: GlobalSettingsDropdownProps) {
  const renderContextSpecificSection = () => {
    switch (context) {
      case 'Table':
        return (
          <>
            <TableSettingSection />
            <Separator className="my-4" />
            <RowDetailSection />
          </>
        )
      case 'LiteTable':
        return (
            <>
              <TableSettingSection />
              <Separator className="my-4" />
              <MediaSection />
              <Separator className="my-4" />
              <div className="flex items-end gap-2 text-sm text-muted-foreground">
                <span>Powered by</span>
                <Logo mini={false} linkToLanding={true}/>
              </div>
            </>
        )
      case 'MiniTable':
        return <TableSettingSection />
      case 'FolderBrowser':
        return <FolderBrowserSection />
      default:
        return null
    }
  }

  return (
    <IconPopover
      icon={<Settings />}
      tooltip="Settings"
      contentClassName="w-80 p-4"
      align="end"
    >
      <div className="space-y-4">
        <CommonSettingSection />

        {context && (
          <>
            <Separator className="my-4" />
            {renderContextSpecificSection()}
          </>
        )}
      </div>
    </IconPopover>
  )
}