import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  PlayCircle,
  GripVertical,
  Flag
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, addDays, isAfter, isBefore } from 'date-fns';

interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  dependencies?: string[];
  order: number;
}

interface ProjectTimelineProps {
  projectId: string;
}

export default function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch milestones
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['/api/milestones', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/milestones?projectId=${projectId}`);
      return response.sort((a: Milestone, b: Milestone) => a.order - b.order);
    },
  });

  // Create milestone mutation
  const createMilestone = useMutation({
    mutationFn: (milestone: Partial<Milestone>) => 
      apiRequest('/api/milestones', {
        method: 'POST',
        body: JSON.stringify({ ...milestone, projectId, order: milestones.length }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones', projectId] });
      setIsAddingMilestone(false);
    },
  });

  // Update milestone mutation
  const updateMilestone = useMutation({
    mutationFn: ({ id, ...milestone }: Partial<Milestone> & { id: string }) =>
      apiRequest(`/api/milestones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(milestone),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones', projectId] });
      setEditingMilestone(null);
    },
  });

  // Delete milestone mutation
  const deleteMilestone = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/milestones/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones', projectId] });
    },
  });

  // Update milestone order mutation
  const updateMilestoneOrder = useMutation({
    mutationFn: (reorderedMilestones: Milestone[]) =>
      apiRequest('/api/milestones/reorder', {
        method: 'PUT',
        body: JSON.stringify({ milestones: reorderedMilestones }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones', projectId] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = milestones.findIndex((m: Milestone) => m.id === active.id);
      const newIndex = milestones.findIndex((m: Milestone) => m.id === over.id);
      
      const reorderedMilestones = arrayMove(milestones, oldIndex, newIndex).map((milestone, index) => ({
        ...milestone,
        order: index,
      }));

      updateMilestoneOrder.mutate(reorderedMilestones);
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Milestone['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-construction-orange"></div>
            <span className="ml-2 text-muted-foreground">Loading timeline...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project Timeline
              </CardTitle>
              <CardDescription>
                Drag and drop milestones to reorder them
              </CardDescription>
            </div>
            <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Milestone</DialogTitle>
                </DialogHeader>
                <MilestoneForm
                  onSubmit={(milestone) => createMilestone.mutate(milestone)}
                  onCancel={() => setIsAddingMilestone(false)}
                  isLoading={createMilestone.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No milestones yet. Add your first milestone to get started.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={milestones.map((m: Milestone) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {milestones.map((milestone: Milestone) => (
                    <SortableMilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onEdit={setEditingMilestone}
                      onDelete={(id) => deleteMilestone.mutate(id)}
                      onStatusChange={(id, status) => 
                        updateMilestone.mutate({ id, status })
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Edit Milestone Dialog */}
      <Dialog 
        open={!!editingMilestone} 
        onOpenChange={() => setEditingMilestone(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
          </DialogHeader>
          {editingMilestone && (
            <MilestoneForm
              milestone={editingMilestone}
              onSubmit={(milestone) => 
                updateMilestone.mutate({ id: editingMilestone.id, ...milestone })
              }
              onCancel={() => setEditingMilestone(null)}
              isLoading={updateMilestone.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SortableMilestoneCardProps {
  milestone: Milestone;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Milestone['status']) => void;
}

function SortableMilestoneCard({ 
  milestone, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: SortableMilestoneCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: milestone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = parseISO(milestone.dueDate);
  const isOverdue = milestone.status !== 'completed' && isBefore(dueDate, new Date());
  const isDueSoon = isBefore(dueDate, addDays(new Date(), 3));

  const StatusIcon = milestone.status === 'completed' ? CheckCircle : 
                    milestone.status === 'in_progress' ? PlayCircle : 
                    isOverdue ? AlertCircle : Clock;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-200 bg-red-50' : 
        isDueSoon ? 'border-yellow-200 bg-yellow-50' : 
        'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Status Icon */}
        <div className="flex-shrink-0 mt-1">
          <StatusIcon className={`h-5 w-5 ${
            milestone.status === 'completed' ? 'text-green-600' :
            milestone.status === 'in_progress' ? 'text-blue-600' :
            isOverdue ? 'text-red-600' : 'text-gray-600'
          }`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
              {milestone.description && (
                <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {format(dueDate, 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Flag className={`h-4 w-4 ${getPriorityColor(milestone.priority)}`} />
                  <span className={`text-sm capitalize ${getPriorityColor(milestone.priority)}`}>
                    {milestone.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(milestone.status)} variant="secondary">
                {milestone.status.replace('_', ' ')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(milestone)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(milestone.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="flex gap-2 mt-3">
            {milestone.status !== 'in_progress' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(milestone.id, 'in_progress')}
              >
                Start
              </Button>
            )}
            {milestone.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(milestone.id, 'completed')}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MilestoneFormProps {
  milestone?: Milestone;
  onSubmit: (milestone: Partial<Milestone>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function MilestoneForm({ milestone, onSubmit, onCancel, isLoading }: MilestoneFormProps) {
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    dueDate: milestone?.dueDate?.split('T')[0] || format(new Date(), 'yyyy-MM-dd'),
    priority: milestone?.priority || 'medium' as Milestone['priority'],
    status: milestone?.status || 'pending' as Milestone['status'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      dueDate: new Date(formData.dueDate).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value as Milestone['priority'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as Milestone['status'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : milestone ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

function getPriorityColor(priority: Milestone['priority']) {
  switch (priority) {
    case 'critical': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'medium': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
}

function getStatusColor(status: Milestone['status']) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}