'use client'

interface PreviewNotFoundProps {
  title?: string
  message?: string
}

export default function PreviewNotFound({ 
  title = "File not found", 
  message = "The file could not be found or accessed." 
}: PreviewNotFoundProps) {
  return (
    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
      <h4 className="text-sm font-medium text-yellow-800 mb-1">{title}</h4>
      <p className="text-sm text-yellow-600">{message}</p>
    </div>
  )
}