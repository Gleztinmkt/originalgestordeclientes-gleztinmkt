import { Check, Clock, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";

export interface Task {
  id: string;
  content: string;
  type: "reminder" | "call" | "meeting" | "task";
  date?: string;
}

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
}

export const TaskList = ({ tasks, onDeleteTask }: TaskListProps) => {
  const getTaskIcon = (type: Task["type"]) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4" />;
      case "call":
        return <Check className="h-4 w-4" />;
      case "meeting":
        return <Clock className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  const getTaskColor = (type: Task["type"]) => {
    switch (type) {
      case "reminder":
        return "bg-yellow-100 text-yellow-800";
      case "call":
        return "bg-blue-100 text-blue-800";
      case "meeting":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="animate-fade-in hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-heading">
              {task.content}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteTask(task.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant="secondary" className={getTaskColor(task.type)}>
              <span className="flex items-center gap-1">
                {getTaskIcon(task.type)}
                {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
              </span>
            </Badge>
            {task.date && (
              <Badge variant="outline" className="ml-2">
                {task.date}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};