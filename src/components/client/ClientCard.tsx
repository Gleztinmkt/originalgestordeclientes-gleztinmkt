import { Task } from "../TaskList";
import { Client } from "../types/client";

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
    <div className="border p-4 rounded-md shadow-md">
      <h2 className="text-lg font-bold">{client.name}</h2>
      <p>Phone: {client.phone}</p>
      <p>Payment Day: {client.paymentDay}</p>
      <div className="mt-4">
        <button onClick={() => onUpdateClient(client.id, client)}>Update</button>
        <button onClick={() => onDeleteClient(client.id)}>Delete</button>
      </div>
      {/* Render tasks related to this client */}
      <div className="mt-4">
        {tasks.filter(task => task.clientId === client.id).map(task => (
          <div key={task.id} className="border-b py-2">
            <span>{task.content}</span>
            <button onClick={() => onCompleteTask(task.id)}>Complete</button>
            <button onClick={() => onDeleteTask(task.id)}>Delete</button>
            <button onClick={() => onUpdateTask(task.id, { content: task.content })}>Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
};
