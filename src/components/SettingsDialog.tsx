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
import { Settings, Moon, Sun, Monitor, Calculator, MessageSquare, RotateCcw, Smartphone, Share, Plus, SquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGame } from '@/contexts/GameContext';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isFirstTime?: boolean;
}

// Store the install prompt globally
let deferredPrompt: any = null;

// Listen for the beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

const SettingsDialog = ({ open, onOpenChange, isFirstTime = false }: SettingsDialogProps) => {
  const { settings, updateSettings, setFirstTimeComplete } = useSettings();
  const { resetGame } = useGame();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  // Check if we can show install prompt
  useState(() => {
    setCanInstall(!!deferredPrompt);
  });

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        setCanInstall(false);
      }
    } else {
      setShowInstallGuide(!showInstallGuide);
    }
  };

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
                : "مثال: على المشتري أن يتعادل بالأبناط على الأقل حتى ينجح المشترى"
              }
            </p>
          </div>

          {/* Install App Guide Button */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full gap-2" 
              onClick={handleInstallClick}
            >
              <Smartphone className="h-4 w-4" />
              حفظ التطبيق على الشاشة الرئيسية
            </Button>
            
            {showInstallGuide && (
              <div className="space-y-3 pt-2 text-sm">
                {/* Arabic Instructions */}
                <div className="space-y-2 border-b border-border/50 pb-3">
                  <p className="font-medium text-xs text-muted-foreground">للآيفون (Safari):</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span className="flex items-center gap-1">اضغط على زر المشاركة <Share className="h-3 w-3 inline" /> (أسفل الشاشة)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span className="flex items-center gap-1">اسحب القائمة للأسفل واختر "إضافة إلى الشاشة الرئيسية" <SquarePlus className="h-3 w-3 inline" /></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">3</span>
                      <span>اضغط "إضافة"</span>
                    </div>
                  </div>
                </div>
                
                {/* English Instructions */}
                <div className="space-y-2" dir="ltr">
                  <p className="font-medium text-xs text-muted-foreground">For iPhone (Safari):</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span className="flex items-center gap-1">Tap the Share button <Share className="h-3 w-3 inline" /> (bottom of screen)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span className="flex items-center gap-1">Scroll down and tap "Add to Home Screen" <SquarePlus className="h-3 w-3 inline" /></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">3</span>
                      <span>Tap "Add"</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
