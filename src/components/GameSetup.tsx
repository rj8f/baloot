import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';

const GameSetup = () => {
  const { startGame } = useGame();
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [winningScore, setWinningScore] = useState('152');

  const handleStart = () => {
    const t1 = team1Name.trim() || 'فريق ١';
    const t2 = team2Name.trim() || 'فريق ٢';
    const score = parseInt(winningScore) || 152;
    startGame(t1, t2, score);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">🃏 حاسبة البلوت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم الفريق الأول</label>
            <Input
              value={team1Name}
              onChange={(e) => setTeam1Name(e.target.value)}
              placeholder="فريق ١"
              className="text-center text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم الفريق الثاني</label>
            <Input
              value={team2Name}
              onChange={(e) => setTeam2Name(e.target.value)}
              placeholder="فريق ٢"
              className="text-center text-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">نقاط الفوز</label>
            <Input
              type="number"
              value={winningScore}
              onChange={(e) => setWinningScore(e.target.value)}
              placeholder="152"
              className="text-center text-lg"
            />
          </div>

          <Button 
            onClick={handleStart} 
            className="w-full text-lg py-6"
            size="lg"
          >
            ابدأ اللعبة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameSetup;
