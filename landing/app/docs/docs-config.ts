export interface DocItem {
  label: string
  slug: string
}

export interface DocSection {
  title: string
  items: DocItem[]
}

export const docsConfig: DocSection[] = [
  {
    title: 'User Guide',
    items: [
      {
        label: 'Install',
        slug: 'install',
      },
      {
        label: 'Configuration',
        slug: 'configuration',
      },
      {
        label: 'S3/Folder Browser',
        slug: 'folder-browser',
      },
      {
        label: 'Database Browser',
        slug: 'database-browser',
      },
      {
        label: 'Table Viewer',
        slug: 'table-viewer',
      },
      {
        label: 'Exploratory Data Analysis',
        slug: 'exploratory-data-analysis',
      },
      {
        label: 'Embedding',
        slug: 'embedding',
      },
      {
        label: 'Visualization',
        slug: 'visualization',
      },
    ],
  },
  {
    title: 'Deep Dive',
    items: [
      {
        label: 'Authentication',
        slug: 'authentication',
      },
    ],
  },
]
