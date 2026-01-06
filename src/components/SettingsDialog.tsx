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
import { Settings, Moon, Sun, Calculator, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFirstTime?: boolean;
}

const SettingsDialog = ({ open, onOpenChange, isFirstTime = false }: SettingsDialogProps) => {
  const { settings, updateSettings, setFirstTimeComplete } = useSettings();

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

        <div className="space-y-6 py-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div className="space-y-1">
                <Label htmlFor="dark-mode" className="font-medium">
                  المظهر
                </Label>
                <p className="text-xs text-muted-foreground">
                  {settings.darkMode ? 'الوضع الليلي' : 'الوضع النهاري'}
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSettings({ darkMode: checked })}
            />
          </div>

          {/* Miya Popup Toggle */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <Label htmlFor="miya-popup" className="font-medium">
                  تأكيد مشروع المية
                </Label>
                <p className="text-xs text-muted-foreground">
                  سؤال الخصم عن مضاعفة المية في ×3 و ×4
                </p>
              </div>
            </div>
            <Switch
              id="miya-popup"
              checked={settings.showMiyaPopup}
              onCheckedChange={(checked) => updateSettings({ showMiyaPopup: checked })}
            />
          </div>

          {/* Hokm Without Points Mode */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-primary" />
              <div className="space-y-1">
                <Label htmlFor="hokm-mode" className="font-medium">
                  حكم عادي بدون أبناط
                </Label>
                <p className="text-xs text-muted-foreground">
                  تقريب النتيجة للعشرات (76 → 8)
                </p>
              </div>
            </div>
            <Switch
              id="hokm-mode"
              checked={settings.hokmWithoutPointsMode}
              onCheckedChange={(checked) => updateSettings({ hokmWithoutPointsMode: checked })}
            />
          </div>

          {/* Explanation for Hokm mode */}
          {settings.hokmWithoutPointsMode && (
            <div className="p-3 rounded-lg bg-primary/10 text-sm space-y-2">
              <p className="font-medium text-primary">شرح التقريب:</p>
              <ul className="text-muted-foreground space-y-1 pr-4 list-disc">
                <li>76 أبناط → 8 (لأن 6 أكبر من 5)</li>
                <li>85 أبناط → 8 (لأن 5 يُكسر)</li>
                <li>86 + سرا (2) → 9 (88 ÷ 10 → 9)</li>
              </ul>
            </div>
          )}
        </div>

        <Button onClick={handleComplete} className="w-full">
          {isFirstTime ? 'ابدأ' : 'حفظ'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
