import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Filter, 
  Plus, 
  Search,
  MoreHorizontal,
  Calendar as CalendarIcon,
  LayoutList,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { KanbanBoard } from "@/components/KanbanBoard";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Types
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

// Mock Data
const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Design Homepage Hero Section",
    description: "Create high-fidelity mockups for the new landing page hero.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    due_date: new Date(Date.now() + 86400000).toISOString(),
    project: { name: "Website Redesign" }
  },
  {
    id: "2",
    title: "Setup Analytics",
    description: "Integrate Google Analytics 4 property.",
    status: "TODO",
    priority: "MEDIUM",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    project: { name: "Website Redesign" }
  },
  {
    id: "3",
    title: "Review Q3 Marketing Plan",
    description: null,
    status: "DONE",
    priority: "HIGH",
    due_date: new Date(Date.now() - 86400000).toISOString(),
    project: { name: "Mobile App Launch" }
  },
  {
    id: "4",
    title: "Update Dependencies",
    description: "Run npm audit fix and update packages.",
    status: "TODO",
    priority: "LOW",
    due_date: null,
  }
];

// Add Task Schema
const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  due_date: z.string().optional(), // In real app, might want a date picker
});
type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"LIST" | "BOARD">("LIST");
  const { toast } = useToast();

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleTaskUpdate = (updatedTask: Task) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    // In a real app, send to backend here
    // axios.patch(/tasks/${updatedTask.id}, updatedTask)
  };

  const handleDeleteTask = async (taskId: string) => {
      // Optimistic delete
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      toast({
        title: "Task deleted",
        description: "The task has been permanently removed.",
        variant: "destructive" 
      });

      try {
        const token = localStorage.getItem('token');
        if (token) {
           await axios.delete(`http://localhost:3000/tasks/${taskId}`, {
             headers: { Authorization: `Bearer ${token}` }
           });
        }
      } catch (error) {
          console.error("Failed to delete task", error);
          // Ideally revert optimistic update here if needed
      }
  };

  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      due_date: "",
    },
  });

  // Effect to reset form when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
        if (editingTask) {
            form.reset({
                title: editingTask.title,
                description: editingTask.description || "",
                priority: editingTask.priority,
                due_date: editingTask.due_date ? editingTask.due_date.split('T')[0] : "",
            });
        } else {
            form.reset({
                title: "",
                description: "",
                priority: "MEDIUM",
                due_date: "",
            });
        }
    } else {
        setEditingTask(null);
    }
  }, [isDialogOpen, editingTask, form]);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token");

        const response = await axios.get('http://localhost:3000/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(response.data);
      } catch (error) {
        // Fallback or verify if using mock data in offline mode
        console.log("Using mock tasks data");
        // Simulate network delay
        setTimeout(() => {
             setTasks(MOCK_TASKS);
        }, 500);
      } finally {
        if (loading) setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const openEditDialog = (task: Task) => {
      setEditingTask(task);
      setIsDialogOpen(true);
  };

  const onSubmit = async (data: CreateTaskFormValues) => {
    try {
      if (editingTask) {
           // Update existing
           const updatedTask = { ...editingTask, ...data, due_date: data.due_date ? new Date(data.due_date).toISOString() : null };
           handleTaskUpdate(updatedTask);
           toast({
             title: "Task updated!",
             description: "Your task has been modified.",
           });
      } else {
          // Create new
          const newTask: Task = {
            id: Math.random().toString(),
            title: data.title,
            description: data.description || null,
            status: "TODO",
            priority: data.priority,
            due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
          };
          setTasks([newTask, ...tasks]);
          toast({
            title: "Task created!",
            description: "Your new task has been added.",
          });
      }
      
      setIsDialogOpen(false);
      form.reset();

      // Try actual backend call (Simplified for demo)
      const token = localStorage.getItem('token');
        if (token && !editingTask) { // Only posting new for now in demo
           await axios.post('http://localhost:3000/tasks', data, {
             headers: { Authorization: `Bearer ${token}` }
           });
        }
    } catch (error) {
      // Fail silently for offline demo
      console.error("Failed to sync task", error);
    }
  };



  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "DONE": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "IN_PROGRESS": return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
     switch (priority) {
        case "HIGH": return "bg-red-100 text-red-800 border-red-200";
        case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "LOW": return "bg-blue-100 text-blue-800 border-blue-200";
        default: return "bg-gray-100 text-gray-800";
     }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-pixel text-3xl mb-2">My Tasks</h1>
            <p className="font-mono text-muted-foreground">Keep track of your daily work.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-card border-2 border-foreground p-1 mr-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${viewMode === "LIST" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("LIST")}
                >
                    <LayoutList className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${viewMode === "BOARD" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("BOARD")}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold uppercase tracking-wider bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-foreground shadow-[8px_8px_0px_hsl(var(--foreground))] bg-card p-0 overflow-hidden max-w-md">
                 <div className="bg-primary/10 p-4 border-b-2 border-foreground flex justify-between items-center">
                    <DialogTitle className="font-pixel text-xl flex items-center gap-2">
                        {editingTask ? <MoreHorizontal className="h-5 w-5" /> : <Plus className="h-5 w-5" />} 
                        {editingTask ? "Edit Task" : "New Task"}
                    </DialogTitle>
                 </div>
                 <div className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-mono font-bold uppercase text-xs">Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Update Documentation" className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-mono font-bold uppercase text-xs">Description</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Optional details..." className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-mono font-bold uppercase text-xs">Priority</FormLabel>
                                            <FormControl>
                                                <select 
                                                    className="w-full h-10 px-3 py-2 rounded-md border-2 border-foreground bg-background font-mono text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all"
                                                    {...field}
                                                >
                                                    <option value="LOW">Low</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="HIGH">High</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="due_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-mono font-bold uppercase text-xs">Due Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                                    {editingTask ? "Save Changes" : "Create Task"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                 </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search tasks..." 
                    className="pl-9 font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all bg-card"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-2 border-foreground bg-card font-mono font-bold">
                        <Filter className="mr-2 h-4 w-4" /> Filter: {statusFilter.replace("_", " ")}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-2 border-foreground">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={statusFilter === "ALL"} onCheckedChange={() => setStatusFilter("ALL")}>
                        All
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilter === "TODO"} onCheckedChange={() => setStatusFilter("TODO")}>
                        To Do
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilter === "IN_PROGRESS"} onCheckedChange={() => setStatusFilter("IN_PROGRESS")}>
                        In Progress
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilter === "DONE"} onCheckedChange={() => setStatusFilter("DONE")}>
                        Done
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Task List or Board */}
        {loading ? (
             <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full border-2 border-muted" />)}
             </div>
        ) : viewMode === "BOARD" ? (
             <KanbanBoard 
                tasks={filteredTasks} 
                onTaskUpdate={handleTaskUpdate} 
                onEditTask={openEditDialog}
                onDeleteTask={handleDeleteTask}
                onTasksReorder={() => {}} // Not implemented yet
             />
        ) : (
             <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredTasks.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-muted-foreground font-mono"
                        >
                            No tasks found matching your filters.
                        </motion.div>
                    ) : (
                        filteredTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] hover:shadow-[4px_4px_0px_hsl(var(--foreground))] transition-all group bg-card">
                                    <div className="p-4 flex items-start gap-4">
                                        <button className="mt-1 shrink-0 hover:scale-110 transition-transform">
                                            {getStatusIcon(task.status)}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className={`font-bold font-mono text-base truncate ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                                                    {task.title}
                                                </h3>
                                                <Badge className={`font-mono text-[10px] uppercase border-2 ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </Badge>
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1 font-mono">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground font-mono uppercase">
                                                {task.project && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary/10 rounded-full border border-secondary/20 text-secondary-foreground">
                                                        {task.project.name}
                                                    </span>
                                                )}
                                                {task.due_date && (
                                                    <span className={`flex items-center gap-1 ${
                                                        new Date(task.due_date) < new Date() && task.status !== "DONE" ? "text-red-500 font-bold" : ""
                                                    }`}>
                                                        <CalendarIcon className="h-3 w-3" />
                                                        {format(new Date(task.due_date), "MMM d")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="border-2 border-foreground">
                                                <DropdownMenuItem className="font-mono text-xs uppercase cursor-pointer" onClick={() => openEditDialog(task)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="font-mono text-xs uppercase cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteTask(task.id)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
             </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
