import { useState, useEffect } from "react";
import { TaskInput } from "@/components/TaskInput";
import { TaskList, Task } from "@/components/TaskList";
import { ClientList, Client } from "@/components/ClientList";
import { ClientForm } from "@/components/ClientForm";
import { analyzeTask } from "@/lib/task-analyzer";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const savedClients = localStorage.getItem("clients");
    return savedClients ? JSON.parse(savedClients) : [];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("clients", JSON.stringify(clients));
  }, [clients]);

  const handleAddTask = (content: string) => {
    const analysis = analyzeTask(content);
    const newTask: Task = {
      id: crypto.randomUUID(),
      content,
      ...analysis,
    };

    setTasks((prev) => [newTask, ...prev]);

    if (analysis.type === "meeting" && analysis.date) {
      toast({
        title: "¿Agregar al calendario?",
        description: `¿Quieres agregar la reunión del ${analysis.date} a tu calendario?`,
        action: (
          <button
            onClick={() => {
              toast({
                title: "Recordatorio agregado",
                description: "La reunión ha sido agregada a tu calendario.",
              });
            }}
            className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium"
          >
            Agregar
          </button>
        ),
      });
    }
  };

  const handleAddClient = (clientData: Omit<Client, "id">) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...clientData,
    };
    setClients((prev) => [newClient, ...prev]);
    toast({
      title: "Cliente agregado",
      description: "El cliente ha sido agregado exitosamente.",
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast({
      title: "Tarea eliminada",
      description: "La tarea ha sido eliminada exitosamente.",
    });
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
    toast({
      title: "Cliente eliminado",
      description: "El cliente ha sido eliminado exitosamente.",
    });
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Asistente Personal
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Organiza tus tareas y gestiona tus clientes de forma inteligente.
        </p>
      </div>

      <Tabs defaultValue="tasks" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-4">
          <TaskInput onAddTask={handleAddTask} />
          <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} />
        </TabsContent>
        <TabsContent value="clients" className="space-y-4">
          <ClientForm onAddClient={handleAddClient} />
          <ClientList clients={clients} onDeleteClient={handleDeleteClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;