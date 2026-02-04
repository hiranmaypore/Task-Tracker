import { useState, useEffect } from "react";
import axios from "axios";
import { Check, Plus, Trash2, Loader2, GripVertical, Circle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  project_id: string;
}

interface SubtaskListProps {
  taskId: string;
  projectId: string;
}

export function SubtaskList({ taskId, projectId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const fetchSubtasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // We fetch the main task to get its subtasks
        // Ideally we'd have a specific endpoint, but fetching the task works if it includes subtasks
        // HOWEVER, backend findOne includes subtasks.
        const response = await axios.get(`http://localhost:3000/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.subtasks) {
            setSubtasks(response.data.subtasks);
        }
      }
    } catch (error) {
       console.error("Failed to fetch subtasks");
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const addSubtask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
        const token = localStorage.getItem("token");
        await axios.post('http://localhost:3000/tasks', {
            title: newTitle,
            project_id: projectId, // Subtask belongs to same project
            parent_task_id: taskId,
            status: 'TODO'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setNewTitle("");
        fetchSubtasks();
        toast({ title: "Subtask added" });
    } catch (e) {
        toast({ title: "Error", description: "Failed to add subtask", variant: "destructive" });
    } finally {
        setAdding(false);
    }
  };

  const toggleSubtask = async (subtask: Task) => {
      const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
      
      // Optimistic update
      setSubtasks(prev => prev.map(t => t.id === subtask.id ? { ...t, status: newStatus } : t));

      try {
          const token = localStorage.getItem("token");
          await axios.patch(`http://localhost:3000/tasks/${subtask.id}`, {
              status: newStatus
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
      } catch (e) {
          // Revert
          setSubtasks(prev => prev.map(t => t.id === subtask.id ? subtask : t));
          toast({ title: "Error", description: "Failed to update subtask", variant: "destructive" });
      }
  };

  const deleteSubtask = async (subtaskId: string) => {
      // Optimistic delete
      const previous = [...subtasks];
      setSubtasks(prev => prev.filter(t => t.id !== subtaskId));

      try {
          const token = localStorage.getItem("token");
          await axios.delete(`http://localhost:3000/tasks/${subtaskId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
      } catch (e) {
          setSubtasks(previous);
          toast({ title: "Error", description: "Failed to delete subtask", variant: "destructive" });
      }
  };

  const completedCount = subtasks.filter(t => t.status === 'DONE').length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  if (loading) return <div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
        {subtasks.length > 0 && (
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>PROGRESS</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 border border-foreground/20 bg-secondary/10" indicatorClassName="bg-primary" />
            </div>
        )}

        <div className="space-y-2">
            {subtasks.map(task => (
                <div key={task.id} className="group flex items-center gap-3 p-2 border border-transparent hover:border-foreground/10 hover:bg-muted/10 rounded transition-all">
                   <button onClick={() => toggleSubtask(task)} className="text-muted-foreground hover:text-primary transition-colors">
                       {task.status === 'DONE' ? (
                           <CheckCircle2 className="h-5 w-5 text-primary" />
                       ) : (
                           <Circle className="h-5 w-5" />
                       )}
                   </button>
                   <span className={cn(
                       "flex-1 font-mono text-sm transition-all",
                       task.status === 'DONE' && "line-through text-muted-foreground"
                   )}>
                       {task.title}
                   </span>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteSubtask(task.id)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                   >
                       <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
            ))}
        </div>

        <div className="flex gap-2 pt-2">
            <Input 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add a step..."
                className="font-mono text-xs h-9 border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary"
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            />
            <Button 
                size="sm" 
                onClick={addSubtask} 
                disabled={adding || !newTitle.trim()}
                className="h-9 w-9 border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-px active:translate-y-px active:shadow-none p-0"
            >
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
        </div>
    </div>
  );
}
