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
import { Settings, Moon, Sun, Calculator, MessageSquare, RotateCcw } from 'lucide-react';
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
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
              <Label htmlFor="dark-mode" className="text-sm">المظهر</Label>
            </div>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
            />
          </div>

          {/* Miya Follows Multiplier Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">×2</span>
              <Label htmlFor="miya-double" className="text-sm">المية حسب الدبل</Label>
            </div>
            <Switch
              id="miya-double"
              checked={settings.miyaFollowsMultiplier}
              onCheckedChange={(checked) => updateSettings({ miyaFollowsMultiplier: checked })}
            />
          </div>

          {/* Hokm Without Points Mode */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <Label htmlFor="hokm-mode" className="text-sm">بدون أبناط</Label>
            </div>
            <Switch
              id="hokm-mode"
              checked={settings.hokmWithoutPointsMode}
              onCheckedChange={(checked) => updateSettings({ hokmWithoutPointsMode: checked })}
            />
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
