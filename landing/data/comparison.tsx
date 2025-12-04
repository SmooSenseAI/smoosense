export const comparison = {
  title: "When you should choose SmooSense?",
  subtitle: "See how we compare to other data analysis solutions",
  tableau: {
    common: [
      "Interactive analysis.",
      "GUI optimized for non-technical users.",
      "Generic software for multiple domains."
    ],
    items: [
      {
        feature: "Data Types",
        smoosense: "Multimodal native",
        smoosenseNote: [
          "Built-in visuals.",
          "AI context focused."
        ],
        competitor: "Numerical data focus",
        competitorNote: ["Primarily numerical data", "Business context focused"]
      },
      {
        feature: "Coder friendly",
        smoosense: "Open source SDK",
        smoosenseNote: ["Easy to integrate with your code", "Customizable and extensible"],
        competitor: "Primarily manual operations",
        competitorNote: ["Limited integration with code workflows (e.g., Python)."]
      },
      {
        feature: "Customization",
        smoosense: "Flexible",
        smoosenseNote: [
          "Source code available.",
          "Supports customized visualizer via iframe."
        ],
        competitor: "Less focused",
        competitorNote: ["Limited customization options."]
      },

    ]
  },
  voxel51: {
    common: [
      "Both support visualization and analysis in Computer Vision.",
    ],
    items: [
      {
        feature: "Data Types",
        smoosense: "Broader multimodal",
        smoosenseNote: [
          "Built-in visualization for common multimodal use cases.",
          "Customized visualizer via iframe."
        ],
        competitor: "Vision-focused",
        competitorNote: [
          "Optimized for CV, limited extensibility outside vision."
        ],
      },
      {
        feature: "Target users",
        smoosense: "Technical and non-technical",
        smoosenseNote: [
          "No-code solution. GUI-first.",
          "Minimal learning needed."
        ],
        competitor: "Engineers",
        competitorNote: [
          "Code-first solution.",
          "Need Python skills."
        ]
      },
      {
        feature: "Analysis approach",
        smoosense: "Table-first",
        smoosenseNote: [
          "More attention on metadata columns and distributions.",
        ],
        competitor: "Image-first",
        competitorNote: ["More focus on visual content.", "Built-in semantic analysis"]
      },
      {
        feature: "Usage",
        smoosense: "Flexible, horizontal tool",
        smoosenseNote: [
          "Gives a transparent view of table.",
          "Plug-and-play for parquet, lance, pandas, daft, jupyter etc.",
          "You define your metrics, ETLs, and processes.",

        ],
        competitor: "Opinionated e2e solution",
        competitorNote: [
          "Requires data ingestion.",
          "Provides predefined automated workflows.",
          "Less plug-and-play.",
        ]
      }
    ]
  }
}