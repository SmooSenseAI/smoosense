export interface Demo {
  url: string
  description: string
  video: string
  categories: string[]
}

export const demos: Demo[] = [
  {
    url: 'https://demo.smoosense.ai/Table?tablePath=s3%3A%2F%2Fsmoosense-demo%2Fdatasets%2FCOCO2017%2Fbbox.parquet',
    description: 'Explore COCO object detection dataset with bounding boxes',
    video: '/videos/demos/explore-bbox.mp4',
    categories: ['bbox', 'image', 'dataset'],
  },
  {
    url: 'https://demo.smoosense.ai/Table?tablePath=s3://smoosense-demo/datasets/COCO2017/images-emb-2d.parquet&activeTab=Plot&activePlotTab=BalanceMap&columnForGalleryVisual=coco_url&columnForGalleryCaption=fold&bubblePlotXColumn=emb_x&bubblePlotYColumn=emb_y&bubblePlotBreakdownColumn=fold',
    description:
      'Using embedding to check balance between training/testing/validation.',
    video: '/videos/demos/emb-balance.mp4',
    categories: ['embedding'],
  },
  {
    url: 'https://demo.smoosense.ai/Table?tablePath=s3%3A%2F%2Fsmoosense-demo%2Fdatasets%2FRapidata%2Fcompare-video-generation.parquet',
    description:
      'Compare two video generation models side by side, with full feature of tabular slice-n-dice.',
    video: '/videos/demos/video-cmp.mp4',
    categories: ['video', 'dataset'],
  },
  {
    url: 'https://demo.smoosense.ai/example/text2image',
    description:
      'Use ImageMask and WordScore to visualize misalignment between text and image.',
    video: '/videos/demos/text-image-alignment.mp4',
    categories: ['text', 'image'],
  },
  {
    url: '/blogs/jupyter-notebook',
    description: 'Visual and interactive table in Jupyter Notebook',
    video: '/videos/demos/jupyter-multimodal.mp4',
    categories: ['introduction'],
  },
  {
    url: 'https://demo.smoosense.ai/Table?tablePath=s3://smoosense-demo/datasets/PHUMA.parquet',
    description:
      'Explore and visualization of robotics dataset. PHUMA: Physically-Grounded Humanoid Locomotion Dataset',
    video: '/videos/demos/g1-robot.mp4',
    categories: ['robotics', 'dataset'],
  },
]
