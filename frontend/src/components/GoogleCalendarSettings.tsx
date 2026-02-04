import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Calendar, CheckCircle2, XCircle, RefreshCw, Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocation, useNavigate } from "react-router-dom";

export function GoogleCalendarSettings() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkConnectionStatus();
    
    // Check for success param from redirect
    const params = new URLSearchParams(location.search);
    if (params.get('google_sync') === 'success') {
        toast({
            title: "Calendar Connected!",
            description: "Your tasks will now sync to Google Calendar.",
        });
        navigate('/settings', { replace: true });
        setIsConnected(true);
    }
  }, [location]);

  const checkConnectionStatus = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await axios.get(`${API_BASE_URL}/calendar/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setIsConnected(response.data.connected);
    } catch (error) {
        console.error("Failed to check calendar status");
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/calendar/auth-url`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = response.data.authUrl;
    } catch (error) {
      toast({ title: "Error", description: "Failed to initiate connection", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('token');
         await axios.delete(`${API_BASE_URL}/calendar/disconnect`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setIsConnected(false);
        toast({ title: "Disconnected", description: "Google Calendar connection removed." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_BASE_URL}/calendar/sync`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: "Synced!", description: "Tasks pushed to Google Calendar." });
    } catch (error) {
        toast({ title: "Sync Failed", description: "Could not sync tasks.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2 text-xl">
             <Calendar className="h-5 w-5" /> Google Calendar
        </CardTitle>
        <CardDescription className="font-mono text-xs">
            Sync your tasks with Google Calendar to never miss a deadline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-secondary/10 border-2 border-foreground/10 rounded-lg">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full border-2 ${isConnected ? 'bg-green-100 border-green-500 text-green-600' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                    {isConnected ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                    <h3 className="font-bold font-mono text-sm">{isConnected ? "Connected" : "Not Connected"}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                        {isConnected ? "Your tasks are syncing automatically." : "Connect your account to enable sync."}
                    </p>
                </div>
            </div>
            {isConnected ? (
                 <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={isLoading} className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" /> Disconnect
                 </Button>
            ) : (
                <Button onClick={handleConnect} disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700 font-bold font-mono">
                    <LinkIcon className="h-4 w-4 mr-2" /> Connect
                </Button>
            )}
        </div>

        {isConnected && (
            <div className="flex justify-end">
                <Button variant="ghost" onClick={handleSyncNow} disabled={isLoading} className="font-mono text-xs uppercase">
                    <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync Now
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
