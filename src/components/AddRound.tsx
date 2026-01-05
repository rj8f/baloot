import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { GameType, Multiplier } from '@/types/baloot';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';
import CardScanner from './CardScanner';

const AddRound = () => {
  const { game, addRound, canDoubleSun } = useGame();
  const [gameType, setGameType] = useState<GameType>('حكم');
  const [buyingTeam, setBuyingTeam] = useState<1 | 2>(1);
  const [team1Points, setTeam1Points] = useState('');
  const [team2Points, setTeam2Points] = useState('');
  const [multiplier, setMultiplier] = useState<Multiplier>('عادي');
  const [showScanner, setShowScanner] = useState(false);

  if (!game) return null;

  const hokmMultipliers: Multiplier[] = ['عادي', 'دبل', '×3', '×4', 'قهوة'];
  const sunMultipliers: Multiplier[] = ['عادي', 'دبل'];

  const availableMultipliers = gameType === 'حكم' ? hokmMultipliers : sunMultipliers;
  const canDouble = gameType === 'حكم' || canDoubleSun();

  const handleSubmit = () => {
    const t1 = parseInt(team1Points) || 0;
    const t2 = parseInt(team2Points) || 0;
    
    if (t1 === 0 && t2 === 0 && multiplier !== 'قهوة') return;

    addRound({
      gameType,
      buyingTeam,
      team1Points: t1,
      team2Points: t2,
      multiplier,
    });

    // Reset form
    setTeam1Points('');
    setTeam2Points('');
    setMultiplier('عادي');
  };

  const handleScanSuccess = (totalPoints: number) => {
    // Scanned points are for the buying team
    const totalGamePoints = gameType === 'صن' ? 130 : 162;
    const otherTeamPoints = totalGamePoints - totalPoints;
    
    if (buyingTeam === 1) {
      setTeam1Points(totalPoints.toString());
      setTeam2Points(otherTeamPoints.toString());
    } else {
      setTeam1Points(otherTeamPoints.toString());
      setTeam2Points(totalPoints.toString());
    }
  };

  return (
    <>
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg">جولة جديدة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">نوع اللعب</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={gameType === 'حكم' ? 'default' : 'outline'}
                onClick={() => {
                  setGameType('حكم');
                  setMultiplier('عادي');
                }}
                className="text-lg py-5"
              >
                حكم
              </Button>
              <Button
                variant={gameType === 'صن' ? 'default' : 'outline'}
                onClick={() => {
                  setGameType('صن');
                  setMultiplier('عادي');
                }}
                className="text-lg py-5"
              >
                صن
              </Button>
            </div>
          </div>

          {/* Buying Team */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">المشتري</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={buyingTeam === 1 ? 'default' : 'outline'}
                onClick={() => setBuyingTeam(1)}
                className={cn(
                  "text-base py-4",
                  buyingTeam === 1 && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {game.team1Name}
              </Button>
              <Button
                variant={buyingTeam === 2 ? 'default' : 'outline'}
                onClick={() => setBuyingTeam(2)}
                className={cn(
                  "text-base py-4",
                  buyingTeam === 2 && "bg-rose-600 hover:bg-rose-700"
                )}
              >
                {game.team2Name}
              </Button>
            </div>
          </div>

          {/* Camera Scan Button */}
          <Button
            variant="outline"
            onClick={() => setShowScanner(true)}
            className="w-full py-5 border-dashed border-2"
            disabled={multiplier === 'قهوة'}
          >
            <Camera className="h-5 w-5 ml-2" />
            📷 تصوير الأوراق
          </Button>

          {/* Points Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">النقاط (أكلات + مشاريع)</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-blue-400">{game.team1Name}</span>
                <Input
                  type="number"
                  value={team1Points}
                  onChange={(e) => setTeam1Points(e.target.value)}
                  placeholder="0"
                  className="text-center text-xl h-14"
                  disabled={multiplier === 'قهوة'}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-rose-400">{game.team2Name}</span>
                <Input
                  type="number"
                  value={team2Points}
                  onChange={(e) => setTeam2Points(e.target.value)}
                  placeholder="0"
                  className="text-center text-xl h-14"
                  disabled={multiplier === 'قهوة'}
                />
              </div>
            </div>
          </div>

          {/* Multiplier */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">المضاعفة</label>
            <div className="flex flex-wrap gap-2">
              {availableMultipliers.map((m) => {
                const isDisabled = gameType === 'صن' && m === 'دبل' && !canDouble;
                return (
                  <Button
                    key={m}
                    variant={multiplier === m ? 'default' : 'outline'}
                    onClick={() => setMultiplier(m)}
                    disabled={isDisabled}
                    className={cn(
                      "flex-1 min-w-[60px]",
                      m === 'قهوة' && multiplier === m && "bg-amber-600 hover:bg-amber-700"
                    )}
                    size="sm"
                  >
                    {m}
                  </Button>
                );
              })}
            </div>
            {gameType === 'صن' && !canDouble && (
              <p className="text-xs text-muted-foreground">
                الدبل متاح فقط إذا أحد الفرق ≤100 والآخر ≥101
              </p>
            )}
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            className="w-full text-lg py-6"
            size="lg"
          >
            أضف الجولة
          </Button>
        </CardContent>
      </Card>

      {showScanner && (
        <CardScanner
          gameType={gameType}
          buyingTeam={buyingTeam}
          multiplier={multiplier}
          onClose={() => setShowScanner(false)}
          onSuccess={handleScanSuccess}
        />
      )}
    </>
  );
};

export default AddRound;
