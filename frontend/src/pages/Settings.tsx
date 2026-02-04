import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { User, Bell, Shield, Moon, Sun, Loader2, Save } from "lucide-react";
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
                const response = await axios.get('http://localhost:3000/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const user = response.data;
                setUserId(user.id);
                form.reset({
                    name: user.name,
                    email: user.email,
                    currentPassword: "",
                    newPassword: "",
                    avatar: user.avatar || "",
                });
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

        await axios.patch(`http://localhost:3000/users/${userId}`, payload, {
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
      </div>
    </DashboardLayout>
  );
};

export default Settings;
