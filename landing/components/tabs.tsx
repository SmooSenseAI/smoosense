'use client'

import { Box, Tabs as ChakraTabs, TabList, Tab } from '@chakra-ui/react'
import { useMemo, useState, lazy, Suspense } from 'react'

// Lazy load the markdown renderer
const TabContent = lazy(() => import('./tab-content'))

interface TabData {
  title: string
  content: string
}

interface TabsProps {
  content: string
}

export function Tabs({ content }: TabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Parse the content to extract tab data
  const tabs = useMemo(() => {
    const tabData: TabData[] = []
    const lines = content.trim().split('\n')

    let currentTab: TabData | null = null

    for (const line of lines) {
      // Check if line starts with "---" to indicate a new tab (e.g., "--- Tab Name")
      if (line.startsWith('--- ')) {
        // Save previous tab if exists
        if (currentTab) {
          tabData.push(currentTab)
        }
        // Start new tab
        currentTab = {
          title: line.substring(4).trim(),
          content: ''
        }
      } else if (currentTab) {
        // Add content to current tab
        currentTab.content += (currentTab.content ? '\n' : '') + line
      }
    }

    // Don't forget the last tab
    if (currentTab) {
      tabData.push(currentTab)
    }

    return tabData
  }, [content])

  return (
    <ChakraTabs
      variant="soft-rounded"
      colorScheme="purple"
      mb={6}
      index={selectedIndex}
      onChange={setSelectedIndex}
    >
      <TabList mb={4} flexWrap="wrap">
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            color="gray.400"
            _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
            _selected={{ color: 'white', bg: 'purple.600' }}
          >
            {tab.title}
          </Tab>
        ))}
      </TabList>

      <Box mt={4}>
        <Suspense fallback={<Box color="gray.400">Loading...</Box>}>
          <TabContent content={tabs[selectedIndex]?.content || ''} />
        </Suspense>
      </Box>
    </ChakraTabs>
  )
}
