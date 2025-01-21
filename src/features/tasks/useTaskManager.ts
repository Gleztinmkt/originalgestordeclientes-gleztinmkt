import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Task } from "@/components/types/task";
import { toast } from "@/hooks/use-toast";
import { convertTaskForDatabase, convertDatabaseTask, DatabaseTask } from "@/lib/database-types";

export const useTaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      console.log('Cargando tareas...');
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (tasksError) throw tasksError;

      if (tasksData) {
        console.log('Tareas cargadas:', tasksData);
        const formattedTasks = tasksData.map(task => convertDatabaseTask(task as DatabaseTask));
        console.log('Tareas formateadas:', formattedTasks);
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tareas. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (content: string, clientId?: string, type: string = 'otros', executionDate?: Date, reminderDate?: Date, reminderFrequency?: string) => {
    try {
      console.log('Agregando tarea:', { content, clientId, type, executionDate, reminderDate, reminderFrequency });
      const newTask: Task = {
        id: crypto.randomUUID(),
        content,
        type: type as Task['type'],
        clientId: clientId || null,
        executionDate,
        reminderDate,
        reminderFrequency,
        completed: false,
      };

      const dbTask = convertTaskForDatabase(newTask);
      console.log('Tarea formateada para la base de datos:', dbTask);
      const { error } = await supabase
        .from('tasks')
        .insert(dbTask);
      
      if (error) throw error;

      setTasks(prev => [newTask, ...prev]);
      toast({
        title: "Tarea agregada",
        description: "La tarea se ha guardado correctamente.",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      console.log('Actualizando tarea:', { id, updates });
      const dbUpdates = convertTaskForDatabase(updates as Task);
      console.log('Actualizaciones formateadas:', dbUpdates);
      
      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));

      toast({
        title: "Tarea actualizada",
        description: "La tarea se ha actualizado correctamente.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      // Recargar las tareas para asegurar consistencia
      await loadTasks();
    }
  };

  const deleteTask = async (id: string) => {
    try {
      console.log('Eliminando tarea:', id);
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido movida a la papelera.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      // Recargar las tareas para asegurar consistencia
      await loadTasks();
    }
  };

  const completeTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      console.log('Completando tarea:', { id, currentStatus: task.completed });
      const { error } = await supabase
        .from('tasks')
        .update({ 
          completed: !task.completed,
          deleted_at: null
        })
        .eq('id', id);
      
      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      ));

      toast({
        title: task.completed ? "Tarea pendiente" : "Tarea completada",
        description: task.completed ? "La tarea ha sido marcada como pendiente." : "La tarea ha sido marcada como completada.",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      // Recargar las tareas para asegurar consistencia
      await loadTasks();
    }
  };

  return {
    tasks,
    isLoading,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask
  };
};
