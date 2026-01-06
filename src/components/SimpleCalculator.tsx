import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, RotateCcw, Home, History, Trophy, Crown, Star, Calculator, Volume2, VolumeX, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MatchHistory from './MatchHistory';
import SettingsDialog from './SettingsDialog';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { useGame, SimpleHistoryEntry } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Round } from '@/types/baloot';

interface SimpleCalculatorProps {
  onBack: () => void;
}

interface RoundEntry {
  id: string;
  team1: number;
  team2: number;
}

// تحويل الأرقام العربية إلى إنجليزية
const arabicToEnglish = (str: string): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  arabicDigits.forEach((digit, index) => {
    result = result.replace(new RegExp(digit, 'g'), index.toString());
  });
  return result;
};

const SimpleCalculator = ({ onBack }: SimpleCalculatorProps) => {
  const { 
    game, 
    setScores, 
    startSimpleMode, 
    resetGame, 
    calculatorMode,
    switchToAdvanced,
    simpleHistory,
    addSimpleHistoryEntry,
    getUnifiedHistory,
    undoLast,
  } = useGame();
  const { settings, toggleMute } = useSettings();
  
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // تهيئة اللعبة عند الفتح
  useEffect(() => {
    if (calculatorMode !== 'simple') {
      startSimpleMode();
    }
  }, []);

  const team1Score = game?.team1Score ?? 0;
  const team2Score = game?.team2Score ?? 0;
  const winner = game?.winner ?? null;
  const WINNING_SCORE = 152;

  const [team1Input, setTeam1Input] = useState('');
  const [team2Input, setTeam2Input] = useState('');
  const [arrowRotation, setArrowRotation] = useState(0);

  const handleInputChange = (value: string, setter: (val: string) => void) => {
    const converted = arabicToEnglish(value);
    const cleaned = converted.replace(/[^0-9]/g, '');
    setter(cleaned);
  };

  const rotateArrow = () => {
    setArrowRotation(prev => prev - 90);
  };

  // Check for winner and trigger celebration
  useEffect(() => {
    if (winner) {
      const colors = winner === 1 
        ? ['#3b82f6', '#60a5fa', '#93c5fd']
        : ['#f43f5e', '#fb7185', '#fda4af'];

      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors,
      });

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
  }, [winner]);

  // دالة الإعلان الصوتي
  const announceScore = (score1: number, score2: number) => {
    if (settings.isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const announcement = `لنا ${score1}، لهم ${score2}`;
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.2;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arabicVoice) utterance.voice = arabicVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddPoints = () => {
    const t1 = parseInt(team1Input) || 0;
    const t2 = parseInt(team2Input) || 0;
    
    if (t1 === 0 && t2 === 0) return;
    
    const newEntry = {
      id: crypto.randomUUID(),
      team1: t1,
      team2: t2,
    };
    
    const newTeam1Score = team1Score + t1;
    const newTeam2Score = team2Score + t2;
    
    // تحديث النتيجة عبر GameContext
    setScores(newTeam1Score, newTeam2Score);
    addSimpleHistoryEntry(newEntry);
    setTeam1Input('');
    setTeam2Input('');
    rotateArrow();
    
    // إعلان النتيجة صوتياً
    announceScore(newTeam1Score, newTeam2Score);
  };

  const unifiedHistory = getUnifiedHistory();

  const handleUndo = () => {
    setShowUndoConfirm(true);
  };

  const saveAndReset = async () => {
    // حفظ المباراة إذا كان هناك نقاط (فقط إذا لم يحفظ تلقائياً)
    if ((team1Score > 0 || team2Score > 0) && !winner) {
      try {
        await supabase.from('games').insert([{
          team1_name: 'لنا',
          team2_name: 'لهم',
          team1_score: team1Score,
          team2_score: team2Score,
          winner: null,
          rounds: JSON.parse(JSON.stringify([...simpleHistory].reverse())),
          finished_at: new Date().toISOString(),
        }]);
      } catch (error) {
        console.error('Error saving game:', error);
      }
    }
    
    // إعادة تعيين
    resetGame();
    setTeam1Input('');
    setTeam2Input('');
    setArrowRotation(0);
    
    // إعادة تهيئة لعبة جديدة
    setTimeout(() => startSimpleMode(), 0);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* Winner Modal */}
      <Dialog open={winner !== null} onOpenChange={() => saveAndReset()}>
        <DialogContent className="text-center max-w-sm border-2 overflow-hidden">
          <div className={cn(
            "absolute inset-0 opacity-20 animate-pulse",
            winner === 1 
              ? "bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600" 
              : "bg-gradient-to-br from-rose-500 via-rose-400 to-rose-600"
          )} />
          
          <DialogHeader className="relative">
            <div className="flex justify-center mb-2">
              <div className={cn(
                "p-4 rounded-full",
                winner === 1 ? "bg-blue-500/20" : "bg-rose-500/20"
              )}>
                <Trophy className={cn(
                  "h-12 w-12 animate-bounce",
                  winner === 1 ? "text-blue-400" : "text-rose-400"
                )} />
              </div>
            </div>
            <DialogTitle className="text-2xl flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-amber-400" />
              <span>مبروك الفوز!</span>
              <Crown className="h-6 w-6 text-amber-400" />
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 relative">
            <div className={cn(
              "text-4xl font-bold mb-4 flex items-center justify-center gap-2",
              winner === 1 ? "text-blue-400" : "text-rose-400"
            )}>
              <Star className="h-6 w-6 fill-current" />
              {winner === 1 ? 'لنا' : 'لهم'}
              <Star className="h-6 w-6 fill-current" />
            </div>
            
            <div className={cn(
              "text-7xl font-bold mb-2 tabular-nums",
              winner === 1 ? "text-blue-400" : "text-rose-400"
            )}>
              {winner === 1 ? team1Score : team2Score}
            </div>
            
            <div className="text-muted-foreground text-lg">
              vs {winner === 1 ? team2Score : team1Score}
            </div>
          </div>

          <div className="flex gap-3 relative">
            <Button 
              onClick={saveAndReset} 
              className={cn(
                "flex-1 text-lg py-6 font-bold",
                winner === 1 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-rose-600 hover:bg-rose-700"
              )}
            >
              صكة جديدة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-background/80 backdrop-blur-sm">
        {/* Left: Home + New Game */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <Home className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={saveAndReset} className="h-9 w-9">
            <RotateCcw className="h-5 w-5" />
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
            onClick={switchToAdvanced}
          >
            <Calculator className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />

      {/* Scores Display */}
      <div className="flex-shrink-0 flex justify-center items-center gap-8 py-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">لنا</div>
          <div className="text-6xl font-bold">{team1Score}</div>
        </div>
        <button 
          onClick={rotateArrow}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowUp 
            className="h-8 w-8 text-muted-foreground transition-transform duration-300" 
            style={{ transform: `rotate(${arrowRotation}deg)` }}
          />
        </button>
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">لهم</div>
          <div className="text-6xl font-bold">{team2Score}</div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="flex-shrink-0 flex justify-center items-center gap-4 py-6 px-4">
        {/* Team 1 Input - لنا */}
        <Input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={team1Input}
          onChange={(e) => handleInputChange(e.target.value, setTeam1Input)}
          placeholder="لنا"
          className="w-24 h-16 text-center text-2xl font-bold"
        />

        {/* Calculate Button */}
        <button
          onClick={handleAddPoints}
          disabled={!team1Input && !team2Input}
          className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          احسب
        </button>

        {/* Team 2 Input - لهم */}
        <Input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          value={team2Input}
          onChange={(e) => handleInputChange(e.target.value, setTeam2Input)}
          placeholder="لهم"
          className="w-24 h-16 text-center text-2xl font-bold"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex justify-center items-center py-4">
        <Button variant="outline" onClick={handleUndo} disabled={unifiedHistory.length === 0}>
          تراجع
        </Button>
      </div>

      {/* History - موحد بترتيب زمني */}
      <div className="flex-1 overflow-auto min-h-0 border-t border-border">
        <div className="max-w-sm mx-auto">
          {unifiedHistory.map((item, index) => {
            if (item.type === 'simple') {
              const entry = item.entry as SimpleHistoryEntry;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-center gap-4 py-3 border-b border-border/50"
                >
                  <span className="text-xs text-muted-foreground w-8">#{unifiedHistory.length - index}</span>
                  <span className="text-blue-400 font-bold text-xl tabular-nums">{entry.team1}</span>
                  <span className="text-muted-foreground text-lg">-</span>
                  <span className="text-rose-400 font-bold text-xl tabular-nums">{entry.team2}</span>
                </div>
              );
            } else {
              const round = item.entry as Round;
              return (
                <div
                  key={round.id}
                  className="flex items-center justify-center gap-4 py-3 border-b border-border/50"
                >
                  <span className="text-xs text-muted-foreground w-8">#{unifiedHistory.length - index}</span>
                  <span className="text-blue-400 font-bold text-xl tabular-nums">{round.finalTeam1Points}</span>
                  <span className="text-muted-foreground text-lg">-</span>
                  <span className="text-rose-400 font-bold text-xl tabular-nums">{round.finalTeam2Points}</span>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* تأكيد التراجع */}
      <Dialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <DialogContent className="max-w-xs p-4" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center text-base">حذف؟</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUndoConfirm(false)}
              className="py-5 text-lg font-bold"
            >
              لا
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                undoLast();
                setShowUndoConfirm(false);
              }}
              className="py-5 text-lg font-bold"
            >
              نعم
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimpleCalculator;
