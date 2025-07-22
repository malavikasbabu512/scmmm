
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDairyData } from '@/hooks/useDairyData';
import { useWeatherData } from '@/hooks/useWeatherData';
import { InteractiveNetworkMap } from './InteractiveNetworkMap';
import { EssentialNetworkMetrics } from './EssentialNetworkMetrics';
import { EnhancedDataImportExport } from './EnhancedDataImportExport';
import { RealTimeMetrics } from './RealTimeMetrics';
import { NetworkTopologyVisualization } from './NetworkTopologyVisualization';
import { AdvancedNetworkTopology } from './AdvancedNetworkTopology';
import { 
  Network, 
  BarChart3, 
  Database, 
  Map,
  CheckCircle,
  Info,
  CloudSun,
  GitBranch,
  Workflow
} from 'lucide-react';

export function EnhancedDairyNetworkDesigner() {
  const { nodes, routes, isLoading } = useDairyData();
  const { weatherData, isLoading: isWeatherLoading } = useWeatherData();
  const [activeTab, setActiveTab] = useState('network');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['whole-milk']);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(['medium-refrigerated-truck']);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span className="ml-2">Loading dairy supply chain network...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Network Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-6 w-6" />
            Comprehensive Dairy Supply Chain Network Designer
          </CardTitle>
          <CardDescription>
            Advanced network optimization tool for dairy supply chains with real-time weather integration, 
            product specifications, and multi-modal transportation planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                🐄 {nodes.filter(n => n.type === 'farm').length}
              </div>
              <div className="text-sm text-muted-foreground">Dairy Farms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                🏭 {nodes.filter(n => n.type === 'collection_center').length}
              </div>
              <div className="text-sm text-muted-foreground">Collection Centers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                ⚙️ {nodes.filter(n => n.type === 'processing_plant').length}
              </div>
              <div className="text-sm text-muted-foreground">Processing Plants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                📦 {nodes.filter(n => n.type === 'collection_center').length}
              </div>
              <div className="text-sm text-muted-foreground">Distribution Centers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                🏪 {nodes.filter(n => n.type === 'processing_plant').length}
              </div>
              <div className="text-sm text-muted-foreground">Processing Plants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">🛣️ {routes.length}</div>
              <div className="text-sm text-muted-foreground">Active Routes</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                Network Status: Operational
              </Badge>
              <Badge variant="outline">
                Multi-Product Support
              </Badge>
              <Badge variant="outline">
                Weather-Aware Optimization
              </Badge>
              <Badge variant="outline">
                Real-time Analytics
              </Badge>
            </div>
            
            {weatherData && !isWeatherLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CloudSun className="h-4 w-4" />
                {weatherData.temperature}°C, {weatherData.humidity}% humidity
              </div>
            )}
          </div>

          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This system supports comprehensive dairy supply chain optimization including farms (🐄), collection centers (🏭), 
              processing plants (⚙️), distributors (📦), and retail outlets (🏪). Real-time weather data affects spoilage calculations. 
              Peak collection times (6-9 AM, 5-8 PM) are automatically considered for routing efficiency.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Real-time Metrics Dashboard */}
      <RealTimeMetrics
        selectedProducts={selectedProducts}
        selectedVehicles={selectedVehicles}
        routes={routes}
        nodes={nodes}
        weatherData={weatherData}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Network Design
          </TabsTrigger>
          <TabsTrigger value="topology" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Basic Topology
          </TabsTrigger>
          <TabsTrigger value="advanced-topology" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Advanced Canvas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Analytics
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-4">
          <InteractiveNetworkMap
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
            selectedVehicles={selectedVehicles}
            onVehiclesChange={setSelectedVehicles}
          />
        </TabsContent>

        <TabsContent value="topology" className="space-y-4">
          <NetworkTopologyVisualization
            nodes={nodes}
            routes={routes}
          />
        </TabsContent>

        <TabsContent value="advanced-topology" className="space-y-4">
          <AdvancedNetworkTopology
            nodes={nodes}
            routes={routes}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <EssentialNetworkMetrics />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <EnhancedDataImportExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
