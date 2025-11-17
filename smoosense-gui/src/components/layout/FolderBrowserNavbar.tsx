'use client'

import { useAppSelector } from '@/lib/hooks'
import DebugStateViewer from '@/components/debug/DebugStateViewer'
import FolderBrowserSharePopover from './FolderBrowserSharePopover'
import NavbarSkeleton from './NavbarSkeleton'

interface FolderBrowserNavbarProps {
  title?: string
}

export default function FolderBrowserNavbar({ title }: FolderBrowserNavbarProps) {
  const debugMode = useAppSelector((state) => state.ui.debugMode)

  // Icon buttons array (excluding GlobalSettings which is added automatically)
  const iconButtons = [
    ...(debugMode ? [<DebugStateViewer key="debug" />] : []),
    <FolderBrowserSharePopover key="share" />
  ]

  return (
    <NavbarSkeleton
      title={title}
      iconButtons={iconButtons}
      globalSettingsContext="FolderBrowser"
    />
  )
}