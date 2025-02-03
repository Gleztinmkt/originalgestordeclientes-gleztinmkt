import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface MonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const MonthSelector = ({ selectedDate, onDateChange }: MonthSelectorProps) => {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
      <Button
        variant="ghost"
        onClick={() => onDateChange(subMonths(selectedDate, 1))}
        className="hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <h2 className="text-2xl font-bold capitalize">
        {format(selectedDate, 'MMMM yyyy', { locale: es })}
      </h2>
      
      <Button
        variant="ghost"
        onClick={() => onDateChange(addMonths(selectedDate, 1))}
        className="hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};