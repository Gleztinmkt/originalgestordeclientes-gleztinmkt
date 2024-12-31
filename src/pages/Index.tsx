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
      clientId: analysis.clientId || null,
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

  const handleAddClient = (clientData: any) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: clientData.name,
      phone: clientData.phone,
      paymentDay: parseInt(clientData.nextPayment),
      marketingInfo: clientData.marketingInfo,
      instagram: clientData.instagram || "",
      facebook: clientData.facebook || "",
      packages: [{
        id: crypto.randomUUID(),
        name: "Paquete Inicial",
        totalPublications: parseInt(clientData.publications),
        usedPublications: 0,
        month: clientData.packageMonth,
        paid: false
      }]
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
    // Also delete associated tasks
    setTasks((prev) => prev.filter((task) => task.clientId !== id));
    toast({
      title: "Cliente eliminado",
      description: "El cliente ha sido eliminado exitosamente.",
    });
  };

  const handleUpdatePackage = (clientId: string, packageId: string, usedPublications: number) => {
    setClients(prev => prev.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          packages: client.packages.map(pkg => {
            if (pkg.id === packageId) {
              return {
                ...pkg,
                usedPublications
              };
            }
            return pkg;
          })
        };
      }
      return client;
    }));
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold font-heading text-gray-900">
          Gestor de clientes Gleztin Marketing Digital
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Gestiona tus clientes y tareas de forma eficiente
        </p>
      </div>

      <Tabs defaultValue="clients" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="clients" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl data-[state=active]:bg-black data-[state=active]:text-white">
            Tareas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="space-y-4 mt-6">
          <ClientForm onAddClient={handleAddClient} />
          <ClientList 
            clients={clients} 
            onDeleteClient={handleDeleteClient}
            onUpdatePackage={handleUpdatePackage}
          />
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4 mt-6">
          <TaskInput onAddTask={handleAddTask} />
          <TaskList 
            tasks={tasks} 
            onDeleteTask={handleDeleteTask}
            clients={clients}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;