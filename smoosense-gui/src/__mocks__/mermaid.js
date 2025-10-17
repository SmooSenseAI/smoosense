// Mock implementation of mermaid for Jest tests
const mermaid = {
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg></svg>' }),
}

export default mermaid