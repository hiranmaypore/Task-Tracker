import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { motion } from "framer-motion";
import { 
  FolderPlus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  UserPlus, 
  UserMinus,
  Edit,
  Trash2,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ActivityFeedProps {
  limit?: number;
  showHeader?: boolean;
}

const getActivityIcon = (action: string, entityType: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes("created")) {
    return entityType === "PROJECT" ? FolderPlus : FileText;
  }
  if (actionLower.includes("updated")) return Edit;
  if (actionLower.includes("deleted")) return Trash2;
  if (actionLower.includes("status_changed")) return CheckCircle;
  if (actionLower.includes("commented")) return MessageSquare;
  if (actionLower.includes("member_added")) return UserPlus;
  if (actionLower.includes("member_removed")) return UserMinus;
  
  return Clock;
};

const getActivityColor = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes("created")) return "text-green-600 dark:text-green-400 bg-green-500/10";
  if (actionLower.includes("updated")) return "text-blue-600 dark:text-blue-400 bg-blue-500/10";
  if (actionLower.includes("deleted")) return "text-red-600 dark:text-red-400 bg-red-500/10";
  if (actionLower.includes("status_changed")) return "text-purple-600 dark:text-purple-400 bg-purple-500/10";
  if (actionLower.includes("commented")) return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10";
  
  return "text-gray-600 dark:text-gray-400 bg-gray-500/10";
};

const parseActivityMessage = (activity: Activity) => {
  const action = activity.action.split(":")[0];
  const metadata = activity.action.includes(":") 
    ? JSON.parse(activity.action.split(":").slice(1).join(":"))
    : {};

  let message = "";
  
  switch (action) {
    case "CREATED":
      message = `created ${activity.entity_type.toLowerCase()} ${metadata.title || metadata.name || ""}`;
      break;
    case "UPDATED":
      message = `updated ${activity.entity_type.toLowerCase()}`;
      break;
    case "DELETED":
      message = `deleted ${activity.entity_type.toLowerCase()} ${metadata.title || metadata.name || ""}`;
      break;
    case "STATUS_CHANGED":
      message = `changed status from ${metadata.from} to ${metadata.to}`;
      break;
    case "ASSIGNED":
      message = `assigned a task`;
      break;
    case "COMMENTED":
      message = `commented on a task`;
      break;
    case "MEMBER_ADDED":
      message = `added a member to project`;
      break;
    case "MEMBER_REMOVED":
      message = `removed a member from project`;
      break;
    default:
      message = `performed ${action.toLowerCase()} on ${activity.entity_type.toLowerCase()}`;
  }
  
  return message;
};

export function ActivityFeed({ limit = 10, showHeader = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/activity-log/recent?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setActivities(response.data);
    } catch (error) {
      console.error("Failed to fetch activities", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        {showHeader && (
          <CardHeader>
            <CardTitle className="font-pixel text-xl">Recent Activity</CardTitle>
            <CardDescription className="font-mono text-xs">Loading activities...</CardDescription>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        {showHeader && (
          <CardHeader>
            <CardTitle className="font-pixel text-xl">Recent Activity</CardTitle>
            <CardDescription className="font-mono text-xs">What's happening in your workspace</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-mono text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      {showHeader && (
        <CardHeader>
          <CardTitle className="font-pixel text-xl flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription className="font-mono text-xs">What's happening in your workspace</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.action, activity.entity_type);
              const colorClass = getActivityColor(activity.action);
              const message = parseActivityMessage(activity);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 pb-4 border-b border-foreground/10 last:border-0"
                >
                  {/* Avatar/Icon */}
                  <div className={`shrink-0 h-10 w-10 rounded-full ${colorClass} flex items-center justify-center`}>
                    {activity.user.avatar ? (
                      <img 
                        src={activity.user.avatar} 
                        alt={activity.user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono">
                      <span className="font-bold">{activity.user.name}</span>{" "}
                      <span className="text-muted-foreground">{message}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono text-[10px] px-2 py-0">
                        {activity.entity_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
