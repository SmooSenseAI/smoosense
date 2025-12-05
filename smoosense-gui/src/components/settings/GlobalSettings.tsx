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
import { useAuth, logout } from '@/lib/hooks/useAuth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface GlobalSettingsDropdownProps {
  context?: 'Table' | 'FolderBrowser' | 'LiteTable' | 'MiniTable'
}

export default function GlobalSettingsDropdown({ context }: GlobalSettingsDropdownProps) {
  const { authenticated, user, loading } = useAuth()

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

  // Get user initials for avatar fallback
  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return '?'
  }

  // Render icon based on auth state
  const renderIcon = () => {
    if (loading || !authenticated || !user) {
      return <Settings />
    }
    return (
      <Avatar className="h-6 w-6">
        <AvatarImage
          src={user.picture || undefined}
          alt={user.name || user.email}
          referrerPolicy="no-referrer"
        />
        <AvatarFallback className="text-xs">
          {getInitials(user.name, user.email)}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Render user info section
  const renderUserSection = () => {
    if (!authenticated || !user) {
      return null
    }
    return (
      <>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user.picture || undefined}
              alt={user.name || user.email}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {user.name && (
              <div className="text-sm font-medium truncate">{user.name}</div>
            )}
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full mt-2"
        >
          Sign out
        </Button>
        <Separator className="my-4" />
      </>
    )
  }

  return (
    <IconPopover
      icon={renderIcon()}
      tooltip={authenticated && user ? user.email : "Settings"}
      contentClassName="w-80 p-4"
      align="end"
    >
      <div className="space-y-4">
        {renderUserSection()}
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