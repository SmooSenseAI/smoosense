'use client'

import { useAppSelector } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2 } from 'lucide-react'
import DebugStateViewer from '@/components/debug/DebugStateViewer'
import NavbarSkeleton from './NavbarSkeleton'

interface FolderBrowserNavbarProps {
  title?: string
}

export default function FolderBrowserNavbar({ title }: FolderBrowserNavbarProps) {
  const debugMode = useAppSelector((state) => state.ui.debugMode)

  // Icon buttons array (excluding GlobalSettings which is added automatically)
  const iconButtons = [
    ...(debugMode ? [<DebugStateViewer key="debug" />] : []),
    <DropdownMenu key="share">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Share</h3>
          <p className="text-sm text-muted-foreground">
            Share functionality will be implemented here.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  ]

  return (
    <NavbarSkeleton
      title={title}
      iconButtons={iconButtons}
      globalSettingsContext="FolderBrowser"
    />
  )
}