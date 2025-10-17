// Shared CustomizedContent for TreeMap components
export const TreeMapCustomizedContent = (props: { 
  root?: { children?: unknown[] }; 
  depth?: number; 
  x?: number; 
  y?: number; 
  width?: number; 
  height?: number; 
  index?: number; 
  colors?: string[];
  name?: string;
  isActive?: boolean;
}) => {
  const { depth, x, y, width, height, name } = props;

  // Function to truncate text to fit within the rectangle width
  const getTruncatedText = (text: string, availableWidth: number) => {
    if (!text) return '';
    
    // Estimate character width (rough approximation for most fonts)
    const avgCharWidth = 7; // pixels per character for text-sm
    const padding = 8; // leave some padding on both sides
    const maxChars = Math.floor((availableWidth - padding) / avgCharWidth);
    
    if (text.length <= maxChars) {
      return text;
    }
    
    // Truncate and add ellipsis, but ensure we have at least 1 character + ellipsis
    const truncateLength = Math.max(1, maxChars - 1);
    return text.substring(0, truncateLength) + '…';
  };

  const currentWidth = width || 0;
  const currentHeight = height || 0;
  const displayText = getTruncatedText(String(name) || '', currentWidth);
  const textColor = "var(--foreground)"

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          stroke: 'var(--background)',
          strokeWidth: 1,
          strokeOpacity: 1,
          cursor: 'pointer',
        }}
      />
      {depth === 1 && currentWidth > 30 && currentHeight > 16 ? (
        <text
          x={(x || 0) + currentWidth / 2}
          y={(y || 0) + currentHeight / 2 + 4}
          textAnchor="middle"
          fill={textColor}
          stroke={textColor}
          strokeWidth={1}
          className="text-sm font-thin cursor-pointer"
        >
          {displayText}
        </text>
      ) : null}
    </g>
  );
};