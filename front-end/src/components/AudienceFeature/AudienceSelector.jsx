import { useState } from "react";
import { Globe, Lock, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AUDIENCE_OPTIONS = [
  {
    value: "Public",
    label: "Public",
    description: "Anyone can see this post",
    icon: Globe,
  },
  {
    value: "Following",
    label: "Following",
    description: "Only people you follow",
    icon: Users,
  },
  {
    value: "OnlyMe",
    label: "Only Me",
    description: "Only you can see this",
    icon: Lock,
  },
];

const AudienceSelector = ({
  value = "Public",
  onChange,
  className,
  disabled = false,
}) => {
  const currentAudience =
    AUDIENCE_OPTIONS.find((opt) => opt.value === value) || AUDIENCE_OPTIONS[0];
  const CurrentIcon = currentAudience.icon;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
          disabled={disabled}
        >
          <CurrentIcon className="w-4 h-4" />
          <span>{currentAudience.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="start" className="w-64" sideOffset={5}>
          {AUDIENCE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  value === option.value && "bg-accent"
                )}
              >
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};
export const AudienceIcon = ({ audience, className }) => {
  const option = AUDIENCE_OPTIONS.find((opt) => opt.value === audience);
  if (!option) return null;

  const Icon = option.icon;
  return (
    <Icon
      className={cn("w-3.5 h-3.5 text-muted-foreground", className)}
      title={option.label}
    />
  );
};

export default AudienceSelector;
