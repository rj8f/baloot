import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import ScoreBoard from './ScoreBoard';
import AddRound from './AddRound';
import RoundHistory from './RoundHistory';
import WinnerModal from './WinnerModal';
import SettingsDialog from './SettingsDialog';

import MatchHistory from './MatchHistory';
import { RotateCcw, History, Calculator, Home, Settings, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const GameDashboard = () => {
  const { game, resetGame, switchToSimple, goToSelection } = useGame();
  const { settings, toggleMute } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  if (!game) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div></div>
          <div className="flex items-center gap-1">
            
            {/* Match History Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" title="سجل المباريات">
                  <History className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>سجل المباريات</SheetTitle>
                </SheetHeader>
              <div className="mt-4 overflow-auto h-full pb-8">
                <MatchHistory expandedByDefault />
              </div>
              </SheetContent>
            </Sheet>
            
            {/* زر كتم الصوت */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              title={settings.isMuted ? "تفعيل الصوت" : "كتم الصوت"}
            >
              {settings.isMuted ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            {/* زر الإعدادات */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(true)}
              title="الإعدادات"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* زر التبديل للحاسبة المختصرة */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={switchToSimple}
              title="الحاسبة المختصرة"
            >
              <Calculator className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={goToSelection} title="الرئيسية">
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Score Board */}
        <ScoreBoard />

        {/* Add Round */}
        <AddRound />

        {/* Round History */}
        <RoundHistory />

        {/* Winner Modal */}
        <WinnerModal />
        
        {/* Settings Dialog */}
        <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      </div>
    </div>
  );
};

export default GameDashboard;
