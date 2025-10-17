// Mock for @noble/hashes/sha2 to handle ES module issues in Jest

const mockSha512 = jest.fn(() => {
  // Return a mock 64-byte hash
  return new Uint8Array(64).fill(42)
})

module.exports = {
  sha512: mockSha512
}