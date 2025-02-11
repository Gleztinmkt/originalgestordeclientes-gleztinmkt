
import { TabsContent } from "@/components/ui/tabs";
import { ClientForm } from "@/components/ClientForm";
import { ClientList } from "@/components/ClientList";
import { TaskFilter } from "@/components/TaskFilter";
import { TaskInput } from "@/components/TaskInput";
import { TaskList } from "@/components/TaskList";
import { PlanningCalendar } from "@/components/planning/PlanningCalendar";
import { CalendarView } from "@/components/calendar/CalendarView";
import { Client } from "@/components/types/client";
import { Task } from "@/components/TaskList";

interface MainContentProps {
  userRole: string | null;
  clients: Client[];
  tasks: Task[];
  filteredTasks: Task[];
  selectedType: string | null;
  selectedClientId: string | null;
  onAddClient: (client: any) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
  onUpdatePackage: (clientId: string, packageId: string, usedPublications: number) => Promise<void>;
  onAddPackage: (clientId: string, packageData: any) => Promise<void>;
  onAddTask: (content: string, clientId?: string, type?: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onCompleteTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onFilterChange: (type: string | null, clientId: string | null) => void;
}

export const MainContent = ({
  userRole,
  clients,
  tasks,
  filteredTasks,
  selectedType,
  selectedClientId,
  onAddClient,
  onDeleteClient,
  onUpdateClient,
  onUpdatePackage,
  onAddPackage,
  onAddTask,
  onDeleteTask,
  onCompleteTask,
  onUpdateTask,
  onFilterChange,
}: MainContentProps) => {
  return (
    <>
      {userRole === 'admin' && (
        <>
          <TabsContent value="clients" className="space-y-4">
            <ClientForm onAddClient={onAddClient} />
            <ClientList 
              clients={clients} 
              onDeleteClient={onDeleteClient}
              onUpdateClient={onUpdateClient}
              onUpdatePackage={onUpdatePackage}
              onAddPackage={onAddPackage}
              tasks={tasks}
              onAddTask={onAddTask}
              onDeleteTask={onDeleteTask}
              onCompleteTask={onCompleteTask}
              onUpdateTask={onUpdateTask}
            />
          </TabsContent>
          <TabsContent value="tasks" className="space-y-4">
            <TaskFilter 
              clients={clients}
              onFilterChange={onFilterChange}
            />
            <TaskInput 
              onAddTask={onAddTask}
              clients={clients}
            />
            <TaskList 
              tasks={filteredTasks}
              onDeleteTask={onDeleteTask}
              onCompleteTask={onCompleteTask}
              onUpdateTask={onUpdateTask}
              clients={clients}
            />
          </TabsContent>
          <TabsContent value="planning">
            <PlanningCalendar clients={clients} />
          </TabsContent>
        </>
      )}
      <TabsContent value="calendar">
        <CalendarView clients={clients} />
      </TabsContent>
    </>
  );
};
