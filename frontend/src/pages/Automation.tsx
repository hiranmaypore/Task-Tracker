import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  ArrowRight, 
  Check, 
  X,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Types
interface AutomationRule {
  id: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: string[];
  enabled: boolean;
}

// Form Schema
const ruleSchema = z.object({
  trigger: z.string().min(1, "Trigger is required"),
  priorityCondition: z.string().optional(),
  action: z.string().min(1, "Action is required"),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

const Automation = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      trigger: "TASK_CREATED",
      priorityCondition: "HIGH",
      action: "EMAIL_ASSIGNEE",
    },
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/automation/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRules(response.data);
    } catch (error) {
      console.error("Failed to fetch rules", error);
      toast({ title: "Error", description: "Failed to load automation rules", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: RuleFormValues) => {
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        trigger: data.trigger,
        conditions: (data.priorityCondition && data.priorityCondition !== "NONE") ? { priority: data.priorityCondition } : {},
        actions: [data.action],
        enabled: true
      };

      await axios.post('http://localhost:3000/automation/rules', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Rule Created",
        description: "Your automation rule is now active.",
      });
      
      setIsDialogOpen(false);
      fetchRules();
    } catch (error) {
      console.error("Create failed", error);
      toast({ title: "Error", description: "Failed to create rule", variant: "destructive" });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/automation/rules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRules(rules.filter(r => r.id !== id));
      toast({ title: "Deleted", description: "Rule removed successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete rule", variant: "destructive" });
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-pixel text-3xl mb-2 flex items-center gap-3">
               <Bot className="h-8 w-8 text-primary" />
               Automation
            </h1>
            <p className="font-mono text-muted-foreground">Create "If This Then That" workflows to save time.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold uppercase tracking-wider bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                    <Plus className="mr-2 h-4 w-4" /> New Rule
                </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-foreground shadow-[8px_8px_0px_hsl(var(--foreground))] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-pixel text-2xl">Create Automation</DialogTitle>
                <DialogDescription className="font-mono">
                  Define a trigger and an action for your workflow.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                 {/* Visual Flow Builder */}
                 <div className="flex flex-col gap-4 items-center bg-secondary/10 p-6 border-2 border-dashed border-foreground/30 rounded-lg">
                    {/* Trigger */}
                    <div className="w-full">
                        <label className="font-mono text-xs font-bold uppercase mb-2 block text-primary">If This Happens...</label>
                        <Select 
                            onValueChange={(val) => form.setValue("trigger", val)} 
                            defaultValue={form.getValues("trigger")}
                        >
                            <SelectTrigger className="font-mono border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] bg-card">
                                <SelectValue placeholder="Select Trigger" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TASK_CREATED">Task Created</SelectItem>
                                <SelectItem value="TASK_COMPLETED">Task Completed</SelectItem>
                                <SelectItem value="TASK_OVERDUE">Task Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />

                    {/* Condition (Optional) */}
                    <div className="w-full">
                        <label className="font-mono text-xs font-bold uppercase mb-2 block text-accent-foreground">And This Condition is Met...</label>
                        <Select 
                            onValueChange={(val) => form.setValue("priorityCondition", val)} 
                            defaultValue={form.getValues("priorityCondition")}
                        >
                            <SelectTrigger className="font-mono border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] bg-card">
                                <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HIGH">Priority is HIGH</SelectItem>
                                <SelectItem value="MEDIUM">Priority is MEDIUM</SelectItem>
                                <SelectItem value="LOW">Priority is LOW</SelectItem>
                                <SelectItem value="NONE">No Condition</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />

                    {/* Action */}
                    <div className="w-full">
                        <label className="font-mono text-xs font-bold uppercase mb-2 block text-secondary">Then Do This...</label>
                        <Select 
                            onValueChange={(val) => form.setValue("action", val)} 
                            defaultValue={form.getValues("action")}
                        >
                            <SelectTrigger className="font-mono border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] bg-card">
                                <SelectValue placeholder="Select Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EMAIL_ASSIGNEE">Email Assignee</SelectItem>
                                <SelectItem value="EMAIL_OWNER">Email Project Owner</SelectItem>
                                <SelectItem value="ARCHIVE_TASK">Archive Task</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
              </div>

              <DialogFooter>
                <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="font-mono uppercase border-2 border-foreground hover:bg-muted"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    className="font-mono font-bold uppercase bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                    Create Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rules List */}
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4"
        >
            <AnimatePresence>
                {rules.length === 0 && !isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="text-center py-20 border-2 border-dashed border-foreground/20 rounded-lg"
                    >
                        <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-pixel text-xl text-muted-foreground">No active rules</h3>
                        <p className="font-mono text-sm text-muted-foreground">Create your first automation to get started.</p>
                    </motion.div>
                )}

                {rules.map((rule) => (
                    <motion.div key={rule.id} variants={item} layout exit={{ opacity: 0, scale: 0.9 }}>
                        <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_hsl(var(--foreground))] transition-all">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    {/* Trigger Icon */}
                                    <div className="w-12 h-12 flex items-center justify-center bg-primary/20 border-2 border-foreground rounded-full">
                                        <Zap className="h-6 w-6 text-primary" />
                                    </div>

                                    {/* Flow Visualization */}
                                    <div className="flex items-center gap-3 font-mono text-sm md:text-base">
                                        <span className="font-bold bg-primary/10 px-2 py-1 rounded border border-primary/20">
                                            {rule.trigger.replace('_', ' ')}
                                        </span>
                                        
                                        {rule.conditions && Object.keys(rule.conditions).length > 0 && (
                                            <>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                <span className="bg-accent/10 px-2 py-1 rounded border border-accent/20 text-accent-foreground">
                                                    Priority is {rule.conditions.priority}
                                                </span>
                                            </>
                                        )}

                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        
                                        <span className="font-bold bg-secondary/10 px-2 py-1 rounded border border-secondary/20 text-secondary-foreground">
                                            {rule.actions[0].replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${rule.enabled ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                                        {rule.enabled ? 'ACTIVE' : 'PAUSED'}
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteRule(rule.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Automation;
