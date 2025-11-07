'use client'

import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { setActiveTab } from '@/lib/features/ui/uiSlice'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import IconDialog from '@/components/common/IconDialog'
import AssistantPopover from '@/lib/features/assistant/AssistantPopover'
import SharePopover from './SharePopover'
import { useAIQuickActions } from '@/lib/hooks/useAIQuickActions'
import { Folder } from 'lucide-react'
import DebugStateViewer from '@/components/debug/DebugStateViewer'
import SqlHistoryViewer from '@/components/debug/SqlHistoryViewer'
import NavbarSkeleton from './NavbarSkeleton'
import FolderBrowserTabContent from '@/components/folder-browser/FolderBrowserTabContent'
import TableStatusBar from './TableStatusBar'
import FileInfoDialog from '@/components/common/fileInfo/FileInfoDialog'

const mainTabs = ['Summarize', 'Table', 'Gallery', 'Plot', 'HandPick', 'Query']


export default function TableNavbar() {
  const dispatch = useAppDispatch()
  const debugMode = useAppSelector((state) => state.ui.debugMode)
  const activeTab = useAppSelector((state) => state.ui.activeTab)
  const { hasData: hasQuickActions } = useAIQuickActions()
  
  // Handle opening folder browser - no need to set path as it's handled by rootFolder state
  const handleOpenFolderBrowser = () => {
    // Folder path is managed by state.ui.rootFolder through FolderUrlParamsProvider
  }

  // Tab list component
  const tabList = (
    <Tabs
      value={activeTab}
      onValueChange={(value) => dispatch(setActiveTab(value))}
      className="w-auto"
    >
      <TabsList className="flex w-auto bg-transparent border-b border-border p-0 h-auto rounded-none">
        {mainTabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className={`
              text-sm px-6 py-2 rounded-none transition-colors cursor-pointer
              bg-transparent
              hover:bg-muted/70
              border-b-2
              border-transparent
              data-[state=active]:border-b-primary
              dark:data-[state=active]:border-b-primary
              dark:data-[state=active]:shadow-none
            `}
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
  // Icon buttons array (excluding GlobalSettings which is added automatically)
  const iconButtons = [
    <FileInfoDialog key="fileinfo" />,
    ...(hasQuickActions ? [<AssistantPopover key="assistant" />] : []),

    <IconDialog
      key="folder"
      icon={<Folder />}
      tooltip="Browse files in the same folder"
      title="Browse files in the same folder"
      width="90vw"
      height="90vh"
      buttonClassName="h-8 px-2"
      onOpen={handleOpenFolderBrowser}
    >
      <FolderBrowserTabContent />
    </IconDialog>,
    <SharePopover key="share" />,
    ...(debugMode ? [<DebugStateViewer key="debug" />, <SqlHistoryViewer key="sql" />] : [])
  ]

  // Second level content
  const secondLevel = (
    <div className="h-10 px-4 relative flex items-center">
      {/* Table Status Bar */}
      {activeTab !== 'Query' && activeTab !== 'HandPick' && <TableStatusBar />}
    </div>
  )

  return (
    <NavbarSkeleton
      tabList={tabList}
      iconButtons={iconButtons}
      globalSettingsContext='Table'
      secondLevel={secondLevel}
    />
  )
}