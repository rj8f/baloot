import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp, RotateCcw, Plus, Home } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface SimpleCalculatorProps {
  onBack: () => void;
}

interface RoundEntry {
  id: string;
  team1: number;
  team2: number;
}

const SimpleCalculator = ({ onBack }: SimpleCalculatorProps) => {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Input, setTeam1Input] = useState(0);
  const [team2Input, setTeam2Input] = useState(0);
  const [history, setHistory] = useState<RoundEntry[]>([]);

  const toArabicNumerals = (num: number): string => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(d => arabicDigits[parseInt(d)] || d).join('');
  };

  const handleAddPoints = () => {
    if (team1Input === 0 && team2Input === 0) return;
    
    const newEntry: RoundEntry = {
      id: crypto.randomUUID(),
      team1: team1Input,
      team2: team2Input,
    };
    
    setTeam1Score(prev => prev + team1Input);
    setTeam2Score(prev => prev + team2Input);
    setHistory(prev => [newEntry, ...prev]);
    setTeam1Input(0);
    setTeam2Input(0);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastEntry = history[0];
    setTeam1Score(prev => prev - lastEntry.team1);
    setTeam2Score(prev => prev - lastEntry.team2);
    setHistory(prev => prev.slice(1));
  };

  const handleReset = () => {
    setTeam1Score(0);
    setTeam2Score(0);
    setTeam1Input(0);
    setTeam2Input(0);
    setHistory([]);
  };

  const incrementTeam = (team: 1 | 2) => {
    if (team === 1) {
      setTeam1Input(prev => prev + 1);
    } else {
      setTeam2Input(prev => prev + 1);
    }
  };

  const decrementTeam = (team: 1 | 2) => {
    if (team === 1) {
      setTeam1Input(prev => Math.max(0, prev - 1));
    } else {
      setTeam2Input(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={onBack}>
          <Home className="h-5 w-5" />
        </Button>
      </div>

      {/* Scores Display */}
      <div className="flex-shrink-0 flex justify-center items-center gap-8 py-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">لنا</div>
          <div className="text-6xl font-bold">{toArabicNumerals(team1Score)}</div>
        </div>
        <ArrowUp className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground">لهم</div>
          <div className="text-6xl font-bold">{toArabicNumerals(team2Score)}</div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="flex-shrink-0 flex justify-center items-center gap-4 py-6">
        {/* Team 2 Circle */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => incrementTeam(2)}
            className="w-20 h-20 rounded-full border-4 border-primary/30 bg-muted flex items-center justify-center text-2xl font-bold hover:bg-primary/20 transition-colors"
          >
            {team2Input > 0 ? toArabicNumerals(team2Input) : <Plus className="h-6 w-6 text-muted-foreground" />}
          </button>
          {team2Input > 0 && (
            <Button variant="ghost" size="sm" onClick={() => decrementTeam(2)} className="text-xs">
              −
            </Button>
          )}
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleAddPoints}
          disabled={team1Input === 0 && team2Input === 0}
          className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          احسب
        </button>

        {/* Team 1 Circle */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => incrementTeam(1)}
            className="w-20 h-20 rounded-full border-4 border-primary/30 bg-muted flex items-center justify-center text-2xl font-bold hover:bg-primary/20 transition-colors"
          >
            {team1Input > 0 ? toArabicNumerals(team1Input) : <Plus className="h-6 w-6 text-muted-foreground" />}
          </button>
          {team1Input > 0 && (
            <Button variant="ghost" size="sm" onClick={() => decrementTeam(1)} className="text-xs">
              −
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex justify-center items-center gap-4 py-4">
        <Button variant="outline" onClick={handleUndo} disabled={history.length === 0}>
          تراجع
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 ml-2" />
          صكة جديدة
        </Button>
      </div>

      {/* History */}
      <div className="flex-1 overflow-auto min-h-0 border-t border-border">
        {history.map((entry, index) => (
          <div key={entry.id} className="flex justify-between items-center px-8 py-3 border-b border-border/50">
            <span className="text-lg">{toArabicNumerals(entry.team2)}</span>
            <span className="text-lg">{toArabicNumerals(entry.team1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleCalculator;
