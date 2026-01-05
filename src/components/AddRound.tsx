import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { GameType, Multiplier, TeamProjects, createEmptyProjects, PROJECT_VALUES } from '@/types/baloot';
import { cn } from '@/lib/utils';
import { Camera, Plus, Minus } from 'lucide-react';
import CardScanner from './CardScanner';

// Convert Arabic numerals to Western numerals
const arabicToWestern = (str: string): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), index.toString());
  });
  return result;
};

type ProjectKey = keyof TeamProjects;

const AddRound = () => {
  const { game, addRound, canDoubleSun } = useGame();
  const [gameType, setGameType] = useState<GameType>('حكم');
  const [buyingTeam, setBuyingTeam] = useState<1 | 2>(1);
  const [buyingTeamRawPoints, setBuyingTeamRawPoints] = useState('');
  const [team1Projects, setTeam1Projects] = useState<TeamProjects>(createEmptyProjects());
  const [team2Projects, setTeam2Projects] = useState<TeamProjects>(createEmptyProjects());
  const [multiplier, setMultiplier] = useState<Multiplier>('عادي');
  const [showScanner, setShowScanner] = useState(false);

  // Reset projects when game type changes
  useEffect(() => {
    setTeam1Projects(createEmptyProjects());
    setTeam2Projects(createEmptyProjects());
  }, [gameType]);

  if (!game) return null;

  const hokmMultipliers: Multiplier[] = ['عادي', 'دبل', '×3', '×4', 'قهوة'];
  const sunMultipliers: Multiplier[] = ['عادي', 'دبل'];

  const availableMultipliers = gameType === 'حكم' ? hokmMultipliers : sunMultipliers;
  const canDouble = gameType === 'حكم' || canDoubleSun();

  // المشاريع المتاحة حسب نوع اللعب
  const availableProjects: { key: ProjectKey; label: string; value: number }[] = gameType === 'صن'
    ? [
        { key: 'سرا', label: 'سرا', value: PROJECT_VALUES.صن.سرا },
        { key: 'خمسين', label: 'خمسين', value: PROJECT_VALUES.صن.خمسين },
        { key: 'مية', label: 'مية', value: PROJECT_VALUES.صن.مية },
        { key: 'أربعمية', label: 'أربعمية', value: PROJECT_VALUES.صن.أربعمية },
      ]
    : [
        { key: 'سرا', label: 'سرا', value: PROJECT_VALUES.حكم.سرا },
        { key: 'خمسين', label: 'خمسين', value: PROJECT_VALUES.حكم.خمسين },
        { key: 'مية', label: 'مية', value: PROJECT_VALUES.حكم.مية },
        { key: 'بلوت', label: 'بلوت', value: PROJECT_VALUES.حكم.بلوت },
      ];

  const updateProject = (team: 1 | 2, project: ProjectKey, delta: number) => {
    if (team === 1) {
      setTeam1Projects(prev => ({
        ...prev,
        [project]: Math.max(0, prev[project] + delta),
      }));
    } else {
      setTeam2Projects(prev => ({
        ...prev,
        [project]: Math.max(0, prev[project] + delta),
      }));
    }
  };

  const handleSubmit = () => {
    const rawPoints = parseInt(buyingTeamRawPoints) || 0;
    
    if (rawPoints === 0 && multiplier !== 'قهوة') return;

    // حساب نقاط الخصم من المجموع الكلي
    const totalRaw = gameType === 'صن' ? 260 : 162;
    const otherTeamRaw = totalRaw - rawPoints;

    const team1Raw = buyingTeam === 1 ? rawPoints : otherTeamRaw;
    const team2Raw = buyingTeam === 2 ? rawPoints : otherTeamRaw;

    addRound({
      gameType,
      buyingTeam,
      team1RawPoints: team1Raw,
      team2RawPoints: team2Raw,
      team1Projects,
      team2Projects,
      multiplier,
    });

    // Reset form
    setBuyingTeamRawPoints('');
    setTeam1Projects(createEmptyProjects());
    setTeam2Projects(createEmptyProjects());
    setMultiplier('عادي');
  };

  const handleScanSuccess = (totalPoints: number) => {
    setBuyingTeamRawPoints(totalPoints.toString());
  };

  const ProjectCounter = ({ team, project, value }: { team: 1 | 2; project: ProjectKey; value: number }) => {
    const projects = team === 1 ? team1Projects : team2Projects;
    const count = projects[project];
    
    return (
      <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{project}</span>
          <span className="text-xs text-muted-foreground">({value})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateProject(team, project, -1)}
            disabled={count === 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center font-bold">{count}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => updateProject(team, project, 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="mx-4 mb-4">
        <CardContent className="space-y-4 pt-4">
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

          {/* Raw Points Input - Only for buying team */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              البنط (الأكلات) - {buyingTeam === 1 ? game.team1Name : game.team2Name}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={buyingTeamRawPoints}
                onChange={(e) => setBuyingTeamRawPoints(arabicToWestern(e.target.value).replace(/[^0-9]/g, ''))}
                placeholder={gameType === 'صن' ? 'من 0 إلى 260' : 'من 0 إلى 162'}
                className="text-center text-xl h-14 flex-1"
                disabled={multiplier === 'قهوة'}
              />
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                من {gameType === 'صن' ? '260' : '162'}
              </div>
            </div>
            {buyingTeamRawPoints && (
              <p className="text-xs text-muted-foreground text-center">
                الخصم: {(gameType === 'صن' ? 260 : 162) - (parseInt(buyingTeamRawPoints) || 0)} بنط
              </p>
            )}
          </div>

          {/* Projects Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">المشاريع</label>
            
            {/* Team 1 Projects */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-blue-400">{game.team1Name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableProjects.map((p) => (
                  <ProjectCounter key={`t1-${p.key}`} team={1} project={p.key} value={p.value} />
                ))}
              </div>
            </div>

            {/* Team 2 Projects */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-sm font-medium text-rose-400">{game.team2Name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableProjects.map((p) => (
                  <ProjectCounter key={`t2-${p.key}`} team={2} project={p.key} value={p.value} />
                ))}
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
