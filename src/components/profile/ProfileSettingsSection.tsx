import { useState } from "react";
import { 
  User, Phone, MapPin, Mail, CreditCard, Shield, 
  ChevronRight, Bell, Lock, LogOut, HelpCircle,
  Sun, Moon, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SettingItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  value?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  onClick?: () => void;
  toggle?: boolean;
  toggled?: boolean;
  onToggle?: (value: boolean) => void;
}

interface SettingsGroup {
  title: string;
  items: SettingItem[];
}

interface ProfileSettingsSectionProps {
  groups: SettingsGroup[];
  onSignOut?: () => void;
}

export function ProfileSettingsSection({ groups, onSignOut }: ProfileSettingsSectionProps) {
  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <Card key={groupIndex} className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              {group.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {group.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  {itemIndex > 0 && <Separator className="mx-4" />}
                  <button
                    onClick={item.toggle ? undefined : item.onClick}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 transition-colors text-left",
                      !item.toggle && item.onClick && "hover:bg-muted/50 active:bg-muted"
                    )}
                    disabled={item.toggle}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br from-primary/10 to-accent/10"
                    )}>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge variant={item.badgeVariant || 'secondary'} className="text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </p>
                      )}
                      {item.value && (
                        <p className="text-sm text-muted-foreground truncate">
                          {item.value}
                        </p>
                      )}
                    </div>

                    {item.toggle ? (
                      <Switch 
                        checked={item.toggled} 
                        onCheckedChange={item.onToggle}
                      />
                    ) : item.onClick && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Sign Out Button */}
      {onSignOut && (
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <span className="font-medium text-destructive group-hover:text-destructive/80">
                Sair da conta
              </span>
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
