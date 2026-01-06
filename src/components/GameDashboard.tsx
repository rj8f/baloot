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
  const [scorePreview, setScorePreview] = useState<{ team1: number; team2: number } | null>(null);

  if (!game) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {/* Left: Home */}
          <Button variant="ghost" size="icon" onClick={goToSelection} className="h-9 w-9">
            <Home className="h-5 w-5" />
          </Button>
          
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
      </div>
    </div>
  );
};

export default GameDashboard;
