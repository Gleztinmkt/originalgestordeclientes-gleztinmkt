import { useState, useEffect } from "react";
import { TaskInput } from "@/components/TaskInput";
import { TaskList, Task } from "@/components/TaskList";
import { analyzeTask } from "@/lib/task-analyzer";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (content: string) => {
    const analysis = analyzeTask(content);
    const newTask: Task = {
      id: crypto.randomUUID(),
      content,
      ...analysis,
    };

    setTasks((prev) => [newTask, ...prev]);

    // Mostrar sugerencias basadas en el tipo de tarea
    if (analysis.type === "meeting" && analysis.date) {
      toast({
        title: "¿Agregar al calendario?",
        description: `¿Quieres agregar la reunión del ${analysis.date} a tu calendario?`,
        action: (
          <button
            onClick={() => {
              // Aquí iría la lógica para agregar al calendario
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
    } else if (analysis.type === "call") {
      toast({
        title: "Contacto detectado",
        description: "¿Quieres agregar este contacto a tu agenda?",
        action: (
          <button
            onClick={() => {
              // Aquí iría la lógica para agregar contactos
              toast({
                title: "Contacto guardado",
                description: "El contacto ha sido agregado a tu agenda.",
              });
            }}
            className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm font-medium"
          >
            Guardar
          </button>
        ),
      });
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast({
      title: "Tarea eliminada",
      description: "La tarea ha sido eliminada exitosamente.",
    });
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Asistente Personal
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Organiza tus tareas de forma inteligente. Usa el micrófono o escribe
          para agregar nuevas tareas.
        </p>
      </div>

      <TaskInput onAddTask={handleAddTask} />

      <div className="mt-8">
        <TaskList tasks={tasks} onDeleteTask={handleDeleteTask} />
      </div>
    </div>
  );
};

export default Index;