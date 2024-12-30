interface AnalyzedTask {
  type: "reminder" | "call" | "meeting" | "task";
  date?: string;
}

export const analyzeTask = (content: string): AnalyzedTask => {
  const lowerContent = content.toLowerCase();
  
  // Detectar tipo de tarea
  if (lowerContent.includes("reunión") || lowerContent.includes("meeting")) {
    return { type: "meeting", date: extractDate(content) };
  }
  if (lowerContent.includes("llamar") || lowerContent.includes("llamada")) {
    return { type: "call" };
  }
  if (lowerContent.includes("recordar") || lowerContent.includes("recordatorio")) {
    return { type: "reminder", date: extractDate(content) };
  }
  
  return { type: "task" };
};

const extractDate = (content: string): string | undefined => {
  // Expresiones regulares para detectar fechas y horas
  const timeRegex = /(\d{1,2})[:\s]?(\d{2})?\s*(am|pm|AM|PM)?/;
  const dateRegex = /(\d{1,2})\s+de\s+([a-zA-Z]+)/;
  
  let date = undefined;
  
  // Buscar tiempo
  const timeMatch = content.match(timeRegex);
  if (timeMatch) {
    const hour = timeMatch[1];
    const minutes = timeMatch[2] || "00";
    const period = timeMatch[3]?.toLowerCase() || "";
    date = `${hour}:${minutes}${period ? ` ${period}` : ""}`;
  }
  
  // Buscar fecha
  const dateMatch = content.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1];
    const month = dateMatch[2];
    date = `${day} de ${month}`;
  }
  
  return date;
};