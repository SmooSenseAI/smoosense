'use client'

import BasicAGTable from '@/components/common/BasicAGTable'
import LiteTableTopBar from '@/components/layout/LiteTableTopBar'

// Dummy data with various column types for testing
const dummyData = [
  {
    id: 7,
    video: 'https://cdn.smoosense.ai/datasets/image-to-video-human-preference-hailuo-02-marey/Videos/marey/marey_0053.mp4',
    image_url: 'https://cdn.smoosense.ai/000000130579.jpg',
    date: '2020-08-05',
    bbox: [176,187,64,57],
    json: {
      "Product Name": "Bowler Hat",
      "ProductID": 858383,
      "SKU": "0406654608",
      "Description": {
        "Colour": "Purple",
        "Width": 300,
        "Height": 200,
        "Depth": 210,
        "Weight": 0.75
      },
      "Price": 34.45,
      "Quantity": 2
    },
    word_scores: `[["a", 0], ["harp", 0.477], ["without", 3.1413], ["strings,", 0.97], ["in", 0.4793], ["an", 0.4793], ["anime", 0], ["style,", 0], ["with", 0], ["intricate", 1.5925], ["details", 0], ["and", 0], ["flowing", 0], ["lines,", 0], ["set", 0], ["against", 0], ["a", 0], ["dreamy,", 0.6508], ["pastel", 0], ["background,", 0.3946], ["bathed", 0], ["in", 0], ["soft", 0], ["golden", 0.6118], ["hour", 0], ["light,", 0.4012], ["with", 0], ["a", 0], ["serene", 0], ["mood", 0], ["and", 0], ["rich", 0], ["textures,", 0], ["high", 0], ["resolution,", 2.2098], ["photorealistic", 0]]`,
    pdf: 'https://cdn.smoosense.ai/demo/MITLicense.pdf',
    text: `3. How important is the “long tail” of CV use cases?
\t•\tThe long tail is wide: OCR, pose estimation, depth maps, point clouds, masks, action recognition, etc.
\t•\tBut each tail case is niche — only a slice of customers need pose keypoints or LiDAR overlays.

For product design:
\t•\tSupport generic plug-in hooks (users can register custom visualizers for new column types).
\t•\tShip the 3–4 common visualizations out of the box (bbox, mask overlay, keypoints, embeddings scatter).
\t•\tThis gives 80% of users what they need and lets specialists extend for the rest.`
  },
]

export default function LiteTablePage() {
  const rowCount = dummyData.length
  const columnCount = dummyData.length > 0 ? Object.keys(dummyData[0]).length : 0

  return (
    <div className="h-screen w-full flex flex-col">
      <LiteTableTopBar rowCount={rowCount} columnCount={columnCount} />
      <div className="flex-1">
        <BasicAGTable
          data={dummyData}
        />
      </div>
    </div>
  )
}
