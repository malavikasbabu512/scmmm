import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NetworkCanvasRenderer } from './NetworkCanvasRenderer';
import { NetworkVisualizationControls } from './NetworkVisualizationControls';
import { 
  Network, 
  Route, 
  Info,
  Target,
  Activity
} from 'lucide-react';

interface NetworkNode {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  capacity?: number;
  production?: number;
  district?: string;
}

interface NetworkRoute {
  id: string;
  from_id: string;
  to_id: string;
  distance_km: number;
  cost_per_trip: number;
  vehicle_type: string;
}

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
  distance: number;
  cost: number;
  vehicleType: string;
}

interface AdvancedNetworkTopologyProps {
  nodes: NetworkNode[];
  routes: NetworkRoute[];
}

export function AdvancedNetworkTopology({ nodes: inputNodes, routes: inputRoutes }: AdvancedNetworkTopologyProps) {
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [canvasRoutes, setCanvasRoutes] = useState<CanvasRoute[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const canvasWidth = 800;
  const canvasHeight = 600;

  // Node type configurations
  const nodeTypeConfig = {
    farm: { color: '#10B981', size: 25 },
    collection_center: { color: '#3B82F6', size: 30 },
    processing_plant: { color: '#8B5CF6', size: 35 },
    distributor: { color: '#F59E0B', size: 30 },
    retail: { color: '#EF4444', size: 25 },
    default: { color: '#6B7280', size: 25 }
  };

  // Initialize canvas data from input
  useEffect(() => {
    if (inputNodes.length === 0) return;

    const padding = 60;
    
    // Calculate coordinate bounds
    const latitudes = inputNodes.map(n => n.lat);
    const longitudes = inputNodes.map(n => n.lng);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Convert to canvas coordinates
    const newCanvasNodes: CanvasNode[] = inputNodes.map(node => {
      const config = nodeTypeConfig[node.type as keyof typeof nodeTypeConfig] || nodeTypeConfig.default;
      
      // Normalize geographic coordinates to canvas space
      let x, y;
      if (maxLng === minLng || maxLat === minLat) {
        // Handle edge case where all nodes have same coordinates
        x = canvasWidth / 2 + (Math.random() - 0.5) * 200;
        y = canvasHeight / 2 + (Math.random() - 0.5) * 200;
      } else {
        x = padding + ((node.lng - minLng) / (maxLng - minLng)) * (canvasWidth - 2 * padding);
        y = padding + ((maxLat - node.lat) / (maxLat - minLat)) * (canvasHeight - 2 * padding);
      }

      return {
        id: node.id,
        name: node.name,
        x: isNaN(x) ? Math.random() * (canvasWidth - 2 * padding) + padding : x,
        y: isNaN(y) ? Math.random() * (canvasHeight - 2 * padding) + padding : y,
        radius: config.size,
        color: config.color,
        type: node.type,
        isSelected: false,
        isHovered: false
      };
    });

    // Create canvas routes
    const newCanvasRoutes: CanvasRoute[] = inputRoutes.map(route => {
      const fromNode = newCanvasNodes.find(n => n.id === route.from_id);
      const toNode = newCanvasNodes.find(n => n.id === route.to_id);
      
      if (!fromNode || !toNode) {
        return null;
      }

      // Calculate connection points on node edges
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const fromX = fromNode.x + (dx / distance) * fromNode.radius;
      const fromY = fromNode.y + (dy / distance) * fromNode.radius;
      const toX = toNode.x - (dx / distance) * toNode.radius;
      const toY = toNode.y - (dy / distance) * toNode.radius;

      return {
        id: route.id,
        fromX,
        fromY,
        toX,
        toY,
        isHighlighted: false,
        color: '#94A3B8',
        width: 2,
        distance: route.distance_km,
        cost: route.cost_per_trip,
        vehicleType: route.vehicle_type
      };
    }).filter(Boolean) as CanvasRoute[];

    setCanvasNodes(newCanvasNodes);
    setCanvasRoutes(newCanvasRoutes);
  }, [inputNodes, inputRoutes]);

  // Update node selection state
  useEffect(() => {
    setCanvasNodes(prev => prev.map(node => ({
      ...node,
      isSelected: node.id === selectedNodeId,
      isHovered: node.id === hoveredNodeId
    })));
  }, [selectedNodeId, hoveredNodeId]);

  // Update route highlight state
  useEffect(() => {
    setCanvasRoutes(prev => prev.map(route => ({
      ...route,
      isHighlighted: route.id === selectedRouteId
    })));
  }, [selectedRouteId]);

  // Event handlers
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
    setSelectedRouteId(null);
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  };

  const handleCanvasClick = (x: number, y: number) => {
    setSelectedNodeId(null);
    setSelectedRouteId(null);
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(prev => prev === routeId ? null : routeId);
    setSelectedNodeId(null);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodeId(null);
    setSelectedRouteId(null);
    setHoveredNodeId(null);
  };

  // Get selected node and route data
  const selectedNode = canvasNodes.find(n => n.id === selectedNodeId);
  const selectedRoute = canvasRoutes.find(r => r.id === selectedRouteId);
  const inputSelectedNode = inputNodes.find(n => n.id === selectedNodeId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Advanced Network Topology Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Interactive network topology with advanced canvas rendering. Click nodes to select them, 
              hover for details, and use controls to zoom and pan. Routes are automatically calculated 
              based on geographic positions and displayed with proper connection points.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Canvas Area */}
            <div className="lg:col-span-3">
              <div className="relative">
                <NetworkCanvasRenderer
                  width={canvasWidth}
                  height={canvasHeight}
                  nodes={canvasNodes}
                  routes={showRoutes ? canvasRoutes : []}
                  zoom={zoom}
                  pan={pan}
                  showLabels={showLabels}
                  showGrid={showGrid}
                  onNodeClick={handleNodeClick}
                  onNodeHover={handleNodeHover}
                  onCanvasClick={handleCanvasClick}
                />
              </div>
            </div>

            {/* Controls and Information Panel */}
            <div className="space-y-4">
              {/* Visualization Controls */}
              <NetworkVisualizationControls
                zoom={zoom}
                onZoomChange={setZoom}
                showLabels={showLabels}
                onShowLabelsChange={setShowLabels}
                showGrid={showGrid}
                onShowGridChange={setShowGrid}
                showRoutes={showRoutes}
                onShowRoutesChange={setShowRoutes}
                onReset={handleReset}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                nodeCount={canvasNodes.length}
                routeCount={canvasRoutes.length}
                selectedNodeId={selectedNodeId}
                selectedRouteId={selectedRouteId}
              />

              {/* Selected Node Information */}
              {selectedNode && inputSelectedNode && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Selected Node
                    </CardTitle>
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
                      <p><strong>Type:</strong> {selectedNode.type.replace('_', ' ')}</p>
                      {inputSelectedNode.district && (
                        <p><strong>District:</strong> {inputSelectedNode.district}</p>
                      )}
                      {inputSelectedNode.capacity && (
                        <p><strong>Capacity:</strong> {inputSelectedNode.capacity.toLocaleString()}L</p>
                      )}
                      {inputSelectedNode.production && (
                        <p><strong>Production:</strong> {inputSelectedNode.production.toLocaleString()}L/day</p>
                      )}
                      <p><strong>Position:</strong> ({selectedNode.x.toFixed(0)}, {selectedNode.y.toFixed(0)})</p>
                      <p><strong>Coordinates:</strong> {inputSelectedNode.lat.toFixed(4)}, {inputSelectedNode.lng.toFixed(4)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Routes Panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Network Routes ({canvasRoutes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {canvasRoutes.map((route) => {
                        const fromNode = inputNodes.find(n => n.id === inputRoutes.find(r => r.id === route.id)?.from_id);
                        const toNode = inputNodes.find(n => n.id === inputRoutes.find(r => r.id === route.id)?.to_id);
                        
                        return (
                          <div
                            key={route.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              route.isHighlighted ? 'bg-orange-50 border-orange-200' : 'hover:bg-muted'
                            }`}
                            onClick={() => handleRouteSelect(route.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {fromNode?.name || 'Unknown'} → {toNode?.name || 'Unknown'}
                              </span>
                              <Badge variant={route.isHighlighted ? "default" : "secondary"}>
                                {route.distance.toFixed(1)}km
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Cost: ₹{route.cost.toFixed(0)}</p>
                              <p>Vehicle: {route.vehicleType}</p>
                            </div>
                          </div>
                        );
                      })}
                      
                      {canvasRoutes.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No routes available</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Network Performance Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Network Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Nodes:</span>
                      <span className="font-medium">{canvasNodes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Routes:</span>
                      <span className="font-medium">{canvasRoutes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Distance:</span>
                      <span className="font-medium">
                        {canvasRoutes.length > 0 
                          ? (canvasRoutes.reduce((sum, r) => sum + r.distance, 0) / canvasRoutes.length).toFixed(1)
                          : 0
                        }km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-medium">
                        ₹{canvasRoutes.reduce((sum, r) => sum + r.cost, 0).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Density:</span>
                      <span className="font-medium">
                        {canvasNodes.length > 0 
                          ? (canvasRoutes.length / canvasNodes.length).toFixed(2)
                          : 0
                        }
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