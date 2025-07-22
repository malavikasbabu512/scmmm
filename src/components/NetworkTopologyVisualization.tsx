import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Network, 
  Route, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move,
  Eye,
  Settings,
  Info
} from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  isSelected: boolean;
  isDragging: boolean;
  capacity?: number;
  production?: number;
  district?: string;
}

interface NetworkRoute {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distance: number;
  cost: number;
  vehicleType: string;
  isActive: boolean;
  isHighlighted: boolean;
}

interface NetworkTopologyProps {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    capacity?: number;
    production?: number;
    district?: string;
  }>;
  routes: Array<{
    id: string;
    from_id: string;
    to_id: string;
    distance_km: number;
    cost_per_trip: number;
    vehicle_type: string;
  }>;
}

export function NetworkTopologyVisualization({ nodes: inputNodes, routes: inputRoutes }: NetworkTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [routes, setRoutes] = useState<NetworkRoute[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<NetworkRoute | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Node type configurations
  const nodeTypeConfig = {
    farm: { color: '#10B981', emoji: '🐄', size: 25 },
    collection_center: { color: '#3B82F6', emoji: '🏭', size: 30 },
    processing_plant: { color: '#8B5CF6', emoji: '⚙️', size: 35 },
    distributor: { color: '#F59E0B', emoji: '📦', size: 30 },
    retail: { color: '#EF4444', emoji: '🏪', size: 25 },
    default: { color: '#6B7280', emoji: '📍', size: 25 }
  };

  // Initialize network data
  useEffect(() => {
    if (inputNodes.length === 0) return;

    const canvasWidth = 800;
    const canvasHeight = 600;
    const padding = 50;

    // Convert geographic coordinates to canvas coordinates
    const latitudes = inputNodes.map(n => n.lat);
    const longitudes = inputNodes.map(n => n.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const networkNodes: NetworkNode[] = inputNodes.map(node => {
      const config = nodeTypeConfig[node.type as keyof typeof nodeTypeConfig] || nodeTypeConfig.default;
      
      // Normalize coordinates to canvas space
      const x = padding + ((node.lng - minLng) / (maxLng - minLng)) * (canvasWidth - 2 * padding);
      const y = padding + ((maxLat - node.lat) / (maxLat - minLat)) * (canvasHeight - 2 * padding);

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: isNaN(x) ? Math.random() * (canvasWidth - 2 * padding) + padding : x,
        y: isNaN(y) ? Math.random() * (canvasHeight - 2 * padding) + padding : y,
        radius: config.size,
        color: config.color,
        isSelected: false,
        isDragging: false,
        capacity: node.capacity,
        production: node.production,
        district: node.district
      };
    });

    const networkRoutes: NetworkRoute[] = inputRoutes.map(route => ({
      id: route.id,
      fromNodeId: route.from_id,
      toNodeId: route.to_id,
      distance: route.distance_km,
      cost: route.cost_per_trip,
      vehicleType: route.vehicle_type,
      isActive: true,
      isHighlighted: false
    }));

    setNodes(networkNodes);
    setRoutes(networkRoutes);
  }, [inputNodes, inputRoutes]);

  // Canvas drawing functions
  const drawNetwork = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid background
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw routes first (behind nodes)
    if (showRoutes) {
      routes.forEach(route => drawRoute(ctx, route));
    }

    // Draw nodes
    nodes.forEach(node => drawNode(ctx, node));

    // Draw node labels
    if (showLabels) {
      nodes.forEach(node => drawNodeLabel(ctx, node));
    }

    ctx.restore();
  }, [nodes, routes, zoom, pan, showLabels, showRoutes]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: NetworkNode) => {
    const config = nodeTypeConfig[node.type as keyof typeof nodeTypeConfig] || nodeTypeConfig.default;
    
    // Draw node shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.isSelected ? '#FFD700' : node.color;
    ctx.fill();
    
    // Draw node border
    ctx.strokeStyle = node.isSelected ? '#FF6B35' : '#ffffff';
    ctx.lineWidth = node.isSelected ? 3 : 2;
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Draw node emoji/icon
    ctx.font = `${node.radius * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(config.emoji, node.x, node.y);

    // Draw capacity indicator
    if (node.capacity) {
      const barWidth = node.radius * 1.5;
      const barHeight = 4;
      const utilization = node.production ? (node.production / node.capacity) * 100 : 50;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(node.x - barWidth/2, node.y + node.radius + 5, barWidth, barHeight);
      
      ctx.fillStyle = utilization > 80 ? '#EF4444' : utilization > 60 ? '#F59E0B' : '#10B981';
      ctx.fillRect(node.x - barWidth/2, node.y + node.radius + 5, (barWidth * utilization) / 100, barHeight);
    }
  };

  const drawNodeLabel = (ctx: CanvasRenderingContext2D, node: NetworkNode) => {
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Draw label background
    const labelY = node.y + node.radius + 15;
    const textWidth = ctx.measureText(node.name).width;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(node.x - textWidth/2 - 4, labelY - 2, textWidth + 8, 16);
    
    // Draw label border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(node.x - textWidth/2 - 4, labelY - 2, textWidth + 8, 16);
    
    // Draw label text
    ctx.fillStyle = '#333333';
    ctx.fillText(node.name, node.x, labelY);
  };

  const drawRoute = (ctx: CanvasRenderingContext2D, route: NetworkRoute) => {
    const fromNode = nodes.find(n => n.id === route.fromNodeId);
    const toNode = nodes.find(n => n.id === route.toNodeId);
    
    if (!fromNode || !toNode) return;

    // Calculate connection points on node edges
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const fromX = fromNode.x + (dx / distance) * fromNode.radius;
    const fromY = fromNode.y + (dy / distance) * fromNode.radius;
    const toX = toNode.x - (dx / distance) * toNode.radius;
    const toY = toNode.y - (dy / distance) * toNode.radius;

    // Draw route line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    
    ctx.strokeStyle = route.isHighlighted ? '#FF6B35' : '#94A3B8';
    ctx.lineWidth = route.isHighlighted ? 3 : 2;
    ctx.setLineDash(route.isActive ? [] : [5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow head
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle - arrowAngle),
      toY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle + arrowAngle),
      toY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();

    // Draw route label
    if (route.isHighlighted) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const label = `${route.distance.toFixed(1)}km`;
      const textWidth = ctx.measureText(label).width;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(midX - textWidth/2 - 2, midY - 6, textWidth + 4, 12);
      
      ctx.fillStyle = '#333333';
      ctx.fillText(label, midX, midY);
    }
  };

  // Mouse event handlers
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getMousePos(e);
    const clickedNode = nodes.find(node => {
      const dx = mousePos.x - node.x;
      const dy = mousePos.y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setIsDragging(true);
      setDragOffset({
        x: mousePos.x - clickedNode.x,
        y: mousePos.y - clickedNode.y
      });
      
      // Update node selection
      setNodes(prev => prev.map(node => ({
        ...node,
        isSelected: node.id === clickedNode.id
      })));
    } else {
      setSelectedNode(null);
      setNodes(prev => prev.map(node => ({ ...node, isSelected: false })));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedNode) return;

    const mousePos = getMousePos(e);
    const newX = mousePos.x - dragOffset.x;
    const newY = mousePos.y - dragOffset.y;

    setNodes(prev => prev.map(node => 
      node.id === selectedNode.id 
        ? { ...node, x: newX, y: newY }
        : node
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRouteHover = (routeId: string, isHovering: boolean) => {
    setRoutes(prev => prev.map(route => ({
      ...route,
      isHighlighted: route.id === routeId ? isHovering : false
    })));
  };

  const handleRouteSelect = (route: NetworkRoute) => {
    setSelectedRoute(route);
    handleRouteHover(route.id, true);
  };

  // Zoom and pan controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSelectedRoute(null);
    setNodes(prev => prev.map(node => ({ ...node, isSelected: false })));
    setRoutes(prev => prev.map(route => ({ ...route, isHighlighted: false })));
  };

  // Redraw canvas when data changes
  useEffect(() => {
    drawNetwork();
  }, [drawNetwork]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Topology Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Interactive network diagram showing dairy supply chain topology. Click and drag nodes to reposition them. 
              Hover over routes in the panel to highlight connections. Zoom and pan to explore the network in detail.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Canvas Area */}
            <div className="lg:col-span-3">
              <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                {/* Canvas Controls */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {/* View Controls */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <Button 
                    size="sm" 
                    variant={showLabels ? "default" : "outline"}
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    Labels
                  </Button>
                  <Button 
                    size="sm" 
                    variant={showRoutes ? "default" : "outline"}
                    onClick={() => setShowRoutes(!showRoutes)}
                  >
                    Routes
                  </Button>
                </div>

                {/* Canvas */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />

                {/* Zoom indicator */}
                <div className="absolute bottom-4 left-4 bg-white/90 px-2 py-1 rounded text-xs">
                  Zoom: {(zoom * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-4">
              {/* Selected Node Info */}
              {selectedNode && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Selected Node</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: selectedNode.color }}
                      />
                      <span className="font-medium">{selectedNode.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Type: {selectedNode.type.replace('_', ' ')}</p>
                      {selectedNode.district && <p>District: {selectedNode.district}</p>}
                      {selectedNode.capacity && (
                        <p>Capacity: {selectedNode.capacity.toLocaleString()}L</p>
                      )}
                      {selectedNode.production && (
                        <p>Production: {selectedNode.production.toLocaleString()}L/day</p>
                      )}
                      <p>Position: ({selectedNode.x.toFixed(0)}, {selectedNode.y.toFixed(0)})</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Routes Panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Network Routes ({routes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {routes.map((route) => {
                        const fromNode = nodes.find(n => n.id === route.fromNodeId);
                        const toNode = nodes.find(n => n.id === route.toNodeId);
                        
                        return (
                          <div
                            key={route.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              route.isHighlighted ? 'bg-orange-50 border-orange-200' : 'hover:bg-muted'
                            }`}
                            onMouseEnter={() => handleRouteHover(route.id, true)}
                            onMouseLeave={() => handleRouteHover(route.id, false)}
                            onClick={() => handleRouteSelect(route)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {fromNode?.name || 'Unknown'} → {toNode?.name || 'Unknown'}
                              </span>
                              <Badge variant={route.isActive ? "default" : "secondary"}>
                                {route.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Distance: {route.distance.toFixed(1)} km</p>
                              <p>Cost: ₹{route.cost.toFixed(0)}</p>
                              <p>Vehicle: {route.vehicleType}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Node Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(nodeTypeConfig).map(([type, config]) => (
                      <div key={type} className="flex items-center gap-2 text-sm">
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: config.color, color: 'white' }}
                        >
                          {config.emoji}
                        </div>
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Network Statistics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Network Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Nodes:</span>
                      <span className="font-medium">{nodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Routes:</span>
                      <span className="font-medium">{routes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Routes:</span>
                      <span className="font-medium">{routes.filter(r => r.isActive).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Distance:</span>
                      <span className="font-medium">
                        {routes.length > 0 ? (routes.reduce((sum, r) => sum + r.distance, 0) / routes.length).toFixed(1) : 0}km
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}