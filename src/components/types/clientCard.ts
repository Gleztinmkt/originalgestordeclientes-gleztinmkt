import { Client, ClientInfo } from "../types/client";
import { Task } from "../TaskList";

export interface ClientCardProps {
  client: Client;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (id: string, data: any) => void;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
  tasks: Task[];
  onAddTask: (content: string, clientId?: string) => void;
  onDeleteTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  viewMode: "list" | "grid" | "calendar";
  index: number;
}

export interface CardHeaderProps {
  client: Client;
  viewMode: "list" | "grid" | "calendar";
  onUpdateClientInfo: (clientId: string, info: ClientInfo) => void;
  onDeleteClient: () => void;
  onUpdateClient: (id: string, data: any) => void;
  onAddPackage: (clientId: string, packageData: any) => void;
  isExpanded?: boolean;
  onClose?: () => void;
}