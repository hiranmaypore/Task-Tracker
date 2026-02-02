import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Check, Trash2, MailOpen } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('http://localhost:3000/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:3000/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:3000/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 rounded-full h-10 w-10">
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] bg-card" align="end">
        <div className="flex items-center justify-between p-4 border-b border-foreground/10 bg-muted/20">
            <h4 className="font-pixel text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary font-mono"
                >
                    Mark all read
                </Button>
            )}
        </div>
        <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                    <MailOpen className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs font-mono">No notifications yet</p>
                </div>
            ) : (
                <div className="divide-y divide-foreground/10">
                    {notifications.map((notification) => (
                        <div 
                            key={notification.id} 
                            className={`p-4 hover:bg-muted/30 transition-colors flex gap-3 ${!notification.read ? 'bg-primary/5' : ''}`}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-primary' : 'bg-transparent'}`} />
                            <div className="flex-1 space-y-1">
                                <p className={`text-sm font-medium leading-none ${!notification.read ? 'font-bold' : 'text-muted-foreground'}`}>
                                    {notification.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {notification.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70 font-mono mt-2">
                                    {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
