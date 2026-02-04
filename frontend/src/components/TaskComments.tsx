import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { Send, User as UserIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface TaskCommentsProps {
  taskId: string;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: "1",
    content: "Please double check the requirements for the mobile view.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user: { id: "2", name: "Jane Doe", avatar: "https://github.com/shadcn.png" }
  },
  {
    id: "2",
    content: "Will do! I'm almost done with the desktop version.",
    created_at: new Date(Date.now() - 43200000).toISOString(),
    user: { id: "1", name: "You" }
  }
];

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchComments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (token) {
          const response = await axios.get(`${API_BASE_URL}/comments/task/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setComments(response.data);
      } else {
          // Mock data
           setTimeout(() => {
                setComments(MOCK_COMMENTS);
           }, 500);
      }
    } catch (error) {
       console.log("Using mock comments");
       setComments(MOCK_COMMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  useEffect(() => {
      // Scroll to bottom on new comment
      if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [comments]);

  const handleSend = async () => {
    if (!newComment.trim()) return;

    setSending(true);
    try {
        const token = localStorage.getItem("token");
        
        if (token) {
            await axios.post(`${API_BASE_URL}/comments`, {
                task_id: taskId,
                content: newComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchComments();
        } else {
            // Optimistic mock add
            const comment: Comment = {
                id: Math.random().toString(),
                content: newComment,
                created_at: new Date().toISOString(),
                user: { id: "1", name: "You" }
            };
            setComments([...comments, comment]);
        }
        
        setNewComment("");
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to post comment",
            variant: "destructive"
        });
    } finally {
        setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
        <ScrollArea className="flex-1 pr-4">
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 font-mono text-sm">
                    No comments yet. Be the first to say something!
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 text-sm">
                            <Avatar className="h-8 w-8 border border-foreground">
                                <AvatarImage src={comment.user.avatar} />
                                <AvatarFallback className="bg-primary/20 font-bold text-xs">{comment.user.name.substring(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold font-mono">{comment.user.name}</span>
                                    <span className="text-xs text-muted-foreground font-mono">{format(new Date(comment.created_at), "MMM d, h:mm a")}</span>
                                </div>
                                <div className="bg-secondary/10 p-3 rounded-md border border-foreground/10 font-mono text-xs leading-relaxed">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>
            )}
        </ScrollArea>
        <div className="pt-4 mt-auto border-t-2 border-foreground/10 flex gap-2">
            <Textarea 
                placeholder="Type your comment..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[40px] h-[40px] resize-none font-mono text-xs border-2 border-foreground focus-visible:ring-0 focus-visible:border-primary"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />
            <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={sending || !newComment.trim()}
                className="h-[40px] w-[40px] border-2 border-foreground shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-px active:translate-y-px active:shadow-none transition-all"
            >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </div>
    </div>
  );
}
