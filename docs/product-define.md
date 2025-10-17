# Product define

Headline candidates: 

1. AI dataset analysis
2. Tableau for visual AI data
3. GUI for SQL

## What data to support:
- Tabular data, not unstructured data.
- Multi-modal data, where simply displaying raw data makes no sense to humans
- AI/ML datasets and evaluation results. Not finance, geographical or timeseries.

## Comparison with other related products
## Compare with Tableau:
- Common: easy, interactive, intuitive
- Differences:
  - Use case: Tableau focuses on business dashboards, SmooSense on research/ML.
  - SmooSense understands data and predicts user intention, and then adjusts GUI accordingly.
  - SmooSense supports multi-modal data natively: image/video/plots
  - SmooSense is optimized to handle large-scale data efficiently.
  - SmooSense source code is available for customization (with license fee).

### Compare with Voxel51:
- Common: supports exploring image datasets
- Differences:
  - SmooSense is no-code mode, prioritizing GUI user experience on the common analysis. Voxel51’s approach is low-code, with higher learning cost and more flexible features. 
  - SmooSense is designed to be pluggable, directly work with files, while datasets need to be ingested into Voxel51. 
  - SmooSense's main view is table and can be used on generic table, while Voxel51's main focus is images/videos.

### Compare with 3lc
- Common: support CV analysis
- Differences:
  - SmooSense is no-code while 3lc is low-code.


### Compare with AI Insights Report:
- Common: low-effort to start
- Differences:
  - Use Case: SmooSense is designed for ad-hoc exploratory analysis, where users have many multi-threaded small followup questions. AI Insights Report focuses on getting well-explained answers to big questions. 
  - SmooSense optimizes for low-friction interactive analysis, while AI Insights Report are often asynchronous and one-shot.
  - SmooSense responses are easy to tweak with the interactive GUI, while fine-controling AI is much harder.

### Compare with Jupyter notebook:
- Common: flexible
- Differences:
  - SmooSense is very low effort to get started. Zero setup. No code.
  - SmooSense provides better UX for non-technical users. 
  - SmooSense supports easier collaboration.
  - SmooSense only serves common use cases, while users can write any code in a Jupyter notebook. SmooSense does support plugins with iframe visualization. 

### Compare with ChatGPT (upload file, ask question and get answer):
- Common: low-effort
- Differences:
  - SmooSense is faster and scalable, while ChatGPT has limit on file size.
  - SmooSense can automatically add efficient context to the prompt.
  - ChatGPT responds in English, while SmooSense responds with intuitive visual UI.
  - Big difference in followup analysis: SmooSense uses tailored GUI interactions, while ChatGPT users need to write prompts with more context and details.
  - SmooSense minimizes hallucination by restricting LLM response to pre-defined UI operations.


### Compare with Weights & Biases:
  - Common: ML/AI focus
  - Differences:
    - SmooSense supports generic data exploration, while W&B focuses on experiment management

