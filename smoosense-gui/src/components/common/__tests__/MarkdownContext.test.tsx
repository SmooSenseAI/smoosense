import { computeHeadings } from '../MarkdownContext'

describe('computeHeadings', () => {
  it('returns empty array for markdown with no headings', () => {
    expect(computeHeadings('Just some **text** here.')).toEqual([])
  })

  it('h1 headings have no section number', () => {
    const md = `# First\n# Second\n# Third`
    expect(computeHeadings(md).map(h => h.sectionNumber)).toEqual(['', '', ''])
  })

  it('h2 headings have single-segment section numbers', () => {
    const md = `# Intro\n## Background\n## Summary`
    expect(computeHeadings(md).map(h => h.sectionNumber)).toEqual(['', '1', '2'])
  })

  it('h3 headings have two-segment section numbers', () => {
    const md = `# Intro\n## Background\n### Details\n## Summary`
    expect(computeHeadings(md).map(h => h.sectionNumber)).toEqual(['', '1', '1.1', '2'])
  })

  it('resets sub-counters when parent heading repeats', () => {
    const md = `# One\n## A\n## B\n# Two\n## C`
    expect(computeHeadings(md).map(h => h.sectionNumber)).toEqual(['', '1', '2', '', '1'])
  })

  it('slugifies heading text for id', () => {
    const result = computeHeadings('# Hello World')
    expect(result[0].id).toBe('hello-world')
  })

  it('deduplicates slug ids for duplicate headings', () => {
    const result = computeHeadings('# Same\n# Same\n# Same')
    expect(result[0].id).toBe('same')
    expect(result[1].id).toBe('same-2')
    expect(result[2].id).toBe('same-3')
  })

  it('does not count headings inside fenced code blocks', () => {
    const md = `# Real\n\`\`\`\n# Fake\n\`\`\``
    const result = computeHeadings(md)
    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('Real')
  })

  it('ignores h4 and deeper headings', () => {
    const result = computeHeadings('# H1\n#### H4')
    expect(result).toHaveLength(1)
    expect(result[0].level).toBe(1)
  })

  it('exposes correct level and text on each entry', () => {
    const result = computeHeadings('# Title\n## Section')
    expect(result[0]).toMatchObject({ level: 1, text: 'Title' })
    expect(result[1]).toMatchObject({ level: 2, text: 'Section' })
  })
})
