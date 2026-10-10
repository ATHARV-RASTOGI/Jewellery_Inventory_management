import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  const options: { id: Theme; label: string; description: string; icon: React.ElementType }[] = [
    {
      id: "light",
      label: "Light Theme",
      description: "Crisp white workstation with high contrast for bright rooms.",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark Studio",
      description: "Deep neutral dark palette with low-glare surface elevation.",
      icon: Moon,
    },
    {
      id: "system",
      label: "System Preference",
      description: "Automatically matches your operating system appearance.",
      icon: Laptop,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {options.map(({ id, label, description, icon: Icon }) => {
        const isSelected = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className={cn(
              "flex flex-col text-left p-3.5 rounded-md border transition-colors relative select-none cursor-pointer",
              isSelected
                ? "bg-surface-2 border-primary shadow-xs"
                : "bg-surface border-border hover:border-border/80 hover:bg-surface-2/60"
            )}
          >
            {isSelected && (
              <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}

            <div
              className={cn(
                "w-7.5 h-7.5 rounded-sm flex items-center justify-center mb-2.5 border",
                isSelected
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-surface-2 text-muted-foreground border-border/50"
              )}
            >
              <Icon className="w-4 h-4" />
            </div>

            <p className="text-sm font-semibold text-foreground tracking-tight">
              {label}
            </p>
            <p className="text-[11.5px] text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
