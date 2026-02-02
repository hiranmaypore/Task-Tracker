import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  FolderOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";

// API Interface
interface DashboardStats {
  overview: {
    total_projects: number;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    in_progress_tasks: number;
    completion_rate: number;
  };
  attention_needed: {
    due_today: number;
    overdue: number;
  };
}

const StatCard = ({ title, value, icon: Icon, color, loading }: any) => (
  <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:-translate-y-1 hover:shadow-[6px_6px_0px_hsl(var(--foreground))] transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-full border-2 border-foreground ${color}`}>
         <Icon className="h-4 w-4 text-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
          <Skeleton className="h-8 w-20" />
      ) : (
          <div className="text-2xl font-pixel">{value}</div>
      )}
    </CardContent>
  </Card>
);

// Types
interface ActivityLog {
  id: string;
  user_id: string;
  action: string; // "CREATED:json" or "CREATED"
  entity_type: string;
  entity_id: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
}

const ActivityItem = ({ log }: { log: ActivityLog }) => {
    // Parse action and metadata
    let actionType = log.action;
    let metadata: any = {};
    
    if (log.action.includes(":")) {
        const parts = log.action.split(":");
        actionType = parts[0];
        try {
            metadata = JSON.parse(parts.slice(1).join(":"));
        } catch (e) {
            console.error("Failed to parse activity metadata", e);
        }
    }

    const formatAction = () => {
        const entityName = metadata.title || metadata.name || "item";
        
        switch (actionType) {
            case "CREATED":
                return <span>created {log.entity_type.toLowerCase()} <span className="font-bold">{entityName}</span></span>;
            case "UPDATED":
                return <span>updated {log.entity_type.toLowerCase()} <span className="font-bold">{entityName}</span></span>;
            case "DELETED":
                return <span>deleted {log.entity_type.toLowerCase()} <span className="font-bold">{entityName}</span></span>;
            case "STATUS_CHANGED":
                 return <span>changed status of <span className="font-bold">{metadata.title || "task"}</span> to {metadata.to}</span>;
            case "COMMENTED":
                return <span>commented on task</span>;
            default:
                return <span>performed {actionType.toLowerCase()} on {log.entity_type.toLowerCase()}</span>;
        }
    };

    return (
        <div className="flex items-start gap-4 mb-4 border-b border-foreground/10 pb-4 last:border-0 last:mb-0 last:pb-0">
            <div className="bg-primary/20 p-2 rounded-full border border-foreground/10">
                 <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
                <p className="text-sm font-mono">
                    <span className="font-bold">{log.user.name}</span> {formatAction()}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">
                    {format(new Date(log.timestamp), "MMM d, h:mm a")}
                </p>
            </div>
        </div>
    );
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for frontend-only preview
  const mockStats: DashboardStats = {
    overview: {
      total_projects: 12,
      total_tasks: 45,
      completed_tasks: 28,
      pending_tasks: 17,
      in_progress_tasks: 8,
      completion_rate: 62
    },
    attention_needed: {
      due_today: 3,
      overdue: 2
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
             const [statsRes, activityRes] = await Promise.all([
                axios.get('http://localhost:3000/statistics/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:3000/activity-log/recent', { headers: { Authorization: `Bearer ${token}` } })
             ]);
             setStats(statsRes.data);
             setActivities(activityRes.data);
        } else {
             throw new Error("No token");
        }
      } catch (error) {
        console.log("Using mock data");
        setStats(mockStats);
        // Mock Activities
        setActivities([
            {
                id: "1",
                user_id: "1",
                action: "CREATED:{\"title\":\"Design Mockups\"}",
                entity_type: "TASK",
                entity_id: "101",
                timestamp: new Date().toISOString(),
                user: { name: "You", email: "demo@example.com" }
            },
            {
                id: "2",
                user_id: "2",
                action: "STATUS_CHANGED:{\"title\":\"Backend API\",\"from\":\"TODO\",\"to\":\"IN_PROGRESS\"}",
                entity_type: "TASK",
                entity_id: "102",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                user: { name: "Jane Doe", email: "jane@example.com" }
            }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="space-y-8">
        <div>
            <h1 className="font-pixel text-3xl mb-2">My Dashboard</h1>
            <p className="font-mono text-muted-foreground">Overview of your productivity.</p>
        </div>

        {/* Stats Grid */}
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
           <motion.div variants={item}>
              <StatCard 
                 title="Total Projects" 
                 value={stats?.overview.total_projects || 0} 
                 icon={FolderOpen} 
                 color="bg-purple-200"
                 loading={loading}
               />
          </motion.div>
          <motion.div variants={item}>
              <StatCard 
                 title="Tasks Due" 
                 value={stats?.attention_needed.due_today || 0} 
                 icon={Clock} 
                 color="bg-yellow-200"
                 loading={loading}
               />
          </motion.div>
          <motion.div variants={item}>
              <StatCard 
                 title="Completed" 
                 value={stats?.overview.completed_tasks || 0} 
                 icon={CheckCircle2} 
                 color="bg-green-200"
                 loading={loading}
               />
          </motion.div>
          <motion.div variants={item}>
              <StatCard 
                 title="Overdue" 
                 value={stats?.attention_needed.overdue || 0} 
                 icon={AlertCircle} 
                 color="bg-red-200"
                 loading={loading}
               />
          </motion.div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
             <Card className="col-span-4 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                <CardHeader>
                    <CardTitle className="font-pixel text-xl flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" /> Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-sm">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>No recent activity tracked yet.</p>
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto pr-2">
                            {activities.map(log => (
                                <ActivityItem key={log.id} log={log} />
                            ))}
                        </div>
                    )}
                </CardContent>
             </Card>

             <Card className="col-span-3 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] bg-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="font-pixel text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Link to="/projects" className="block p-3 bg-primary-foreground text-primary font-bold uppercase border-2 border-transparent hover:border-white transition-all text-center rounded-sm">
                        + New Project
                    </Link>
                    <Link to="/tasks" className="block p-3 bg-background/10 text-primary-foreground font-bold uppercase border-2 border-transparent hover:border-white transition-all text-center rounded-sm">
                        View All Tasks
                    </Link>
                </CardContent>
             </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
