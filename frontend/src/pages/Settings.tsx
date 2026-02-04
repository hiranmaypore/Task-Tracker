import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { User, Bell, Shield, Moon, Sun, Loader2, Save, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { GoogleCalendarSettings } from "@/components/GoogleCalendarSettings";

// Profile Schema
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  avatar: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Settings = () => {
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    projectsOwned: 0,
    tasksCreated: 0,
    tasksCompleted: 0,
    completionRate: 0,
    memberSince: new Date(),
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      avatar: "",
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const [profileResponse, statsResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/users/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_BASE_URL}/users/me/stats`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                
                const user = profileResponse.data;
                setUserId(user.id);
                form.reset({
                    name: user.name,
                    email: user.email,
                    currentPassword: "",
                    newPassword: "",
                    avatar: user.avatar || "",
                });
                
                setUserStats(statsResponse.data);
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
            toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
        }
    };
    fetchUser();
  }, [form, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('token');
        if (!token || !userId) {
            toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
            return;
        }

        const payload: any = { 
            name: data.name,
            avatar: data.avatar 
        };
        
        // Only include password if changing it
        if (data.newPassword && data.newPassword.length >= 6) {
             // In a real app, currentPassword would be verified by backend.
             // Here we just send the new password.
             payload.password = data.newPassword;
        }

        await axios.patch(`${API_BASE_URL}/users/${userId}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        toast({
            title: "Settings updated",
            description: "Your profile has been updated successfully.",
        });
        
        // Clear password fields on success
        form.setValue("currentPassword", "");
        form.setValue("newPassword", "");

        // Notify other components (like DashboardLayout) to refresh user data
        window.dispatchEvent(new Event('user-updated'));

    } catch (error) {
        console.error("Update failed", error);
        toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({ title: "Error", description: "Please type DELETE to confirm", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token || !userId) return;

      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
      
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="font-pixel text-3xl mb-2">Settings</h1>
          <p className="font-mono text-muted-foreground">Manage your account preferences.</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3 border-2 border-foreground bg-background p-1 h-auto mb-8">
            <TabsTrigger 
                value="account" 
                className="font-mono font-bold uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 border border-transparent data-[state=active]:border-foreground transition-all"
            >
                Account
            </TabsTrigger>
            <TabsTrigger 
                value="notifications" 
                className="font-mono font-bold uppercase data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground h-10 border border-transparent data-[state=active]:border-foreground transition-all"
            >
                Notifications
            </TabsTrigger>
            <TabsTrigger 
                value="appearance" 
                className="font-mono font-bold uppercase data-[state=active]:bg-accent data-[state=active]:text-accent-foreground h-10 border border-transparent data-[state=active]:border-foreground transition-all"
            >
                Appearance
            </TabsTrigger>
            <TabsTrigger 
                value="integrations" 
                className="font-mono font-bold uppercase data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 h-10 border border-transparent data-[state=active]:border-foreground transition-all"
            >
                Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            {/* ... existing content ... */}
            <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
              <CardHeader>
                <CardTitle className="font-pixel flex items-center gap-2 text-xl">
                    <User className="h-5 w-5" /> Profile Information
                </CardTitle>
                <CardDescription className="font-mono text-xs">Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-mono font-bold uppercase text-xs">Display Name</FormLabel>
                                <FormControl>
                                <Input className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))]" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-mono font-bold uppercase text-xs">Email Address</FormLabel>
                                <FormControl>
                                <Input className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))]" disabled {...field} />
                                </FormControl>
                                <FormDescription className="font-mono text-[10px]">Email cannot be changed.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-pixel text-lg flex items-center gap-2">
                             <User className="h-4 w-4" /> Avatar
                        </h3>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                            {[
                                "Felix", "Aneka", "Zack", "Molly", "Bear", "Caitlyn",
                                "Digby", "Eliza", "Fiona", "Gavin", "Hanna", "Ivan"
                            ].map((seed) => {
                                const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;
                                return (
                                    <div 
                                        key={seed}
                                        onClick={() => form.setValue('avatar', avatarUrl, { shouldDirty: true })}
                                        className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                                            form.watch('avatar') === avatarUrl 
                                            ? 'border-primary ring-2 ring-primary ring-offset-2' 
                                            : 'border-transparent hover:border-foreground/50'
                                        }`}
                                    >
                                        <img src={avatarUrl} alt={seed} className="w-full h-auto bg-secondary/20" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <Separator className="bg-foreground/20" />
                    
                    <div className="space-y-4">
                        <h3 className="font-pixel text-lg flex items-center gap-2">
                             <Shield className="h-4 w-4" /> Security
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="currentPassword"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-mono font-bold uppercase text-xs">Current Password</FormLabel>
                                    <FormControl>
                                    <Input type="password" className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-mono font-bold uppercase text-xs">New Password</FormLabel>
                                    <FormControl>
                                    <Input type="password" className="font-mono border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary focus-visible:shadow-[2px_2px_0px_hsl(var(--foreground))]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading} className="font-bold uppercase tracking-wider bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6"
            >
              <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                <CardHeader>
                  <CardTitle className="font-pixel flex items-center gap-2 text-xl">
                    📊 Account Overview
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">Your activity summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div 
                      className="p-4 border-2 border-foreground/20 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="text-2xl font-bold font-pixel text-blue-600 dark:text-blue-400">{userStats.projectsOwned}</div>
                      <div className="text-xs font-mono text-muted-foreground uppercase">Projects</div>
                    </motion.div>
                    <motion.div 
                      className="p-4 border-2 border-foreground/20 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="text-2xl font-bold font-pixel text-green-600 dark:text-green-400">{userStats.tasksCreated}</div>
                      <div className="text-xs font-mono text-muted-foreground uppercase">Tasks Created</div>
                    </motion.div>
                    <motion.div 
                      className="p-4 border-2 border-foreground/20 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="text-2xl font-bold font-pixel text-purple-600 dark:text-purple-400">{userStats.tasksCompleted}</div>
                      <div className="text-xs font-mono text-muted-foreground uppercase">Completed</div>
                    </motion.div>
                    <motion.div 
                      className="p-4 border-2 border-foreground/20 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="text-2xl font-bold font-pixel text-orange-600 dark:text-orange-400">{userStats.completionRate}%</div>
                      <div className="text-xs font-mono text-muted-foreground uppercase">Completion</div>
                    </motion.div>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-4 text-center">
                    Member since {new Date(userStats.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <Card className="border-2 border-red-500 shadow-[4px_4px_0px_hsl(var(--destructive))] bg-red-500/5">
                <CardHeader>
                  <CardTitle className="font-pixel flex items-center gap-2 text-xl text-red-600 dark:text-red-400">
                    <Trash2 className="h-5 w-5" /> Danger Zone
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">Permanently delete your account and all data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-mono text-muted-foreground">
                    Once you delete your account, there is no going back. All your projects, tasks, and data will be permanently erased.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="font-bold uppercase tracking-wider border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
              <CardHeader>
                <CardTitle className="font-pixel flex items-center gap-2 text-xl">
                    <Bell className="h-5 w-5" /> Preferences
                </CardTitle>
                <CardDescription className="font-mono text-xs">Manage how you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <h4 className="font-mono font-bold text-sm uppercase">Email Notifications</h4>
                        <p className="text-xs text-muted-foreground font-mono">Receive daily summaries and alerts.</p>
                     </div>
                     <Switch />
                 </div>
                 <Separator className="bg-foreground/10" />
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <h4 className="font-mono font-bold text-sm uppercase">Task Assignments</h4>
                        <p className="text-xs text-muted-foreground font-mono">Notify me when I'm assigned a task.</p>
                     </div>
                     <Switch defaultChecked />
                 </div>
                 <Separator className="bg-foreground/10" />
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                        <h4 className="font-mono font-bold text-sm uppercase">Project Updates</h4>
                        <p className="text-xs text-muted-foreground font-mono">Notify me about project changes.</p>
                     </div>
                     <Switch defaultChecked />
                 </div>
                 
                 <Separator className="bg-foreground/10" />
                 
                 <div className="flex justify-end pt-2">
                    <Button 
                        onClick={async () => {
                            try {
                                const token = localStorage.getItem('token');
                                await axios.get(`${API_BASE_URL}/notifications/test`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                // Toast is handled by socket in NotificationCenter, but we can confirm request sent
                            } catch (error) {
                                toast({ title: "Error", description: "Failed to send test notification", variant: "destructive" });
                            }
                        }}
                        variant="outline" 
                        type="button"
                        className="font-mono font-bold uppercase text-xs border-2 border-primary text-primary hover:bg-primary/10"
                    >
                        <Bell className="mr-2 h-4 w-4" /> Send Test Notification
                    </Button>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
             <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
              <CardHeader>
                <CardTitle className="font-pixel flex items-center gap-2 text-xl">
                    <Sun className="h-5 w-5" /> Theme
                </CardTitle>
                <CardDescription className="font-mono text-xs">Customize the look and feel.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                      <button 
                        onClick={() => setTheme("light")}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-foreground/20 hover:border-foreground'}`}
                      >
                          <Sun className="h-8 w-8" />
                          <span className="font-mono font-bold text-xs uppercase">Light</span>
                      </button>
                      <button 
                        onClick={() => setTheme("dark")}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-foreground/20 hover:border-foreground'}`}
                      >
                          <Moon className="h-8 w-8" />
                          <span className="font-mono font-bold text-xs uppercase">Dark</span>
                      </button>
                      <button 
                        onClick={() => setTheme("system")}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/10' : 'border-foreground/20 hover:border-foreground'}`}
                      >
                          <span className="text-xl font-bold">💻</span>
                          <span className="font-mono font-bold text-xs uppercase">System</span>
                      </button>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
             <GoogleCalendarSettings />
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="border-2 border-foreground shadow-[8px_8px_0px_hsl(var(--foreground))] bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-pixel text-xl">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="font-mono text-sm">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm font-mono">Type <span className="font-bold text-red-500">DELETE</span> to confirm:</p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="font-mono border-2 border-foreground"
                placeholder="Type DELETE here"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-mono font-bold uppercase border-2 border-foreground">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount}
                className="font-mono font-bold uppercase bg-red-600 hover:bg-red-700 border-2 border-foreground"
              >
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
