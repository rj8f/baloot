import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import ThemeToggle from './ThemeToggle';
import MatchHistory from './MatchHistory';
import SimpleCalculator from './SimpleCalculator';
import { Calculator, Settings2 } from 'lucide-react';

type CalculatorMode = 'select' | 'simple' | 'advanced';

const GameSetup = () => {
  const { startGame } = useGame();
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [mode, setMode] = useState<CalculatorMode>('select');

  const handleStart = () => {
    const t1 = team1Name.trim() || 'لنا';
    const t2 = team2Name.trim() || 'لهم';
    startGame(t1, t2, 152);
  };

  // Simple Calculator Mode
  if (mode === 'simple') {
    return <SimpleCalculator onBack={() => setMode('select')} />;
  }

  // Advanced Calculator Mode - show team name inputs
  if (mode === 'advanced') {
    return (
      <div className="h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute top-4 left-4">
          <ThemeToggle />
        </div>
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="sm" onClick={() => setMode('select')}>
            رجوع
          </Button>
        </div>

        <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
          <CardHeader className="text-center flex-shrink-0">
            <CardTitle className="text-3xl font-bold text-primary">🃏 الحاسبة المتقدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2 flex-shrink-0">
              <label className="text-sm font-medium">اسم الفريق الأول</label>
              <Input
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                placeholder="لنا"
                className="text-center text-lg"
              />
            </div>
            
            <div className="space-y-2 flex-shrink-0">
              <label className="text-sm font-medium">اسم الفريق الثاني</label>
              <Input
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                placeholder="لهم"
                className="text-center text-lg"
              />
            </div>

            <Button 
              onClick={handleStart} 
              className="w-full text-lg py-6 flex-shrink-0"
              size="lg"
            >
              ابدأ اللعبة
            </Button>

            <div className="flex-1 overflow-auto min-h-0">
              <MatchHistory />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode Selection Screen
  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">🃏 حاسبة البلوت</CardTitle>
          <p className="text-muted-foreground mt-2">اختر نوع الحاسبة</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simple Calculator Option */}
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary transition-all"
            onClick={() => setMode('simple')}
          >
            <Calculator className="h-8 w-8 text-primary" />
            <div className="text-center">
              <div className="font-bold text-lg">مختصرة</div>
              <div className="text-sm text-muted-foreground">حساب سريع للنقاط</div>
            </div>
          </Button>

          {/* Advanced Calculator Option */}
          <Button
            variant="outline"
            className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary transition-all"
            onClick={() => setMode('advanced')}
          >
            <Settings2 className="h-8 w-8 text-primary" />
            <div className="text-center">
              <div className="font-bold text-lg">متقدمة</div>
              <div className="text-sm text-muted-foreground">مشاريع، مضاعفات، وتفاصيل كاملة</div>
            </div>
          </Button>

          {/* Match History */}
          <div className="pt-4 border-t">
            <MatchHistory />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
