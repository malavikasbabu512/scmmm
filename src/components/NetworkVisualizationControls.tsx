import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Settings, 
  Eye, 
  EyeOff,
  Grid3X3,
  Tag,
  Palette
} from 'lucide-react';

interface NetworkVisualizationControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  showRoutes: boolean;
  onShowRoutesChange: (show: boolean) => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  nodeCount: number;
  routeCount: number;
  selectedNodeId?: string;
  selectedRouteId?: string;
}

export function NetworkVisualizationControls({
  zoom,
  onZoomChange,
  showLabels,
  onShowLabelsChange,
  showGrid,
  onShowGridChange,
  showRoutes,
  onShowRoutesChange,
  onReset,
  onZoomIn,
  onZoomOut,
  nodeCount,
  routeCount,
  selectedNodeId,
  selectedRouteId
}: NetworkVisualizationControlsProps) {
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Visualization Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zoom Controls */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Zoom Level</Label>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onZoomOut}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <div className="flex-1">
              <Slider
                value={[zoom * 100]}
                onValueChange={([value]) => onZoomChange(value / 100)}
                min={30}
                max={300}
                step={10}
                className="w-full"
              />
            </div>
            <Button size="sm" variant="outline" onClick={onZoomIn}>
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {(zoom * 100).toFixed(0)}%
          </div>
        </div>

        <Separator />

        {/* Display Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Display Options</Label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <Label htmlFor="show-labels" className="text-sm">Node Labels</Label>
            </div>
            <Switch
              id="show-labels"
              checked={showLabels}
              onCheckedChange={onShowLabelsChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              <Label htmlFor="show-grid" className="text-sm">Grid Lines</Label>
            </div>
            <Switch
              id="show-grid"
              checked={showGrid}
              onCheckedChange={onShowGridChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showRoutes ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <Label htmlFor="show-routes" className="text-sm">Route Lines</Label>
            </div>
            <Switch
              id="show-routes"
              checked={showRoutes}
              onCheckedChange={onShowRoutesChange}
            />
          </div>
        </div>

        <Separator />

        {/* Network Statistics */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Network Statistics</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-bold">{nodeCount}</div>
              <div className="text-xs text-muted-foreground">Nodes</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-bold">{routeCount}</div>
              <div className="text-xs text-muted-foreground">Routes</div>
            </div>
          </div>
        </div>

        {/* Selection Info */}
        {(selectedNodeId || selectedRouteId) && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Selection</Label>
              {selectedNodeId && (
                <Badge variant="default" className="w-full justify-center">
                  Node Selected
                </Badge>
              )}
              {selectedRouteId && (
                <Badge variant="secondary" className="w-full justify-center">
                  Route Selected
                </Badge>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Reset Button */}
        <Button onClick={onReset} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset View
        </Button>

        {/* Color Legend */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Node Types</Label>
          <div className="space-y-1">
            {[
              { type: 'farm', color: '#10B981', emoji: '🐄', label: 'Dairy Farms' },
              { type: 'collection_center', color: '#3B82F6', emoji: '🏭', label: 'Collection Centers' },
              { type: 'processing_plant', color: '#8B5CF6', emoji: '⚙️', label: 'Processing Plants' },
              { type: 'distributor', color: '#F59E0B', emoji: '📦', label: 'Distributors' },
              { type: 'retail', color: '#EF4444', emoji: '🏪', label: 'Retail Outlets' }
            ].map(({ type, color, emoji, label }) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: color, fontSize: '8px' }}
                >
                  {emoji}
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}