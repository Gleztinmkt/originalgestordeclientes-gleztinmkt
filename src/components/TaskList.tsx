import { Check, Clock, Trash2, Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

export interface Task {
  id: string;
  content: string;
  type: "campaña" | "publicaciones" | "correcciones" | "otros";
  date?: string;
  clientId?: string | null;
  executionDate?: Date;
  reminderDate?: Date;
  reminderFrequency?: string;
}

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  clients: Array<{
    id: string;
    name: string;
  }>;
}

export const TaskList = ({ tasks, onDeleteTask, onCompleteTask, clients }: TaskListProps) => {
  const getTaskIcon = (type: Task["type"]) => {
    switch (type) {
      case "campaña":
        return <Clock className="h-4 w-4" />;
      case "publicaciones":
        return <Check className="h-4 w-4" />;
      case "correcciones":
        return <Clock className="h-4 w-4" />;
      default:
        return <Check className="h-4 w-4" />;
    }
  };

  const getTaskColor = (type: Task["type"]) => {
    switch (type) {
      case "campaña":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "publicaciones":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      case "correcciones":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : null;
  };

  // Group tasks by client
  const groupedTasks = tasks.reduce((acc, task) => {
    const clientId = task.clientId || 'unassigned';
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedTasks).map(([clientId, clientTasks]) => (
        <div key={clientId} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {clientId === 'unassigned' ? 'Tareas sin asignar' : `Tareas de ${getClientName(clientId)}`}
          </h3>
          <div className="space-y-4">
            {clientTasks.map((task) => (
              <Card
                key={task.id}
                className="animate-fade-in hover:shadow-md transition-shadow dark:bg-gray-800"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-heading dark:text-white">
                    {task.content}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCompleteTask(task.id)}
                      className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTask(task.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className={getTaskColor(task.type)}>
                    <span className="flex items-center gap-1">
                      {getTaskIcon(task.type)}
                      {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                    </span>
                  </Badge>
                  {task.executionDate && (
                    <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(task.executionDate), "dd/MM/yyyy")}
                    </Badge>
                  )}
                  {task.reminderDate && (
                    <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">
                      <Bell className="mr-1 h-3 w-3" />
                      {format(new Date(task.reminderDate), "dd/MM/yyyy")}
                      {task.reminderFrequency && ` (${task.reminderFrequency})`}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};