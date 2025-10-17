'use client'

interface PreviewNotImplementedProps {
  title?: string
  message?: string
  details?: string
}

export default function PreviewNotImplemented({ 
  title = "Not Implemented Yet", 
  message = "Preview for this file format is not implemented yet.",
  details 
}: PreviewNotImplementedProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">{title}</h4>
          <p className="text-sm text-yellow-600">{message}</p>
        </div>
        {details && (
          <div className="text-sm text-muted-foreground">
            <p>{details}</p>
          </div>
        )}
      </div>
    </div>
  )
}