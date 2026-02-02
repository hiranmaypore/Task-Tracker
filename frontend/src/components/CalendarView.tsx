import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: string;
}

interface CalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function CalendarView({ tasks, onEditTask }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
           case "HIGH": return "bg-red-200 border-red-400 text-red-900";
           case "MEDIUM": return "bg-yellow-200 border-yellow-400 text-yellow-900";
           case "LOW": return "bg-blue-200 border-blue-400 text-blue-900";
           default: return "bg-gray-200 border-gray-400 text-gray-900";
        }
    };

    return (
        <Card className="p-6 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] bg-card">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="font-pixel text-2xl uppercase">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 border-2 border-foreground">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 border-2 border-foreground">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                         <Button variant="outline" size="sm" onClick={goToToday} className="h-8 border-2 border-foreground font-mono font-bold text-xs uppercase">
                            Today
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-foreground/20 border-2 border-foreground">
                {weekDays.map(day => (
                    <div key={day} className="bg-secondary/20 p-2 text-center font-mono font-bold uppercase text-xs">
                        {day}
                    </div>
                ))}
                
                {days.map((day) => {
                    const dayTasks = tasks.filter(task => 
                        task.due_date && isSameDay(new Date(task.due_date), day)
                    );

                    return (
                        <div 
                            key={day.toString()} 
                            className={`min-h-[120px] bg-background p-2 transition-colors hover:bg-muted/50 flex flex-col gap-1
                                ${!isSameMonth(day, monthStart) ? "opacity-40" : ""}
                                ${isToday(day) ? "bg-primary/5" : ""}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`font-mono text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                                     ${isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"}
                                `}>
                                    {format(day, dateFormat)}
                                </span>
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[100px] scrollbar-hide">
                                {dayTasks.map(task => (
                                    <div 
                                        key={task.id}
                                        onClick={() => onEditTask(task)}
                                        className={`text-[10px] font-mono p-1 rounded border cursor-pointer truncate hover:opacity-80 transition-opacity ${getPriorityColor(task.priority)} ${task.status === 'DONE' ? 'opacity-50 line-through' : ''}`}
                                    >
                                       <div className="flex items-center justify-between">
                                            <span className="truncate flex-1">{task.title}</span>
                                       </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
