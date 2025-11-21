'use client'

import { useMemo } from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { ColDef } from 'ag-grid-community'
import IFrameCellRenderer from '@/lib/utils/cellRenderers/IFrameCellRenderer'

// Hard-coded data from COCO2017 object detection analysis
const EXAMPLE_DATA = [
  {
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000177065.jpg",
    "category_name": "sports ball",
    "iou": 0.733,
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000177065.jpg&bboxes=%5B%7B%22bbox%22%3A%5B345.87%2C312.3%2C17.03%2C16.3%5D%2C%22label%22%3A%22gt+%7C+sports+ball%22%7D%2C%7B%22bbox%22%3A%5B348%2C313%2C17%2C16%5D%2C%22label%22%3A%22pred+%7C+sports+ball%22%7D%5D&autorange=true&name=bbox"
  },
  {
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000410650.jpg",
    "category_name": "person",
    "iou": 0.747,
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000410650.jpg&bboxes=%5B%7B%22bbox%22%3A%5B201.76%2C108.18%2C33.71%2C35.08%5D%2C%22label%22%3A%22gt+%7C+person%22%7D%2C%7B%22bbox%22%3A%5B200%2C109%2C30%2C36%5D%2C%22label%22%3A%22pred+%7C+person%22%7D%5D&autorange=true&name=bbox"
  },
  {
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000076211.jpg",
    "category_name": "clock",
    "iou": 0.640,
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000076211.jpg&bboxes=%5B%7B%22bbox%22%3A%5B377.49%2C181.18%2C50.26%2C51.33%5D%2C%22label%22%3A%22gt+%7C+clock%22%7D%2C%7B%22bbox%22%3A%5B372%2C176%2C63%2C64%5D%2C%22label%22%3A%22pred+%7C+clock%22%7D%5D&autorange=true&name=bbox"
  }
]

export function BoundingBoxVisual() {
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    image_url: {
      headerName: 'Image',
      width: 150,
      pinned: 'left'
    },
    bbox_viz: {
      headerName: 'Bbox',
      width: 100,
      flex: 1,
      pinned: 'left',
      cellRenderer: IFrameCellRenderer
    },
    category_name: {
      headerName: 'Category',
      width: 100,
      flex: 1
    },
    iou: {
      headerName: 'IoU',
      width: 100,
      flex: 1
    }
  }), [])

  return (
    <div className="w-full h-full">
      <BasicAGTable
        data={EXAMPLE_DATA}
        colDefOverrides={colDefOverrides}
        gridOptionOverrides={{
          rowHeight: 100
        }}
      />
    </div>
  )
}

export function BoundingBoxDescription() {
  return (
    <div className="text-sm">
      <p>Compare object detection predictions with ground truth bounding boxes and IoU scores.</p>
    </div>
  )
}
