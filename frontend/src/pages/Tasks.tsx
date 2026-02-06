import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import {
  Plus,
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  Calendar as CalendarIcon,
  MoreVertical,
  Flag,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Clock,
  User,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { KanbanBoard } from "@/components/KanbanBoard";
import { CalendarView } from "@/components/CalendarView";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TaskComments } from "@/components/TaskComments";
import { SubtaskList } from "@/components/SubtaskList";
import { TagSelector } from "@/components/TagSelector";
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
import { useSocket } from "@/context/SocketContext";


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
  project_id: string;
  project?: {
    name: string;
  };
  tags?: Array<{
    id: string;
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  assignee?: {
      id: string;
      name: string;
      avatar?: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  due_date: z.string().optional(),
  project_id: z.string().min(1, "Project is required"),
  assignee_id: z.string().optional(),
});
type TaskFormValues = z.infer<typeof taskSchema>;

const Tasks = () => {
  const { id: projectId } = useParams();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]); // Restored state
  
  // Socket Logic
  useEffect(() => {
    if (!socket) return;

    // Join project room if available
    if (projectId) {
        socket.emit('joinProject', { projectId });
    }
    
    // Always listen to user events (for global view or personal updates)
    // The backend already joins the user room on connection in handleConnection
    
    const handleTaskCreated = (newTask: Task) => {
        // If we're in a specific project, only add if it belongs there
        // If we're in global view, add it
        if (!projectId || newTask.project_id === projectId) {
            setTasks(prev => {
                // Prevent duplicates
                if (prev.find(t => t.id === newTask.id)) return prev;
                return [newTask, ...prev];
            });
            toast({ title: "New Task Created", description: newTask.title });
        }
    };

    const handleTaskUpdated = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskDeleted = (data: { id: string }) => {
        setTasks(prev => prev.filter(t => t.id !== data.id));
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    return () => {
        if (projectId) {
            socket.emit('leaveProject', { projectId });
        }
        socket.off('task_created', handleTaskCreated);
        socket.off('task_updated', handleTaskUpdated);
        socket.off('task_deleted', handleTaskDeleted);
    };
  }, [socket, projectId]);

  // ... existing code ...
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]); // All user projects
  const [projectMembers, setProjectMembers] = useState<any[]>([]); // Members for assignment
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"LIST" | "BOARD" | "CALENDAR">("LIST");
  const { toast } = useToast();

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      due_date: "",
      project_id: projectId || "",
    },
  });

  // Fetch all projects for the dropdown
  useEffect(() => {
      const fetchProjects = async () => {
          try {
              const token = localStorage.getItem('token');
              if (token) {
                  const response = await axios.get(`${API_BASE_URL}/projects`, {
                      headers: { Authorization: `Bearer ${token}` }
                  });
                  setProjects(response.data);
              }
          } catch (error) {
              console.error("Failed to fetch projects");
          }
      };
      
      fetchProjects();
  }, [projectId]);

  // Fetch project members for assignment
  const selectedProjectId = form.watch('project_id');
  useEffect(() => {
      if (selectedProjectId && /^[a-f\d]{24}$/i.test(selectedProjectId)) {
           const fetchMembers = async () => {
               const token = localStorage.getItem('token');
               if (token) {
                   try {
                      const res = await axios.get(`${API_BASE_URL}/projects/${selectedProjectId}/members`, {
                          headers: { Authorization: `Bearer ${token}` }
                      });
                      setProjectMembers(res.data);
                 } catch (e) {
                     setProjectMembers([]);
                 }
             }
        };
        fetchMembers();
    } else {
        setProjectMembers([]);
    }
  }, [selectedProjectId]);



  const handleTaskUpdate = (updatedTask: Task) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    const token = localStorage.getItem('token');
    if (token) {
         // Clean the payload: Only send fields the backend expects
         const { title, description, status, priority, due_date, project_id, assignee_id } = updatedTask;
         const payload = {
             title,
             description,
             status,
             priority,
             due_date,
             project_id,
             assignee_id: assignee_id || null // Ensure empty string is null for Prisma
         };

         axios.patch(`${API_BASE_URL}/tasks/${updatedTask.id}`, payload, {
             headers: { Authorization: `Bearer ${token}` }
         }).catch(() => {
             toast({ title: "Update failed", variant: "destructive" });
         });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: "Task deleted",
        description: "The task has been permanently removed.",
      });

      try {
        const token = localStorage.getItem('token');
        if (token) {
           await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
             headers: { Authorization: `Bearer ${token}` }
           });
        }
      } catch (error) {
          console.error("Failed to delete task", error);
      }
  };

  // Effect to reset form when dialog opens/closes
  useEffect(() => {
    if (isDialogOpen) {
        if (editingTask) {
            form.reset({
                title: editingTask.title,
                description: editingTask.description || "",
                priority: editingTask.priority,
                due_date: editingTask.due_date ? editingTask.due_date.split('T')[0] : "",
                project_id: editingTask.project_id,
                assignee_id: editingTask.assignee?.id
            });
        } else {
            form.reset({
                title: "",
                description: "",
                priority: "MEDIUM",
                due_date: "",
                project_id: projectId || (projects.length > 0 ? projects[0].id : ""),
                assignee_id: ""
            });
        }
    } else {
        setEditingTask(null);
    }
  }, [isDialogOpen, editingTask, form, projectId, projects]);

  useEffect(() => {
    const fetchProject = async () => {
       if (!projectId) {
           setProject(null);
           return;
       }
       try {
          const token = localStorage.getItem('token');
          if (token) {
              const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setProject(response.data);
          }
       } catch (error) {
           console.error("Failed to fetch project");
       }
    };

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token");

        let url = `${API_BASE_URL}/tasks`;
        const params: any = {};
        
        if (projectId) {
            params.project_id = projectId;
        }

        if (searchQuery) {
            params.search = searchQuery;
        }

        if (statusFilter !== "ALL") {
            params.status = statusFilter;
        }

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params
        });
        setTasks(response.data);
      } catch (error) {
        console.log("Using mock tasks data");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    
    const timeoutId = setTimeout(() => {
        fetchTasks();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [projectId, searchQuery, statusFilter]);

  const openEditDialog = (task: Task) => {
      setEditingTask(task);
      setIsDialogOpen(true);
  };

  const onSubmit = async (data: TaskFormValues) => {
    try {
      if (editingTask) {
           // Update existing
           const updatedTask = { ...editingTask, ...data, due_date: data.due_date ? new Date(data.due_date).toISOString() : null };
           handleTaskUpdate(updatedTask);
           toast({ title: "Task updated!" });
      } else {
          // Create new
          const token = localStorage.getItem('token');
          if (token) {
              const payload = { 
                  ...data, 
                  project_id: data.project_id,
                  assignee_id: data.assignee_id || null, // Convert "" to null
                  due_date: data.due_date ? new Date(data.due_date).toISOString() : null 
              };
              const response = await axios.post(`${API_BASE_URL}/tasks`, payload, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setTasks([response.data, ...tasks]);
              toast({ title: "Task created" });
          } else {
               // Mock Create
               const newTask: Task = {
                    id: Math.random().toString(),
                    title: data.title,
                    description: data.description || null,
                    status: "TODO",
                    priority: data.priority,
                    due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
                    project_id: data.project_id
               };
               setTasks([newTask, ...tasks]);
               toast({ title: "Task created locally" });
          }
      }
      setIsDialogOpen(false);
      form.reset({
        title: "",
        description: "",
        priority: "MEDIUM",
        due_date: "",
        project_id: projectId || form.getValues("project_id"), // Preserve the project selection
      });
    } catch (error) {
      console.error("Failed to sync task", error);
      toast({ title: "Error", description: "Failed to save task", variant: "destructive" });
    }
  };

  // Filtering Logic
  // Server-side filtering is now implemented
  const filteredTasks = tasks;

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
            <h1 className="font-pixel text-3xl mb-2">{project ? project.name : "My Tasks"}</h1>
            <p className="font-mono text-muted-foreground">{project ? (project.description || "Project details.") : "Keep track of your daily work."}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input 
                    placeholder="Search tasks..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[180px] md:w-[240px] h-10 bg-background border-2 border-foreground font-mono text-sm 
                    shadow-[4px_4px_0px_hsl(var(--foreground))] 
                    focus-visible:ring-0 focus-visible:border-primary 
                    focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] 
                    focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] 
                    transition-all placeholder:text-muted-foreground/70"
                />
            </div>

            <div className="flex items-center gap-1 bg-card border-2 border-foreground p-1 h-10">
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
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 ${viewMode === "CALENDAR" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setViewMode("CALENDAR")}
                >
                    <CalendarIcon className="h-4 w-4" />
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
                 
                 {editingTask ? (
                    <Tabs defaultValue="details" className="w-full">
                        <div className="border-b-2 border-foreground px-6 bg-secondary/5">
                            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                                <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-mono font-bold uppercase text-xs data-[state=active]:text-primary text-muted-foreground transition-all">Details</TabsTrigger>
                                <TabsTrigger value="subtasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-mono font-bold uppercase text-xs data-[state=active]:text-primary text-muted-foreground transition-all">Steps</TabsTrigger>
                                <TabsTrigger value="comments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-3 font-mono font-bold uppercase text-xs data-[state=active]:text-primary text-muted-foreground transition-all">Comments</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="p-6 pt-4">
                            <TabsContent value="details" className="mt-0">
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
                                         <FormField
                                            control={form.control}
                                            name="project_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-mono font-bold uppercase text-xs">Project</FormLabel>
                                                    <FormControl>
                                                        <select
                                                            disabled={!!projectId}
                                                            className="w-full h-10 px-3 py-2 rounded-md border-2 border-foreground bg-background font-mono text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all disabled:opacity-50"
                                                            {...field}
                                                        >
                                                            <option value="" disabled>Select Project</option>
                                                            {projects.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                         />
                                         <FormField
                                            control={form.control}
                                            name="assignee_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-mono font-bold uppercase text-xs">Assignee</FormLabel>
                                                    <FormControl>
                                                        <select 
                                                            className="w-full h-10 px-3 py-2 rounded-md border-2 border-foreground bg-background font-mono text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all"
                                                            {...field}
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {projectMembers.map(m => (
                                                                <option key={m.user.id} value={m.user.id}>
                                                                    {m.user.name} ({m.role})
                                                                </option>
                                                            ))}
                                                        </select>
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
                                         
                                         <div className="space-y-2 pt-4 border-t-2 border-foreground/10">
                                             <label className="font-mono font-bold uppercase text-xs">Tags</label>
                                             <TagSelector 
                                                 taskId={editingTask.id} 
                                                 projectId={editingTask.project_id}
                                                 selectedTags={editingTask.tags || []}
                                                 onTagsChange={async () => {
                                                     // Refresh the task to get updated tags
                                                     const token = localStorage.getItem('token');
                                                     if (token) {
                                                         const response = await axios.get(`${API_BASE_URL}/tasks/${editingTask.id}`, {
                                                             headers: { Authorization: `Bearer ${token}` }
                                                         });
                                                         setEditingTask(response.data);
                                                         setTasks(prev => prev.map(t => t.id === response.data.id ? response.data : t));
                                                     }
                                                 }}
                                             />
                                         </div>
                                         
                                        <DialogFooter className="pt-4">
                                            <Button type="submit" className="w-full font-bold uppercase tracking-wider bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                                                Save Changes
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </TabsContent>
                            <TabsContent value="subtasks" className="mt-0">
                                <SubtaskList taskId={editingTask.id} projectId={editingTask.project_id} />
                            </TabsContent>
                            <TabsContent value="comments" className="mt-0">
                                <TaskComments taskId={editingTask.id} />
                            </TabsContent>
                        </div>
                    </Tabs>
                 ) : (
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
                                <FormField
                                    control={form.control}
                                    name="project_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-mono font-bold uppercase text-xs">Project</FormLabel>
                                            <FormControl>
                                                <select
                                                    disabled={!!projectId}
                                                    className="w-full h-10 px-3 py-2 rounded-md border-2 border-foreground bg-background font-mono text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all disabled:opacity-50"
                                                    {...field}
                                                >
                                                    {!field.value && <option value="">Select Project</option>}
                                                    {projects.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="assignee_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-mono font-bold uppercase text-xs">Assignee</FormLabel>
                                            <FormControl>
                                                <select 
                                                    className="w-full h-10 px-3 py-2 rounded-md border-2 border-foreground bg-background font-mono text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all"
                                                    {...field}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {projectMembers.map(m => (
                                                        <option key={m.user.id} value={m.user.id}>
                                                            {m.user.name} ({m.role})
                                                        </option>
                                                    ))}
                                                </select>
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
                                        Create Task
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                     </div>
                 )}
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
                onTasksReorder={() => {}} 
             />
        ) : viewMode === "CALENDAR" ? (
             <CalendarView
                tasks={filteredTasks}
                onEditTask={openEditDialog}
                onDeleteTask={handleDeleteTask}
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
                                        <button 
                                            className="mt-1 shrink-0 hover:scale-110 transition-transform focus:outline-none"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newStatus = task.status === "DONE" ? "TODO" : "DONE";
                                                
                                                // Optimistically update the UI
                                                const optimisticTask = { 
                                                    ...task, 
                                                    status: newStatus as TaskStatus,
                                                    completed_at: newStatus === "DONE" ? new Date().toISOString() : null
                                                };
                                                setTasks(prev => prev.map(t => t.id === task.id ? optimisticTask : t));

                                                // Send ONLY the fields the backend DTO accepts
                                                const payload = {
                                                    status: newStatus as TaskStatus,
                                                    completed_at: newStatus === "DONE" ? new Date().toISOString() : null
                                                };

                                                const token = localStorage.getItem('token');
                                                if (token) {
                                                    axios.patch(`${API_BASE_URL}/tasks/${task.id}`, payload, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    }).catch((err) => {
                                                        console.error("Failed to update status", err);
                                                        toast({ title: "Update failed", variant: "destructive" });
                                                        // Revert on failure
                                                        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
                                                    });
                                                }

                                                if (newStatus === "DONE") {
                                                    toast({ 
                                                        title: "Task Completed!", 
                                                        description: "Great job! Keep it up.",
                                                        className: "bg-green-50 border-green-200"
                                                    });
                                                }
                                            }}
                                        >
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
                                                {task.assignee && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20 text-primary">
                                                        <User className="h-3 w-3" />
                                                        <span className="truncate max-w-[100px]">{task.assignee.name}</span>
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
                                                {task.tags && task.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {task.tags.map((taskTag) => (
                                                            <Badge
                                                                key={taskTag.id}
                                                                style={{ backgroundColor: taskTag.tag.color }}
                                                                className="text-white border-0 font-mono text-[9px] px-1.5 py-0"
                                                            >
                                                                {taskTag.tag.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
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
