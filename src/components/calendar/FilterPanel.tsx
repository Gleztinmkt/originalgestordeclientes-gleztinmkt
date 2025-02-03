import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export const FilterPanel = ({ onMonthChange }: { onMonthChange: (date: Date) => void }) => {
  const [date, setDate] = useState<Date>(new Date());

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setDate(date);
      onMonthChange(date);
    }
  };

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={handleSelect}
        className="rounded-md border"
      />
    </div>
  );
};