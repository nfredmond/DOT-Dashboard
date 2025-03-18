import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Eye, PlayCircle, Trash2, BarChart3, Loader2 } from 'lucide-react';
import { TrendScenario } from '@/types/trend-navigator';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface TrendScenariosListProps {
  scenarios: TrendScenario[];
  selectedScenarios: string[];
  onSelect: (scenario: TrendScenario) => void;
  onToggleCompare: (scenarioId: string) => void;
  onDelete: (scenarioId: string) => void;
  onRun: (scenarioId: string) => void;
  isRunning: boolean;
  loading: boolean;
}

export default function TrendScenariosList({
  scenarios,
  selectedScenarios,
  onSelect,
  onToggleCompare,
  onDelete,
  onRun,
  isRunning,
  loading,
}: TrendScenariosListProps) {
  if (loading) {
    return <ScenariosListSkeleton />;
  }

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-muted-foreground mb-2">No scenarios found</p>
          <p className="text-sm text-muted-foreground">Create a new scenario to get started</p>
        </CardContent>
      </Card>
    );
  }

  // Get status badge color based on run status
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Running</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  // Count number of trends in a scenario
  const getTrendCount = (scenario: TrendScenario) => {
    return scenario.trendImpacts?.length || 0;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Compare</TableHead>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Trends</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scenarios.map((scenario) => (
            <TableRow key={scenario.id}>
              <TableCell>
                <Checkbox
                  checked={selectedScenarios.includes(scenario.id)}
                  onCheckedChange={() => onToggleCompare(scenario.id)}
                  disabled={scenario.run_status !== 'completed'}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div>{scenario.name}</div>
                  {scenario.description && (
                    <div className="text-xs text-muted-foreground">{scenario.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getTrendCount(scenario)}</TableCell>
              <TableCell>{getStatusBadge(scenario.run_status)}</TableCell>
              <TableCell>{formatDate(scenario.last_run_at)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onSelect(scenario)}
                    title="View Scenario Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onRun(scenario.id)}
                    disabled={isRunning || scenario.run_status === 'running'}
                    className="text-blue-600"
                    title="Run Scenario"
                  >
                    {isRunning && scenario.run_status === 'running' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {scenario.run_status === 'completed' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onSelect(scenario)}
                      className="text-green-600"
                      title="View Results"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        title="Delete Scenario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete scenario</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this scenario? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(scenario.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ScenariosListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Compare</TableHead>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Trends</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-4 rounded-sm" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-4 w-[200px] mt-1" />
              </TableCell>
              <TableCell><Skeleton className="h-5 w-[30px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 