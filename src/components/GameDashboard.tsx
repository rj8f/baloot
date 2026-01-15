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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const GameDashboard = () => {
  const { game, resetGameKeepMode, switchToSimple, goToSelection } = useGame();
  const { settings, toggleMute } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [scorePreview, setScorePreview] = useState<{ team1: number; team2: number } | null>(null);

  if (!game) return null;

  const saveAndReset = () => {
    // إعادة تعيين مع الحفاظ على نوع الحاسبة
    resetGameKeepMode();
  };

  if (!game) return null;

  return (
    <div className="h-screen bg-background pb-8 relative overflow-hidden flex flex-col fixed inset-0 pt-[env(safe-area-inset-top)]">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-team-start/5 to-transparent blur-3xl animate-float" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 rounded-full bg-gradient-to-br from-team-end/5 to-transparent blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-radial from-team-start/3 to-transparent blur-3xl animate-pulse-soft" />
      </div>
      
      <div className="max-w-lg mx-auto relative z-10 flex-1 overflow-auto">
        {/* Header with glass effect */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-background/60 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
        {/* Left: Home + New Game */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={goToSelection} className="h-9 w-9">
            <Home className="h-5 w-5" />
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowNewGameConfirm(true)} 
            className="h-9 px-3 text-sm shadow-md hover:shadow-lg transition-shadow"
          >
            صكة جديدة
          </Button>
        </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              onClick={toggleMute}
            >
              {settings.isMuted ? (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <History className="h-5 w-5" />
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
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              onClick={switchToSimple}
            >
              <Calculator className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Score Board */}
        <ScoreBoard 
          previewTeam1={scorePreview?.team1} 
          previewTeam2={scorePreview?.team2} 
        />

        {/* Add Round */}
        <AddRound onPreviewChange={setScorePreview} />

        {/* Round History */}
        <RoundHistory />

        {/* Winner Modal */}
        <WinnerModal />
        
        {/* Settings Dialog */}
        <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />

        {/* تأكيد صكة جديدة */}
        <Dialog open={showNewGameConfirm} onOpenChange={setShowNewGameConfirm}>
          <DialogContent className="max-w-xs p-4" dir="rtl">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-center text-base">صكة جديدة؟</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewGameConfirm(false)}
                className="py-5 text-lg font-bold"
              >
                لا
              </Button>
              <Button
                onClick={() => {
                  saveAndReset();
                  setShowNewGameConfirm(false);
                }}
                className="py-5 text-lg font-bold"
              >
                نعم
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GameDashboard;
