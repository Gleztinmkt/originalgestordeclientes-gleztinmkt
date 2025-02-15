import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
export const ThemeToggle = () => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  return <Button variant="ghost" size="icon" onClick={toggleTheme} className="fixed top-4 right-4 py-0 my-[46px]">
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>;
};