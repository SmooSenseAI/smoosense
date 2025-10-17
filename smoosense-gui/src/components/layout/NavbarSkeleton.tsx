'use client'

import { useAppSelector } from '@/lib/hooks'
import { useEffect, ReactNode } from 'react'
import React from 'react'
import Logo from '@/components/common/Logo'
import GlobalSettingsDropdown from '@/components/settings/GlobalSettings'
import HelpPopover from '@/components/common/HelpPopover'

interface NavbarSkeletonProps {
  className?: string
  tabList?: ReactNode
  iconButtons?: ReactNode[]
  globalSettingsContext?: 'Table' | 'FolderBrowser'
  secondLevel?: ReactNode
}

export default function NavbarSkeleton({
  className = "",
  tabList,
  iconButtons = [],
  globalSettingsContext,
  secondLevel
}: NavbarSkeletonProps) {
  const fontSize = useAppSelector((state) => state.ui.fontSize)

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return (
    <nav className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full ${className}`}>
      {/* Main navbar level */}
      <div className="flex h-14 items-center px-4 w-full">
        {/* Logo - leftmost */}
        <div className="flex items-center gap-2">
          <Logo />
        </div>

        {/* Tab list - center, or flex spacer if no tabs */}
        {tabList ? (
          <div className="flex-1 flex justify-center">
            {tabList}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Icon buttons + Help + Global Settings - rightmost */}
        <div className="flex items-center space-x-2">
          {iconButtons.map((button, index) => (
            <React.Fragment key={index}>{button}</React.Fragment>
          ))}
          <HelpPopover />
          <GlobalSettingsDropdown context={globalSettingsContext} />
        </div>
      </div>

      {/* Second level if provided */}
      {secondLevel}
    </nav>
  )
}