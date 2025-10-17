'use client'

import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '@/components/common/Logo'
import FilterStatusChips from '@/components/common/FilterStatusChips'
import GlobalSettingsDropdown from '@/components/settings/GlobalSettings'

export default function MiniTableTopBar() {
  const handleOpenFullView = () => {
    const currentUrl = new URL(window.location.href)
    const fullViewUrl = `/Table${currentUrl.search}`
    window.open(fullViewUrl, '_blank')
  }

  return (
    <div className="flex items-center justify-between p-3 border-b bg-background h-10">
      {/* Left: Logo */}
      <div className="flex items-center">
        <Logo mini={true} />
      </div>

      {/* Center: Filter Status */}
      <div className="flex-1 flex justify-center">
        <FilterStatusChips />
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenFullView}
          title="Open full table view"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>

        <GlobalSettingsDropdown context="MiniTable" />
      </div>
    </div>
  )
}