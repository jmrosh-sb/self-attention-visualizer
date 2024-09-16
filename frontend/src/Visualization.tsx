// Visualization.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { MathJax } from 'better-react-mathjax';
import './Visualization.css';

interface VisualizationProps {
  tokens: string[];
  attention: number[][];
}

const Visualization: React.FC<VisualizationProps> = ({ tokens, attention }) => {
  const [hoveredTokenIndex, setHoveredTokenIndex] = useState<number | null>(null);
  const [clickedTokenIndex, setClickedTokenIndex] = useState<number | null>(null);
  const [tokenPositions, setTokenPositions] = useState<{ x: number; y: number }[]>([]);

  const tokenRefs = useRef<Array<HTMLDivElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Get the container's bounding rectangle
    const containerRect = containerRef.current.getBoundingClientRect();

    // After the component mounts and tokens are rendered, get their positions
    const positions = tokenRefs.current.map((ref) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const x = rect.left + rect.width / 2 - containerRect.left;
        const y = rect.top + rect.height / 2 - containerRect.top;
        return { x, y };
      }
      return { x: 0, y: 0 };
    });
    setTokenPositions(positions);
  }, [tokens]);

  const handleMouseEnter = (index: number) => {
    setHoveredTokenIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredTokenIndex(null);
  };

  const handleClick = (index: number) => {
    setClickedTokenIndex(index);
  };

  return (
    <Box
      ref={containerRef}
      sx={{ position: 'relative', padding: '20px', overflow: 'visible' }}
    >
      {/* Token Display */}
      <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        {tokens.map((token, index) => (
          <Box
            key={index}
            ref={(el: HTMLDivElement | null) => {
              tokenRefs.current[index] = el;
            }}
            component="div"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
            sx={{
              margin: '0 10px',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Typography variant="body1">{token}</Typography>
          </Box>
        ))}
      </Box>

      {/* Attention Edges */}
      {hoveredTokenIndex !== null && tokenPositions.length === tokens.length && (
        <svg
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {tokens.map((_, targetIndex) => {
            if (targetIndex === hoveredTokenIndex) return null;

            const attentionScore = attention[hoveredTokenIndex][targetIndex];
            if (attentionScore <= 0) return null;

            const thickness = attentionScore * 5; // Adjust multiplier for visual effect
            const color = `rgba(0, 0, 255, ${attentionScore})`; // Color intensity based on attention

            // Get positions
            const sourcePos = tokenPositions[hoveredTokenIndex];
            const targetPos = tokenPositions[targetIndex];

            // Control points for the Bezier curve
            const controlPointX = (sourcePos.x + targetPos.x) / 2;
            const controlPointY =
              sourcePos.y - Math.abs(targetIndex - hoveredTokenIndex) * 50; // Adjust for curvature

            return (
              <path
                key={targetIndex}
                d={`M ${sourcePos.x},${sourcePos.y} Q ${controlPointX},${controlPointY} ${targetPos.x},${targetPos.y}`}
                stroke={color}
                strokeWidth={thickness}
                fill="none"
              />
            );
          })}
        </svg>
      )}

      {/* Attention Scores in LaTeX */}
      {clickedTokenIndex !== null && (
        <Box sx={{ marginTop: '20px' }}>
          <Typography variant="h6">
            Attention Scores for "{tokens[clickedTokenIndex]}":
          </Typography>
          <MathJax>
            {'\\[' + generateAttentionLatex(tokens, attention[clickedTokenIndex]) + '\\]'}
          </MathJax>
        </Box>
      )}
    </Box>
  );
};

export default Visualization;

/**
 * Helper function to generate LaTeX code for attention scores.
 */
function generateAttentionLatex(tokens: string[], scores: number[]) {
  let latex = '\\begin{array}{l l}\n';
  tokens.forEach((token, index) => {
    latex += `${escapeLatex(token)} & ${scores[index].toFixed(2)} \\\\\n`;
  });
  latex += '\\end{array}';
  return latex;
}

/**
 * Helper function to escape LaTeX special characters in tokens.
 */
function escapeLatex(str: string) {
  return str.replace(/([#%&~_^\\{}$])/g, '\\$1');
}

