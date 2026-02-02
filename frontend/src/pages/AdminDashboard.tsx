import { useState, useEffect } from "react";
import axios from "axios";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from "recharts";
import { Users, TrendingUp, CheckCircle, Zap } from "lucide-react";
import { motion } from "framer-motion";

import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const [dauData, setDauData] = useState<any[]>([]);
  const [completionStats, setCompletionStats] = useState<any>(null);
  const [automationStats, setAutomationStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Parallel fetch
      const [dauRes, completionRes, autoRes] = await Promise.all([
        axios.get('http://localhost:3000/analytics/dau', { headers }),
        axios.get('http://localhost:3000/analytics/tasks/completion', { headers }),
        axios.get('http://localhost:3000/analytics/automation/executions', { headers })
      ]);

      // Parse DAU result (MongoDB raw output structure)
      // Expecting { cursor: { firstBatch: [ { date: "...", count: 1 } ] } } or array
      // If using prisma.runCommandRaw likely implies custom parsing needed
      let formattedDau = [];
      if (dauRes.data && dauRes.data.cursor && Array.isArray(dauRes.data.cursor.firstBatch)) {
          formattedDau = dauRes.data.cursor.firstBatch;
      } else if (Array.isArray(dauRes.data)) {
          formattedDau = dauRes.data;
      }

      setDauData(formattedDau);
      setCompletionStats(completionRes.data);
      setAutomationStats(autoRes.data);

    } catch (error) {
      console.error("Failed to fetch admin stats", error);
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
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="font-pixel text-3xl mb-2 flex items-center gap-3">
                   <TrendingUp className="h-8 w-8 text-primary" />
                   Admin Analytics
                </h1>
                <p className="font-mono text-muted-foreground">System-wide performance and usage metrics.</p>
            </div>
            <div className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1 rounded font-mono text-sm">
                ADMIN MODE
            </div>
        </div>

        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-3"
        >
             {/* Key Metrics Cards */}
            <motion.div variants={item}>
                <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium font-mono uppercase">
                             Task Completion Rate
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-pixel">
                            {completionStats ? `${completionStats.rate.toFixed(1)}%` : '...'}
                        </div>
                         <p className="text-xs text-muted-foreground font-mono">
                            {completionStats ? `${completionStats.completed} / ${completionStats.total} Tasks` : 'Loading...'}
                         </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium font-mono uppercase">
                             Automation Executions
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-pixel">
                            {automationStats ? automationStats.count : '0'}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                           Total triggers fired
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

             <motion.div variants={item}>
                <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium font-mono uppercase">
                             Active Users (30d)
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-pixel">
                             {dauData.length > 0 ? dauData[dauData.length - 1].count : 0}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                           Interacted today
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>

        {/* Charts */}
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2"
        >
            <motion.div variants={item} className="col-span-2">
                <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <CardHeader>
                        <CardTitle className="font-pixel">Growth: Daily Active Users</CardTitle>
                        <CardDescription className="font-mono">Unique users performing actions per day</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dauData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => `${value}`} 
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))', 
                                        borderColor: 'hsl(var(--foreground))',
                                        fontFamily: 'monospace'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="hsl(var(--primary))" 
                                    fillOpacity={1} 
                                    fill="url(#colorCount)" 
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
