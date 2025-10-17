'use client'

import { useMemo } from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { ColDef } from 'ag-grid-community'
import { ResizablePanels } from '@/components/ui/resizable-panels'
import CustomMarkdown from '@/components/common/CustomMarkdown'
import IFrameCellRenderer from '@/lib/utils/cellRenderers/IFrameCellRenderer'

// Hard-coded data from COCO2017 object detection analysis
const EXAMPLE_DATA = [
  {
    "instance_id": 24848,
    "category_name": "sports ball",
    "iou": 0.7329047230166269,
    "gt_bbox": [
      345.87,
      312.3,
      17.03,
      16.3
    ],
    "pred_bbox": [
      348,
      313,
      17,
      16
    ],
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000177065.jpg",
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000177065.jpg&bboxes=%5B%7B%22bbox%22%3A%5B345.87%2C312.3%2C17.03%2C16.3%5D%2C%22label%22%3A%22gt+%7C+sports+ball%22%7D%2C%7B%22bbox%22%3A%5B348%2C313%2C17%2C16%5D%2C%22label%22%3A%22pred+%7C+sports+ball%22%7D%5D&autorange=true&name=bbox"
  },
  {
    "instance_id": 30947,
    "category_name": "person",
    "iou": 0.7470804861980023,
    "gt_bbox": [
      201.76,
      108.18,
      33.71,
      35.08
    ],
    "pred_bbox": [
      200,
      109,
      30,
      36
    ],
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000410650.jpg",
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000410650.jpg&bboxes=%5B%7B%22bbox%22%3A%5B201.76%2C108.18%2C33.71%2C35.08%5D%2C%22label%22%3A%22gt+%7C+person%22%7D%2C%7B%22bbox%22%3A%5B200%2C109%2C30%2C36%5D%2C%22label%22%3A%22pred+%7C+person%22%7D%5D&autorange=true&name=bbox"
  },
  {
    "instance_id": 33396,
    "category_name": "clock",
    "iou": 0.6398427083333329,
    "gt_bbox": [
      377.49,
      181.18,
      50.26,
      51.33
    ],
    "pred_bbox": [
      372,
      176,
      63,
      64
    ],
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000076211.jpg",
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000076211.jpg&bboxes=%5B%7B%22bbox%22%3A%5B377.49%2C181.18%2C50.26%2C51.33%5D%2C%22label%22%3A%22gt+%7C+clock%22%7D%2C%7B%22bbox%22%3A%5B372%2C176%2C63%2C64%5D%2C%22label%22%3A%22pred+%7C+clock%22%7D%5D&autorange=true&name=bbox"
  },
  {
    "instance_id": 9491,
    "category_name": "person",
    "iou": 0.6144271874999994,
    "gt_bbox": [
      363.31,
      270.1,
      21.63,
      27.27
    ],
    "pred_bbox": [
      358,
      268,
      32,
      30
    ],
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000439715.jpg",
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000439715.jpg&bboxes=%5B%7B%22bbox%22%3A%5B363.31%2C270.1%2C21.63%2C27.27%5D%2C%22label%22%3A%22gt+%7C+person%22%7D%2C%7B%22bbox%22%3A%5B358%2C268%2C32%2C30%5D%2C%22label%22%3A%22pred+%7C+person%22%7D%5D&autorange=true&name=bbox"
  },
  {
    "instance_id": 20705,
    "category_name": "car",
    "iou": 0.6525936919166095,
    "gt_bbox": [
      147.01,
      60.91,
      24.35,
      13.85
    ],
    "pred_bbox": [
      145,
      59,
      24,
      14
    ],
    "image_url": "https://demo.smoosense.ai/api/get-file?path=http%3A//images.cocodataset.org/val2017/000000119911.jpg",
    "bbox_viz": "https://cdn.smoosense.ai/viz-bbox.html?image=https%3A%2F%2Fdemo.smoosense.ai%2Fapi%2Fget-file%3Fpath%3Dhttp%253A%2F%2Fimages.cocodataset.org%2Fval2017%2F000000119911.jpg&bboxes=%5B%7B%22bbox%22%3A%5B147.01%2C60.91%2C24.35%2C13.85%5D%2C%22label%22%3A%22gt+%7C+car%22%7D%2C%7B%22bbox%22%3A%5B145%2C59%2C24%2C14%5D%2C%22label%22%3A%22pred+%7C+car%22%7D%5D&autorange=true&name=bbox"
  }
]

interface ExampleObjectDetectionProps {
  className?: string
}

const MARKDOWN_CONTENT = `# Object Detection Analysis

SmooSense helps evaluate object detection models by visually comparing their predicted bounding boxes against the ground truth. 
This provides an intuitive way to audit the model's accuracy and identify specific errors on a given dataset.

This example shows COCO dataset object detection results comparing ground truth bounding boxes with model predictions.

## Data Source

Data is excerpted from:
[COCO2017 Object Detection Dataset](http://cocodataset.org/)

---


`

export default function ExampleObjectDetection({ className }: ExampleObjectDetectionProps) {
  // Column definition overrides for better display
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    image_url: {
      headerName: 'Image',
      width: 150,
      pinned: 'left'
    },
    bbox_viz: {
      headerName: 'Bbox Visualization',
      width: 150,
      pinned: 'left',
      cellRenderer: IFrameCellRenderer
    },
    category_name: {
      headerName: 'Category',
      width: 120
    },
    iou: {
      headerName: 'IoU Score',
      width: 100,

    },
    gt_bbox: {
      width: 100,
      flex: 1
    },
    pred_bbox: {
      width: 100,
      flex: 1
    },
    instance_id: {
      width: 120
    }
  }), [])

  return (
    <div className={`h-full w-full ${className || ''}`}>
      <ResizablePanels
        direction="horizontal"
        defaultSizes={[55, 45]}
        minSize={30}
        maxSize={70}
      >
        <div className="h-full">
          <BasicAGTable
            data={EXAMPLE_DATA}
            colDefOverrides={colDefOverrides}
            gridOptionOverrides={{
              rowHeight: 100
            }}
          />
        </div>
        <div className="h-full p-6 bg-background border-l overflow-y-auto">
          <CustomMarkdown>{MARKDOWN_CONTENT}</CustomMarkdown>
        </div>
      </ResizablePanels>
    </div>
  )
}