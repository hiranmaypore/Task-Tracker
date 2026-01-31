import { useState } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Circle } from "lucide-react";

import { 
  MoreHorizontal,
  ArrowRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Types need to match Tasks.tsx logic, realistically we should export them from a shared type file
// but for now I will redefine or accept 'any' to start, then refine. 
// Ideally I should refactor Types out of Tasks.tsx
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project?: {
    name: string;
  };
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (updatedTask: Task) => void;
  onTasksReorder: (tasks: Task[]) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
];

export function KanbanBoard({ tasks, onTaskUpdate, onTasksReorder, onEditTask, onDeleteTask }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    
    if (!isActiveTask) return;

    // Im dropping a Task over another Task
    if (isActiveTask && isOverTask) {
        // Find indexes
        // For simplicity in this non-persist demo, we might skip complex reorder logic during dragOver
        // But dnd-kit recommends doing it here for smooth visual
        // However, since `tasks` prop is updating from parent, we need to be careful.
    }
    
    // Dropping a Task over a Column
    const isOverColumn = over.data.current?.type === "Column";
    if (isActiveTask && isOverColumn) {
        // We defer layout changes to dragEnd usually or update local state
        // For simplicity let's handle status change on DragEnd only
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
        setActiveId(null);
        return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) {
        setActiveId(null);
        return;
    }

    const overId = over.id as string;
    
    // Check if over is a column
    const isOverColumn = COLUMNS.some(col => col.id === overId);
    
    // Check if over is a task
    const isOverTask = tasks.find(t => t.id === overId);

    let newStatus: TaskStatus = activeTask.status;

    if (isOverColumn) {
        newStatus = overId as TaskStatus;
    } else if (isOverTask) {
        newStatus = isOverTask.status;
    }

    if (newStatus !== activeTask.status) {
        onTaskUpdate({ ...activeTask, status: newStatus });
    }

    // Reordering logic could go here if we want to sort within columns
    
    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;
  
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };
  // ... existing code ...
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn 
            key={col.id} 
            column={col} 
            tasks={tasks.filter(t => t.status === col.id)}
            onTaskUpdate={onTaskUpdate}
            onEditTask={onEditTask}
          />
        ))}
      </div>

       <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
            <TaskCard task={activeTask} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ column, tasks, onTaskUpdate, onEditTask }: { column: { id: TaskStatus, title: string }, tasks: Task[], onTaskUpdate: (t: Task) => void, onEditTask?: (t: Task) => void }) {
    // ... SortableTaskCard setup ...
    const { setNodeRef } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column
        }
    });

    return (
        <div ref={setNodeRef} className="bg-secondary/10 p-4 rounded-none border-2 border-foreground min-h-[500px] flex flex-col gap-4">
             {/* ... header ... */}
             <div className="flex items-center justify-between border-b-2 border-foreground pb-2 mb-2 bg-card p-2 shadow-[2px_2px_0px_hsl(var(--foreground))]">
                <h3 className="font-pixel text-lg">{column.title}</h3>
                <Badge variant="outline" className="font-mono bg-background border-2 border-foreground text-foreground">
                    {tasks.length}
                </Badge>
             </div>

             <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                 <div className="flex flex-col gap-3 flex-1">
                    {tasks.map(task => (
                        <SortableTaskCard key={task.id} task={task} onTaskUpdate={onTaskUpdate} onEditTask={onEditTask} />
                    ))}
                 </div>
             </SortableContext>
        </div>
    )
}

function SortableTaskCard({ task, onTaskUpdate, onEditTask }: { task: Task, onTaskUpdate?: (t: Task) => void, onEditTask?: (t: Task) => void }) {
    // ... Hook ...
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onTaskUpdate={onTaskUpdate} onEditTask={onEditTask} />
        </div>
    );
}

function TaskCard({ task, onTaskUpdate, onEditTask }: { task: Task, onTaskUpdate?: (t: Task) => void, onEditTask?: (t: Task) => void }) {
  const getPriorityColor = (priority: TaskPriority) => {
     switch (priority) {
        case "HIGH": return "bg-red-100 text-red-800 border-red-200";
        case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "LOW": return "bg-blue-100 text-blue-800 border-blue-200";
        default: return "bg-gray-100 text-gray-800";
     }
  };

  return (
    <Card className="p-3 border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] bg-card hover:shadow-[4px_4px_0px_hsl(var(--foreground))] cursor-grab active:cursor-grabbing group item-card">
      <div className="flex justify-between items-start mb-2">
        <Badge className={`font-mono text-[10px] uppercase border-2 mr-2 ${getPriorityColor(task.priority)}`}>
            {task.priority}
        </Badge>
         {task.project && (
            <span className="text-[10px] bg-secondary/20 px-1 border border-secondary/30 rounded font-mono truncate max-w-[80px]">
                {task.project.name}
            </span>
        )}
      </div>
      
      <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold font-mono text-sm mb-1">{task.title}</h4>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2 border-foreground z-50">
                 <DropdownMenuItem className="font-mono text-xs uppercase cursor-pointer" onClick={() => onEditTask && onEditTask(task)}>
                    Edit
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuLabel className="font-mono text-[10px] uppercase text-muted-foreground">Move to</DropdownMenuLabel>
                 {COLUMNS.filter(c => c.id !== task.status).map(col => (
                     <DropdownMenuItem 
                        key={col.id} 
                        className="font-mono text-xs uppercase cursor-pointer flex items-center justify-between"
                        onClick={() => onTaskUpdate && onTaskUpdate({ ...task, status: col.id })}
                     >
                        {col.title} <ArrowRight className="h-3 w-3 ml-2" />
                     </DropdownMenuItem>
                 ))}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && <p className="text-xs text-muted-foreground line-clamp-2 font-mono mb-2">{task.description}</p>}
      
      {task.due_date && (
           <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-2 border-t border-muted pt-2">
               <Clock className="w-3 h-3" />
               {new Date(task.due_date).toLocaleDateString()}
           </div>
      )}
    </Card>
  );
}
