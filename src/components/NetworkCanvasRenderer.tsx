import React, { useRef, useEffect, useCallback } from 'react';

interface CanvasNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  type: string;
  isSelected: boolean;
  isHovered: boolean;
}

interface CanvasRoute {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isHighlighted: boolean;
  color: string;
  width: number;
}

interface NetworkCanvasRendererProps {
  width: number;
  height: number;
  nodes: CanvasNode[];
  routes: CanvasRoute[];
  zoom: number;
  pan: { x: number; y: number };
  showLabels: boolean;
  showGrid: boolean;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onCanvasClick?: (x: number, y: number) => void;
}

export function NetworkCanvasRenderer({
  width,
  height,
  nodes,
  routes,
  zoom,
  pan,
  showLabels,
  showGrid,
  onNodeClick,
  onNodeHover,
  onCanvasClick
}: NetworkCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Main drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, width, height);
    }

    // Draw routes (behind nodes)
    routes.forEach(route => drawRoute(ctx, route));

    // Draw nodes
    nodes.forEach(node => drawNode(ctx, node));

    // Draw labels if enabled
    if (showLabels) {
      nodes.forEach(node => drawNodeLabel(ctx, node));
    }

    ctx.restore();
  }, [width, height, nodes, routes, zoom, pan, showLabels, showGrid]);

  // Grid drawing function
  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    // Vertical lines
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  // Node drawing function with enhanced visuals
  const drawNode = (ctx: CanvasRenderingContext2D, node: CanvasNode) => {
    // Draw shadow
    if (node.isSelected || node.isHovered) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
    }

    // Draw main circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
    
    // Fill with gradient for better visual appeal
    const gradient = ctx.createRadialGradient(
      node.x - node.radius * 0.3, 
      node.y - node.radius * 0.3, 
      0,
      node.x, 
      node.y, 
      node.radius
    );
    gradient.addColorStop(0, lightenColor(node.color, 20));
    gradient.addColorStop(1, node.color);
    
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw border
    ctx.strokeStyle = node.isSelected ? '#FFD700' : '#ffffff';
    ctx.lineWidth = node.isSelected ? 4 : 2;
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Draw type indicator (emoji or icon)
    const typeEmojis = {
      farm: '🐄',
      collection_center: '🏭',
      processing_plant: '⚙️',
      distributor: '📦',
      retail: '🏪'
    };

    ctx.font = `${node.radius * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      typeEmojis[node.type as keyof typeof typeEmojis] || '📍', 
      node.x, 
      node.y
    );

    // Draw selection ring
    if (node.isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 8, 0, 2 * Math.PI);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw hover effect
    if (node.isHovered && !node.isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  // Route drawing function with enhanced visuals
  const drawRoute = (ctx: CanvasRenderingContext2D, route: CanvasRoute) => {
    // Draw route line with gradient
    const gradient = ctx.createLinearGradient(route.fromX, route.fromY, route.toX, route.toY);
    gradient.addColorStop(0, route.color);
    gradient.addColorStop(0.5, lightenColor(route.color, 30));
    gradient.addColorStop(1, route.color);

    ctx.beginPath();
    ctx.moveTo(route.fromX, route.fromY);
    ctx.lineTo(route.toX, route.toY);
    
    ctx.strokeStyle = route.isHighlighted ? '#FF6B35' : gradient;
    ctx.lineWidth = route.isHighlighted ? route.width + 2 : route.width;
    ctx.globalAlpha = route.isHighlighted ? 1 : 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Draw arrow head
    if (route.isHighlighted) {
      drawArrowHead(ctx, route.fromX, route.fromY, route.toX, route.toY, '#FF6B35');
    }
  };

  // Arrow head drawing function
  const drawArrowHead = (
    ctx: CanvasRenderingContext2D, 
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number, 
    color: string
  ) => {
    const headLength = 15;
    const headAngle = Math.PI / 6;
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - headAngle),
      toY - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + headAngle),
      toY - headLength * Math.sin(angle + headAngle)
    );
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  // Label drawing function
  const drawNodeLabel = (ctx: CanvasRenderingContext2D, node: CanvasNode) => {
    const labelY = node.y + node.radius + 20;
    
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Measure text for background
    const textMetrics = ctx.measureText(node.name);
    const textWidth = textMetrics.width;
    const textHeight = 14;
    
    // Draw label background with rounded corners
    const padding = 4;
    const bgX = node.x - textWidth/2 - padding;
    const bgY = labelY - 2;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + 2;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(bgX, bgY, bgWidth, bgHeight);
    
    // Draw text
    ctx.fillStyle = '#333333';
    ctx.fillText(node.name, node.x, labelY);
  };

  // Utility function to lighten colors
  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Mouse event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check for node hover
    const hoveredNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (onNodeHover) {
      onNodeHover(hoveredNode ? hoveredNode.id : null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Check for node click
    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (clickedNode && onNodeClick) {
      onNodeClick(clickedNode.id);
    } else if (onCanvasClick) {
      onCanvasClick(x, y);
    }
  };

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border rounded cursor-pointer"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
    />
  );
}