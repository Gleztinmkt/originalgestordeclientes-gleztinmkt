import { Task } from "../TaskList";
import { Client } from "../types/client";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ClientCardProps {
  client: Client;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, data: any) => void;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
  tasks: Task[];
  onAddTask: (content: string, clientId?: string) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export const ClientCard = ({ 
  client, 
  onDeleteClient, 
  onUpdateClient,
  onUpdatePackage,
  onAddPackage,
  tasks,
  onAddTask,
  onDeleteTask,
  onCompleteTask,
  onUpdateTask
}: ClientCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{client.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Phone: {client.phone}</p>
          <p className="text-sm text-muted-foreground">Payment Day: {client.paymentDay}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onUpdateClient(client.id, client)}
          >
            Update
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => onDeleteClient(client.id)}
          >
            Delete
          </Button>
        </div>
        {/* Client Tasks */}
        <div className="space-y-2">
          <h3 className="font-medium">Tasks</h3>
          {tasks
            .filter(task => task.clientId === client.id)
            .map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                <span>{task.content}</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onCompleteTask(task.id)}
                  >
                    Complete
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onUpdateTask(task.id, { content: task.content })}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};