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
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { TrendDefinition } from '@/types/trend-navigator';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendsListProps {
  trends: TrendDefinition[];
  onEdit?: (trend: TrendDefinition) => void;
  onDelete?: (trendId: string) => void;
  loading: boolean;
}

export default function TrendsList({ trends, onEdit, onDelete, loading }: TrendsListProps) {
  if (loading) {
    return <TrendsListSkeleton />;
  }

  if (trends.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-muted-foreground mb-2">No trends found</p>
          <p className="text-sm text-muted-foreground">Create a new trend to get started</p>
        </CardContent>
      </Card>
    );
  }

  const formatImpact = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value}%`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>
              <div className="flex items-center">
                Population
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center">
                Employment
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center">
                Trip Gen
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Auto</TableHead>
            <TableHead>Transit</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trends.map((trend) => (
            <TableRow key={trend.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{trend.name}</div>
                  {trend.description && (
                    <div className="text-xs text-muted-foreground">{trend.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatImpact(trend.impacts.population)}</TableCell>
              <TableCell>{formatImpact(trend.impacts.employment)}</TableCell>
              <TableCell>{formatImpact(trend.impacts.tripGeneration)}</TableCell>
              <TableCell>
                {formatImpact(trend.impacts.modeChoice?.auto)}
              </TableCell>
              <TableCell>
                {formatImpact(trend.impacts.modeChoice?.transit)}
              </TableCell>
              <TableCell>
                {formatImpact(trend.impacts.networkCapacity)}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(trend)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete trend</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this trend? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(trend.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TrendsListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Population</TableHead>
            <TableHead>Employment</TableHead>
            <TableHead>Trip Gen</TableHead>
            <TableHead>Auto</TableHead>
            <TableHead>Transit</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-[250px]" />
                <Skeleton className="h-4 w-[200px] mt-1" />
              </TableCell>
              <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
              <TableCell>
                <div className="flex space-x-2">
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