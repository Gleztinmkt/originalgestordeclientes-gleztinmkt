import { Calendar } from "@/components/ui/calendar";

interface FilterPanelProps {
  onMonthChange: (date: Date) => void;
}

export const FilterPanel = ({ onMonthChange }: FilterPanelProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <Calendar
          mode="single"
          onSelect={(date) => date && onMonthChange(date)}
          className="rounded-md"
        />
      </div>
    </div>
  );
};