'use client'

import { useMemo } from 'react'
import BasicAGTable from '@/components/common/BasicAGTable'
import { ColDef } from 'ag-grid-community'
import IFrameCellRenderer from '@/lib/utils/cellRenderers/IFrameCellRenderer'

const EXAMPLE_DATA = [
  {
    action: 'Dance',
    g1: 'https://viz-robot-cdn.smoosense.ai/single.html?modelName=unitree_g1&dataUrl=https://viz-robot-cdn.smoosense.ai/unitree_g1/example.json',
    h1: 'https://viz-robot-cdn.smoosense.ai/single.html?modelName=unitree_h1_2&dataUrl=https://viz-robot-cdn.smoosense.ai/unitree_h1_2/example.json'
  }
]

export function RoboticsMotionVisual() {
  const colDefOverrides = useMemo((): Record<string, Partial<ColDef>> => ({
    action: {
      headerName: 'Action',
      width: 70,
      pinned: 'left'
    },
    g1: {
      headerName: 'Unitree G1',
      flex: 1,
      cellRenderer: IFrameCellRenderer
    },
    h1: {
      headerName: 'Unitree H1',
      flex: 1,
      cellRenderer: IFrameCellRenderer
    }
  }), [])

  return (
    <div className="w-full h-full">
      <BasicAGTable
        data={EXAMPLE_DATA}
        colDefOverrides={colDefOverrides}
        gridOptionOverrides={{
          rowHeight: 125,
          headerHeight: 30
        }}
      />
    </div>
  )
}

export function RoboticsMotionDescription() {
  return (
    <div className="text-sm">
      <p>Visualize robotic motion trajectories and joint configurations with interactive 3D playback.</p>
    </div>
  )
}
