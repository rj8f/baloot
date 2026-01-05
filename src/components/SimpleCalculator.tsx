import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, RotateCcw, Home, History } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import MatchHistory from './MatchHistory';

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
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Input, setTeam1Input] = useState('');
  const [team2Input, setTeam2Input] = useState('');
  const [history, setHistory] = useState<RoundEntry[]>([]);
  const [arrowRotation, setArrowRotation] = useState(0);

  const handleInputChange = (value: string, setter: (val: string) => void) => {
    const converted = arabicToEnglish(value);
    const cleaned = converted.replace(/[^0-9]/g, '');
    setter(cleaned);
  };

  const rotateArrow = () => {
    setArrowRotation(prev => prev - 90);
  };

  const handleAddPoints = () => {
    const t1 = parseInt(team1Input) || 0;
    const t2 = parseInt(team2Input) || 0;
    
    if (t1 === 0 && t2 === 0) return;
    
    const newEntry: RoundEntry = {
      id: crypto.randomUUID(),
      team1: t1,
      team2: t2,
    };
    
    const newTeam1Score = team1Score + t1;
    const newTeam2Score = team2Score + t2;
    
    setTeam1Score(newTeam1Score);
    setTeam2Score(newTeam2Score);
    setHistory(prev => [newEntry, ...prev]);
    setTeam1Input('');
    setTeam2Input('');
    rotateArrow();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastEntry = history[0];
    setTeam1Score(prev => prev - lastEntry.team1);
    setTeam2Score(prev => prev - lastEntry.team2);
    setHistory(prev => prev.slice(1));
  };

  const saveAndReset = async () => {
    // حفظ المباراة إذا كان هناك نقاط
    if (team1Score > 0 || team2Score > 0) {
      const winner = team1Score >= 152 ? 1 : team2Score >= 152 ? 2 : null;
      try {
        await supabase.from('games').insert([{
          team1_name: 'لنا',
          team2_name: 'لهم',
          team1_score: team1Score,
          team2_score: team2Score,
          winner: winner,
          rounds: JSON.parse(JSON.stringify(history.reverse())),
          finished_at: new Date().toISOString(),
        }]);
      } catch (error) {
        console.error('Error saving game:', error);
      }
    }
    
    // إعادة تعيين
    setTeam1Score(0);
    setTeam2Score(0);
    setTeam1Input('');
    setTeam2Input('');
    setHistory([]);
    setArrowRotation(0);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <ThemeToggle />
        <div className="flex items-center gap-1">
          {/* Match History Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" title="سجل المباريات">
                <History className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>سجل المباريات</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-auto h-full pb-8">
                <MatchHistory />
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="icon" onClick={onBack}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </div>

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
      <div className="flex-shrink-0 flex justify-center items-center gap-4 py-4">
        <Button variant="outline" onClick={handleUndo} disabled={history.length === 0}>
          تراجع
        </Button>
        <Button variant="outline" onClick={saveAndReset}>
          <RotateCcw className="h-4 w-4 ml-2" />
          صكة جديدة
        </Button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-auto min-h-0 border-t border-border">
        {history.map((entry) => (
          <div key={entry.id} className="flex justify-between items-center px-8 py-3 border-b border-border/50">
            <span className="text-lg">{entry.team1}</span>
            <span className="text-lg">{entry.team2}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleCalculator;
