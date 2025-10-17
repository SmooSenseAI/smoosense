import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FileShortcutProps {
  filePath: string
  description: string
}

export default function FileShortcut({ filePath, description }: FileShortcutProps) {
  const pathBasename = filePath.split('/').pop() || filePath

  const handleClick = () => {
    const url = `./Table?filePath=${encodeURIComponent(filePath)}`
    window.open(url, '_blank')
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-border mb-3"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-foreground mb-1">
              {pathBasename}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  )
}