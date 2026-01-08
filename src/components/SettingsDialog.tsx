import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/contexts/SettingsContext';
import { Settings, Moon, Sun, Monitor, Calculator, MessageSquare, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGame } from '@/contexts/GameContext';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFirstTime?: boolean;
}

const SettingsDialog = ({ open, onOpenChange, isFirstTime = false }: SettingsDialogProps) => {
  const { settings, updateSettings, setFirstTimeComplete } = useSettings();
  const { resetGame } = useGame();

  const handleComplete = () => {
    if (isFirstTime) {
      setFirstTimeComplete();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 justify-end">
            <span>الإعدادات</span>
            <Settings className="h-5 w-5" />
          </DialogTitle>
          {isFirstTime && (
            <DialogDescription className="text-right">
              مرحباً! اختر الإعدادات المناسبة لك
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Theme Mode Selection */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              {settings.themeMode === 'dark' ? <Moon className="h-4 w-4" /> : 
               settings.themeMode === 'light' ? <Sun className="h-4 w-4" /> : 
               <Monitor className="h-4 w-4" />}
              <Label className="text-sm">المظهر</Label>
            </div>
            <div className="flex gap-1 p-1 bg-background/50 rounded-lg">
              <button
                onClick={() => updateSettings({ themeMode: 'dark' })}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1",
                  settings.themeMode === 'dark' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon className="h-3 w-3" />
                ليلي
              </button>
              <button
                onClick={() => updateSettings({ themeMode: 'light' })}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1",
                  settings.themeMode === 'light' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun className="h-3 w-3" />
                نهاري
              </button>
              <button
                onClick={() => updateSettings({ themeMode: 'auto' })}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1",
                  settings.themeMode === 'auto' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Monitor className="h-3 w-3" />
                تلقائي
              </button>
            </div>
          </div>

          {/* Project Multiplier Mode */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <Label className="text-sm">حسبة المشاريع في الثري والفور</Label>
            </div>
            <div className="flex gap-1 p-1 bg-background/50 rounded-lg">
              <button
                onClick={() => updateSettings({ projectMultiplierMode: 'all-x2' })}
                className={cn(
                  "flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all text-center",
                  settings.projectMultiplierMode === 'all-x2' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                الكل ×2
              </button>
              <button
                onClick={() => updateSettings({ projectMultiplierMode: 'miya-x2' })}
                className={cn(
                  "flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all text-center",
                  settings.projectMultiplierMode === 'miya-x2' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                المية بس x2
              </button>
              <button
                onClick={() => updateSettings({ projectMultiplierMode: 'full' })}
                className={cn(
                  "flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all text-center",
                  settings.projectMultiplierMode === 'full' 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                مع الـ x3 او الـ x4
              </button>
            </div>
          </div>

          {/* Hokm Calculation Mode */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <Label className="text-sm">حسبة الحكم</Label>
            </div>
            <div className="flex gap-1 p-1 bg-background/50 rounded-lg">
              <button
                onClick={() => updateSettings({ hokmWithoutPointsMode: false })}
                className={cn(
                  "flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all text-center",
                  !settings.hokmWithoutPointsMode 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                بالأبناط
              </button>
              <button
                onClick={() => updateSettings({ hokmWithoutPointsMode: true })}
                className={cn(
                  "flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all text-center",
                  settings.hokmWithoutPointsMode 
                    ? "bg-background shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                بدون أبناط
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {settings.hokmWithoutPointsMode 
                ? "مثال: إذا الحكم صافي والمشتري وصلت أبناطه 76 ياخذ 8 وتنجح"
                : "على المشتري أن يتعادل بالأبناط على الأقل حتى ينجح المشترى"
              }
            </p>
          </div>

          {/* Reset Game Button */}
          <Button 
            variant="destructive" 
            size="sm"
            className="w-full gap-2 mt-2" 
            onClick={() => {
              resetGame();
              onOpenChange(false);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            إعادة تعيين
          </Button>
        </div>

        <Button onClick={handleComplete} className="w-full">
          {isFirstTime ? 'ابدأ' : 'حفظ'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
