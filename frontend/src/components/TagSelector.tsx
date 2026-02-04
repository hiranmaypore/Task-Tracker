import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TaskTag {
  id: string;
  tag: Tag;
}

interface TagSelectorProps {
  taskId: string;
  projectId: string;
  selectedTags: TaskTag[];
  onTagsChange: () => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

export function TagSelector({ taskId, projectId, selectedTags, onTagsChange }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTags();
  }, [projectId]);

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/tags?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableTags(response.data);
    } catch (error) {
      console.error("Failed to fetch tags");
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_BASE_URL}/tags`, {
        projectId,
        name: newTagName,
        color: selectedColor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailableTags([...availableTags, response.data]);
      setNewTagName("");
      toast({ title: "Tag created" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create tag", variant: "destructive" });
    }
  };

  const assignTag = async (tagId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/tags/assign`, {
        taskId,
        tagId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onTagsChange();
    } catch (error) {
      toast({ title: "Error", description: "Failed to assign tag", variant: "destructive" });
    }
  };

  const unassignTag = async (tagId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/tags/unassign`, {
        data: { taskId, tagId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onTagsChange();
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove tag", variant: "destructive" });
    }
  };

  const selectedTagIds = selectedTags.map(t => t.tag.id);
  const unselectedTags = availableTags.filter(t => !selectedTagIds.includes(t.id));

  return (
    <div className="flex flex-wrap gap-2">
      {selectedTags.map((taskTag) => (
        <Badge
          key={taskTag.id}
          style={{ backgroundColor: taskTag.tag.color }}
          className="text-white border-0 pr-1 font-mono text-xs"
        >
          {taskTag.tag.name}
          <button
            onClick={() => unassignTag(taskTag.tag.id)}
            className="ml-1 hover:bg-white/20 rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 border-dashed font-mono text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 border-2 border-foreground bg-card p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase font-mono">Assign Tag</label>
              <div className="flex flex-wrap gap-2">
                {unselectedTags.length > 0 ? (
                  unselectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: tag.color }}
                      className="text-white cursor-pointer border-0 font-mono text-xs hover:opacity-80"
                      onClick={() => assignTag(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground font-mono">All tags assigned</p>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <label className="text-xs font-bold uppercase font-mono">Create New Tag</label>
              <div className="flex gap-2">
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="flex-1 h-8 font-mono text-xs border-2 border-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && createTag()}
                />
                <Button onClick={createTag} size="sm" className="h-8 border-2 border-foreground">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={`h-6 w-6 rounded border-2 ${selectedColor === color ? 'border-foreground' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
