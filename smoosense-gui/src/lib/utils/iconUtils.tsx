import { 
  Folder, 
  FolderOpen, 
  File, 
  Braces,
  Columns3, 
  Rows3, 
  ImageIcon, 
  Video, 
  ChevronDown, 
  ChevronRight,
  ToggleLeft,
  Calendar,
  Hash,
  Link,
  Type
} from 'lucide-react'

const CLS_ICON = "h-4 w-4"

export const ICONS = {
  // File type icons
  FOLDER_OPEN: <FolderOpen className={CLS_ICON} />,
  FOLDER_CLOSED: <Folder className={CLS_ICON} />,
  JSON: <Braces className={CLS_ICON} />,
  COLUMNAR_TABLE: <Columns3 className={CLS_ICON} />,
  ROW_TABLE: <Rows3 className={CLS_ICON} />,
  IMAGE: <ImageIcon className={CLS_ICON} />,
  VIDEO: <Video className={CLS_ICON} />,
  TEXT: <Type className={CLS_ICON} />,
  FILE_DEFAULT: <File className={CLS_ICON} />,
  
  // Tree navigation
  CHEVRON_DOWN: <ChevronDown className={CLS_ICON} />,
  CHEVRON_RIGHT: <ChevronRight className={CLS_ICON} />,
  
  // Render type icons  
  BOOLEAN: <ToggleLeft className={CLS_ICON} />,
  DATE: <Calendar className={CLS_ICON} />,
  NUMBER: <Hash className={CLS_ICON} />,
  LINK: <Link className={CLS_ICON}/>,
  IFRAME: <Link className={CLS_ICON} />,
  TYPE: <Type className={CLS_ICON} />
}