import * as React from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageToggle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div ref={ref} className={className} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Languages className="h-5 w-5" />
            <span className="sr-only">Toggle language</span>
            <span className="absolute -bottom-0.5 -right-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded px-1">
              {language.toUpperCase()}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border border-border">
          <DropdownMenuItem 
            onClick={() => setLanguage("en")}
            className={language === "en" ? "bg-primary/10 text-primary" : ""}
          >
            🇺🇸 English
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setLanguage("bn")}
            className={language === "bn" ? "bg-primary/10 text-primary" : ""}
          >
            🇧🇩 বাংলা
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

LanguageToggle.displayName = "LanguageToggle";
