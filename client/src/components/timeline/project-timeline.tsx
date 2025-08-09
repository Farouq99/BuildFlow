import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Flag, GripVertical, Plus, Edit } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Milestone } from '@/lib/schema';

interface ProjectTimelineProps {
  projectId: string;
}

interface MilestoneItemProps {
  milestone: Milestone;
  onEdit: (milestone: Milestone) => void;
}

const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-500' },
];

const MILESTONE_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'border-gray-300' },
  { value: 'medium', label: 'Medium', color: 'border-yellow-400' },
  { value: 'high', label: 'High', color: 'border-orange-500' },
  { value: 'critical', label: 'Critical', color: 'border-red-500' },
];

function SortableMilestoneItem({ milestone, onEdit }: MilestoneItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusConfig = MILESTONE_STATUSES.find(s => s.value === milestone.status) || MILESTONE_STATUSES[0];
  const priorityConfig = MILESTONE_PRIORITIES.find(p => p.value === milestone.priority) || MILESTONE_PRIORITIES[1];
  
  const startDate = new Date(milestone.startDate);
  const endDate = new Date(milestone.endDate);
  const today = new Date();
  
  // Calculate if milestone is overdue
  const isOverdue = milestone.status !== 'completed' && isAfter(today, endDate);
  const actualStatus = isOverdue ? 'overdue' : milestone.status;
  const actualStatusConfig = MILESTONE_STATUSES.find(s => s.value === actualStatus) || MILESTONE_STATUSES[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-4 ${priorityConfig.color} border-l-4 pl-4`}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="mt-1 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold">
                  {milestone.title}
                </CardTitle>
                {milestone.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {milestone.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`${actualStatusConfig.color} text-white`}
              >
                {actualStatusConfig.label}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(milestone)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{milestone.progress}%</span>
              </div>
              <Progress value={milestone.progress} className="h-2" />
            </div>

            {/* Timeline info */}
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>Start: {format(startDate, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>End: {format(endDate, 'MMM dd, yyyy')}</span>
              </div>
              {milestone.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span>Assigned</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-purple-600" />
                <span className="capitalize">{milestone.priority} priority</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch milestones
  const { data: milestonesData, isLoading } = useQuery({
    queryKey: ['/api/milestones', projectId],
    queryFn: () => apiRequest(`/api/milestones?projectId=${projectId}`),
  });

  useEffect(() => {
    if (milestonesData) {
      setMilestones(milestonesData.sort((a: Milestone, b: Milestone) => a.position - b.position));
    }
  }, [milestonesData]);

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, projectId, position: milestones.length }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones', projectId] });
      setIsCreateDialogOpen(false);
      toast({ title: "Milestone created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create milestone", variant: "destructive" });
    },
  });

  // Update milestone mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones', projectId] });
      setEditingMilestone(null);
      toast({ title: "Milestone updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update milestone", variant: "destructive" });
    },
  });

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = milestones.findIndex((item) => item.id === active.id);
    const newIndex = milestones.findIndex((item) => item.id === over.id);

    const newMilestones = arrayMove(milestones, oldIndex, newIndex);
    setMilestones(newMilestones);

    // Update positions in database
    newMilestones.forEach((milestone, index) => {
      if (milestone.position !== index) {
        updateMilestoneMutation.mutate({
          id: milestone.id,
          data: { position: index }
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Loading timeline...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Project Timeline</h3>
          <p className="text-muted-foreground">
            Drag milestones to reorder and track project progress
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-construction-orange hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Milestone</DialogTitle>
            </DialogHeader>
            <MilestoneForm
              onSubmit={(data) => createMilestoneMutation.mutate(data)}
              isSubmitting={createMilestoneMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {milestones.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No milestones yet. Create your first milestone to start tracking project progress.
            </div>
          </CardContent>
        </Card>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={milestones.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <div>
              {milestones.map((milestone) => (
                <SortableMilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  onEdit={setEditingMilestone}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit milestone dialog */}
      <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
          </DialogHeader>
          {editingMilestone && (
            <MilestoneForm
              milestone={editingMilestone}
              onSubmit={(data) => updateMilestoneMutation.mutate({
                id: editingMilestone.id,
                data
              })}
              isSubmitting={updateMilestoneMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MilestoneForm({ 
  milestone, 
  onSubmit, 
  isSubmitting 
}: { 
  milestone?: Milestone; 
  onSubmit: (data: any) => void; 
  isSubmitting: boolean; 
}) {
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    startDate: milestone ? format(new Date(milestone.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    endDate: milestone ? format(new Date(milestone.endDate), 'yyyy-MM-dd') : format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    status: milestone?.status || 'pending',
    priority: milestone?.priority || 'medium',
    progress: milestone?.progress || 0,
    color: milestone?.color || '#3b82f6',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Milestone title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MILESTONE_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MILESTONE_PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Progress (%)</label>
        <Input
          type="number"
          min="0"
          max="100"
          value={formData.progress}
          onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : milestone ? 'Update Milestone' : 'Create Milestone'}
      </Button>
    </form>
  );
}