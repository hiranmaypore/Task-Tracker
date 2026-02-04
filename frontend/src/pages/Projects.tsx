import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Folder, MoreVertical, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Types
interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  _count?: {
    tasks: number;
    members: number;
  };
  role?: string; // User's role in the project
}

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  userRole: z.enum(["OWNER", "EDITOR", "VIEWER"]).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

// Mock Data for Offline Mode
// Mock Data for Offline Mode (Removed)
const MOCK_PROJECTS: Project[] = [];

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      userRole: "OWNER",
    },
  });

  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Reset form when dialog opens/closes or editingProject changes
  useEffect(() => {
    if (isDialogOpen) {
      if (editingProject) {
        form.reset({
          name: editingProject.name,
          description: editingProject.description || "",
        });
      } else {
        form.reset({
          name: "",
          description: "",
        });
      }
    } else {
      setEditingProject(null); // Clear editing state when dialog closes
    }
  }, [isDialogOpen, editingProject, form]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // If no token in offline/preview mode, throw immediately to use mock data
      if (!token) throw new Error("No token");

      const response = await axios.get('http://localhost:3000/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.log("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingProject) {
        // Update Logic
        if (token) {
           await axios.patch(`http://localhost:3000/projects/${editingProject.id}`, data, {
             headers: { Authorization: `Bearer ${token}` }
           });
           toast({ title: "Success", description: "Project updated successfully" });
           fetchProjects();
        }
      } else {
        // Create Logic
        if (token) {
          await axios.post('http://localhost:3000/projects', data, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast({ title: "Success", description: "Project created successfully" });
          fetchProjects(); 
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: editingProject ? "Failed to update project" : "Failed to create project" 
      });
    }
  };

  const handleEditClick = (project: Project) => {
      setEditingProject(project);
      setIsDialogOpen(true);
  };

  const [managingProject, setManagingProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"OWNER"|"EDITOR"|"VIEWER">("VIEWER");
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);

  const handleManageTeam = async (project: Project) => {
      setManagingProject(project);
      setIsTeamDialogOpen(true);
      fetchMembers(project.id);
  };

  const fetchMembers = async (projectId: string) => {
      try {
          const token = localStorage.getItem('token');
          if (token) {
              const response = await axios.get(`http://localhost:3000/projects/${projectId}/members`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              setTeamMembers(response.data);
          }
      } catch (error) {
          console.error("Failed to fetch members");
      }
  };

  const handleInvite = async () => {
      if (!inviteEmail) return;
      try {
          const token = localStorage.getItem('token');
          if (token && managingProject) {
              await axios.post(`http://localhost:3000/projects/${managingProject.id}/invite`, {
                  email: inviteEmail,
                  role: inviteRole
              }, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              toast({ title: "Invitation Sent", description: `Invited ${inviteEmail} as ${inviteRole}` });
              setInviteEmail("");
              fetchMembers(managingProject.id); // Refresh list
          }
      } catch (error: any) {
          toast({ 
              title: "Invitation Failed", 
              description: error.response?.data?.message || "Could not invite user.",
              variant: "destructive"
          });
      }
  };

  const handleRemoveMember = async (userId: string) => {
      try {
          const token = localStorage.getItem('token');
          if (token && managingProject) {
              await axios.delete(`http://localhost:3000/projects/${managingProject.id}/members/${userId}`, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              toast({ title: "Member Removed" });
              fetchMembers(managingProject.id);
          }
      } catch (error) {
          toast({ title: "Failed to remove member", variant: "destructive" });
      }
  };


  const handleDeleteProject = async (projectId: string) => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
            await axios.delete(`http://localhost:3000/projects/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast({ title: "Success", description: "Project deleted successfully" });
            fetchProjects();
        }
      } catch (error) {
          toast({ 
            variant: "destructive", 
            title: "Error", 
            description: "Failed to delete project" 
          });
      }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-pixel text-3xl mb-2">Projects</h1>
            <p className="font-mono text-muted-foreground">Manage your team's workspace.</p>
          </div>
          
                {/* Team Management Dialog */}
                <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                    <DialogContent className="border-2 border-foreground shadow-[8px_8px_0px_hsl(var(--foreground))] max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-pixel text-xl">Manage Team: {managingProject?.name}</DialogTitle>
                            <DialogDescription className="font-mono text-xs">Invite members and manage roles.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                            {/* Invite Form */}
                            <div className="bg-secondary/10 p-4 border border-foreground/20 rounded-md space-y-3">
                                <h4 className="font-bold font-mono text-sm uppercase">Invite New Member</h4>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="User Email" 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="font-mono border-2 border-foreground"
                                    />
                                    <select 
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as any)}
                                        className="h-10 px-3 py-2 rounded-md border-2 border-foreground bg-background font-mono text-sm focus-visible:outline-none"
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="EDITOR">Editor</option>
                                        <option value="OWNER">Owner</option>
                                    </select>
                                    <Button onClick={handleInvite} className="font-bold border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] active:shadow-none">
                                        Invoke
                                    </Button>
                                </div>
                            </div>

                            {/* Members List */}
                            <div className="space-y-2">
                                <h4 className="font-bold font-mono text-sm uppercase">Current Squad ({teamMembers.length})</h4>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                                    {teamMembers.map((member: any) => (
                                        <div key={member.id} className="flex items-center justify-between p-2 border border-foreground/10 rounded-md bg-card">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full overflow-hidden border border-foreground/20 bg-primary/10 flex items-center justify-center">
                                                    {member.user.avatar ? (
                                                        <img src={member.user.avatar} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="font-bold text-xs">{member.user.name[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold font-mono text-sm">{member.user.name}</div>
                                                    <div className="text-[10px] font-mono text-muted-foreground">{member.user.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-bold font-mono uppercase bg-secondary/20 px-2 py-1 rounded">{member.role}</span>
                                                {/* Only show remove if not owner, simplified check for now */}
                                                {member.role !== 'OWNER' && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveMember(member.user.id)}
                                                    >
                                                        x
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold uppercase tracking-wider bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-foreground shadow-[8px_8px_0px_hsl(var(--foreground))]">
              <DialogHeader>
                <DialogTitle className="font-pixel text-xl">{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  {editingProject ? "Update your project details." : "Add a new space for your team to collaborate."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono font-bold uppercase text-xs">Project Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Website Redesign" 
                            className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all"
                            {...field} 
                          />
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
                        <FormLabel className="font-mono font-bold uppercase text-xs">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What's this project about?" 
                            className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!editingProject && (
                      <FormField
                        control={form.control}
                        name="userRole"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-mono font-bold uppercase text-xs">My Role</FormLabel>
                            <FormControl>
                                <select 
                                    className="w-full h-10 px-3 py-2 rounded-md border-2 border-foreground bg-background font-mono text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all"
                                    {...field}
                                >
                                    <option value="OWNER">Owner (Full Access)</option>
                                    <option value="EDITOR">Editor (Can Edit)</option>
                                    <option value="VIEWER">Viewer (Read Only)</option>
                                </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  )}
                  <DialogFooter>
                    <Button type="submit" className="w-full font-bold uppercase bg-accent text-accent-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:shadow-none transition-all">
                      {editingProject ? "Save Changes" : "Create Project"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[200px] w-full border-2 border-muted" />
            ))}
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div key={project.id} variants={item} layout>
                  <Card 
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="h-full flex flex-col border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:-translate-y-1 hover:shadow-[6px_6px_0px_hsl(var(--foreground))] transition-all duration-300 group cursor-pointer relative overflow-hidden bg-card"
                    >
                    {/* Decorative stripe */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary via-accent to-secondary" />
                    
                    <CardHeader className="pb-2">
                       <div className="flex justify-between items-start">
                          <div className="p-2 bg-secondary/20 rounded-md border border-foreground/10 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                             <Folder className="h-5 w-5" />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 -mr-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-2 border-foreground">
                              <DropdownMenuItem className="font-mono text-xs uppercase cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEditClick(project); }}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="font-mono text-xs uppercase cursor-pointer" onClick={(e) => { e.stopPropagation(); handleManageTeam(project); }}>Manage Team</DropdownMenuItem>
                              <DropdownMenuItem className="font-mono text-xs uppercase cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       </div>
                       <CardTitle className="font-pixel text-lg mt-4 truncate">{project.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <p className="font-mono text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {project.description || "No description provided."}
                      </p>
                      
                      <div className="mt-4 flex gap-4 text-xs font-mono font-bold text-foreground/60 uppercase">
                          <div className="flex items-center gap-1">
                             <span className="text-primary">{project._count?.tasks || 0}</span> Tasks
                          </div>
                          <div className="flex items-center gap-1">
                             <span className="text-secondary-foreground">{project._count?.members || 1}</span> Members
                          </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-4 border-t-2 border-foreground/5 bg-secondary/5 text-xs font-mono text-muted-foreground flex justify-between">
                       <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(project.created_at), 'MMM d, yyyy')}
                       </div>
                       <div className="px-2 py-0.5 rounded-full bg-background border border-foreground/20 text-[10px] uppercase font-bold tracking-wider">
                          {project.role || "MEMBER"}
                       </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;
