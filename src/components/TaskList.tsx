import { useEffect } from "react";
import { Task } from "@/components/TaskList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  clients: { id: string; name: string; }[];
  viewOnly?: boolean;
}

export const TaskList = ({ 
  tasks, 
  onDeleteTask, 
  onCompleteTask, 
  onUpdateTask, 
  clients,
  viewOnly = false 
}: TaskListProps) => {
  const handleDeleteTask = (id: string) => {
    onDeleteTask(id);
    toast({
      title: "Tarea eliminada",
      description: "La tarea ha sido eliminada correctamente.",
    });
  };

  const handleCompleteTask = (id: string) => {
    onCompleteTask(id);
    toast({
      title: "Tarea completada",
      description: "La tarea ha sido marcada como completada.",
    });
  };

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <Card key={task.id} className="flex justify-between items-center p-4">
          <CardContent>
            <div className="flex flex-col">
              <span className="font-semibold">{task.content}</span>
              <span className="text-sm text-gray-500">{task.type}</span>
            </div>
          </CardContent>
          <div className="flex items-center space-x-2">
            {!viewOnly && (
              <>
                <Button onClick={() => handleCompleteTask(task.id)}>Completar</Button>
                <Button onClick={() => handleDeleteTask(task.id)} variant="destructive">Eliminar</Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
