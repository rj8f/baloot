import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame, RoundInput } from '@/contexts/GameContext';
import { GameType, Multiplier, TeamProjects, createEmptyProjects, PROJECT_VALUES } from '@/types/baloot';
import { cn } from '@/lib/utils';
import { Camera, Plus, Minus, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import CardScanner from './CardScanner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const { game, addRound, canDoubleSun, previewRoundResult } = useGame();
  const [gameType, setGameType] = useState<GameType>('حكم');
  const [buyingTeam, setBuyingTeam] = useState<1 | 2>(1);
  const [entryTeam, setEntryTeam] = useState<1 | 2>(1);
  const [entryTeamCardsRaw, setEntryTeamCardsRaw] = useState('');
  const [projectsTeam, setProjectsTeam] = useState<1 | 2 | null>(null);
  const [projects, setProjects] = useState<TeamProjects>(createEmptyProjects());
  const [multiplier, setMultiplier] = useState<Multiplier>('عادي');
  const [showScanner, setShowScanner] = useState(false);
  const [kabootTeam, setKabootTeam] = useState<1 | 2 | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset when game type changes
  useEffect(() => {
    setProjectsTeam(null);
    setProjects(createEmptyProjects());
    setEntryTeamCardsRaw('');
    setKabootTeam(null);
    setShowAdvanced(false);
  }, [gameType]);

  if (!game) return null;

  const hokmMultipliers: Multiplier[] = ['عادي', 'دبل', '×3', '×4', 'قهوة'];
  const sunMultipliers: Multiplier[] = ['عادي', 'دبل'];

  const availableMultipliers = gameType === 'حكم' ? hokmMultipliers : sunMultipliers;
  const canDouble = gameType === 'حكم' || canDoubleSun();

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

  const updateProject = (project: ProjectKey, delta: number) => {
    setProjects(prev => ({
      ...prev,
      [project]: Math.max(0, prev[project] + delta),
    }));
  };

  // Total points including ground: صن = 130, حكم = 162
  const totalPoints = gameType === 'صن' ? 130 : 162;

  const calculateTotalRaw = () => {
    const entryCards = parseInt(entryTeamCardsRaw) || 0;
    const otherCards = totalPoints - entryCards;
    
    const team1Cards = entryTeam === 1 ? entryCards : otherCards;
    const team2Cards = entryTeam === 2 ? entryCards : otherCards;
    
    return {
      team1Total: team1Cards,
      team2Total: team2Cards,
      team1Cards,
      team2Cards,
      entryCards,
      otherCards,
    };
  };

  const totals = calculateTotalRaw();

  // Count total projects
  const totalProjectsCount = Object.values(projects).reduce((sum, count) => sum + count, 0);

  // Get team1 and team2 projects based on selected projectsTeam
  const team1Projects: TeamProjects = projectsTeam === 1 ? projects : createEmptyProjects();
  const team2Projects: TeamProjects = projectsTeam === 2 ? projects : createEmptyProjects();

  const handleSubmit = () => {
    if ((totals.team1Cards === 0 && totals.team2Cards === 0) && multiplier !== 'قهوة' && !kabootTeam) return;

    const team1Raw = kabootTeam ? 0 : totals.team1Cards;
    const team2Raw = kabootTeam ? 0 : totals.team2Cards;

    addRound({
      gameType,
      buyingTeam,
      team1RawPoints: team1Raw,
      team2RawPoints: team2Raw,
      team1Projects,
      team2Projects,
      multiplier,
      kabootTeam,
    });

    // Reset form
    setEntryTeamCardsRaw('');
    setProjectsTeam(null);
    setProjects(createEmptyProjects());
    setMultiplier('عادي');
    setKabootTeam(null);
    setShowAdvanced(false);
  };

  const handleScanSuccess = (totalPoints: number) => {
    setEntryTeamCardsRaw(totalPoints.toString());
  };

  const CompactProjectCounter = ({ project, value }: { project: ProjectKey; value: number }) => {
    const count = projects[project];
    
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
        <span className="text-sm font-medium">{project}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateProject(project, -1)}
            disabled={count === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-6 text-center text-lg font-bold">{count}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateProject(project, 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="mx-4 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-lg">إضافة جولة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Type & Buying Team - Combined Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">نوع اللعب</label>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={gameType === 'حكم' ? 'default' : 'outline'}
                  onClick={() => { setGameType('حكم'); setMultiplier('عادي'); }}
                  size="sm"
                  className="text-sm"
                >
                  حكم
                </Button>
                <Button
                  variant={gameType === 'صن' ? 'default' : 'outline'}
                  onClick={() => { setGameType('صن'); setMultiplier('عادي'); }}
                  size="sm"
                  className="text-sm"
                >
                  صن
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">المشتري</label>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant={buyingTeam === 1 ? 'default' : 'outline'}
                  onClick={() => setBuyingTeam(1)}
                  size="sm"
                  className={cn("text-xs", buyingTeam === 1 && "bg-blue-600 hover:bg-blue-700")}
                >
                  {game.team1Name}
                </Button>
                <Button
                  variant={buyingTeam === 2 ? 'default' : 'outline'}
                  onClick={() => setBuyingTeam(2)}
                  size="sm"
                  className={cn("text-xs", buyingTeam === 2 && "bg-rose-600 hover:bg-rose-700")}
                >
                  {game.team2Name}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Kaboot Selection */}
          {!kabootTeam && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKabootTeam(1)}
                className="flex-1 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                <Zap className="h-3 w-3 ml-1" />
                كبوت {game.team1Name}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKabootTeam(2)}
                className="flex-1 text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                <Zap className="h-3 w-3 ml-1" />
                كبوت {game.team2Name}
              </Button>
            </div>
          )}

          {/* Kaboot Active */}
          {kabootTeam && (
            <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span className="font-bold text-amber-400">كبوت</span>
                  <span className={kabootTeam === 1 ? "text-blue-400" : "text-rose-400"}>
                    {kabootTeam === 1 ? game.team1Name : game.team2Name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKabootTeam(null)}
                  className="text-xs"
                >
                  إلغاء
                </Button>
              </div>
              <p className="text-xs text-amber-400/80">
                {gameType === 'حكم' ? '25' : '44'} نقطة + المشاريع
              </p>
              {/* Preview for Kaboot */}
              {(() => {
                const preview = previewRoundResult({
                  gameType,
                  buyingTeam,
                  team1RawPoints: 0,
                  team2RawPoints: 0,
                  team1Projects,
                  team2Projects,
                  multiplier,
                  kabootTeam,
                });
                return (
                  <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-amber-500/30">
                    <div className="bg-blue-600/20 rounded-lg p-2">
                      <div className="text-xs text-blue-400">{game.team1Name}</div>
                      <div className="text-2xl font-bold text-blue-300">
                        {game.team1Score + preview.finalTeam1Points}
                      </div>
                    </div>
                    <div className="bg-rose-600/20 rounded-lg p-2">
                      <div className="text-xs text-rose-400">{game.team2Name}</div>
                      <div className="text-2xl font-bold text-rose-300">
                        {game.team2Score + preview.finalTeam2Points}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Points Entry - Only show if not Kaboot */}
          {!kabootTeam && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={entryTeam === 1 ? 'default' : 'ghost'}
                  onClick={() => setEntryTeam(1)}
                  size="sm"
                  className={cn("flex-1 h-8", entryTeam === 1 && "bg-blue-600 hover:bg-blue-700")}
                >
                  {game.team1Name}
                </Button>
                <Button
                  variant={entryTeam === 2 ? 'default' : 'ghost'}
                  onClick={() => setEntryTeam(2)}
                  size="sm"
                  className={cn("flex-1 h-8", entryTeam === 2 && "bg-rose-600 hover:bg-rose-700")}
                >
                  {game.team2Name}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={entryTeamCardsRaw}
                  onChange={(e) => setEntryTeamCardsRaw(arabicToWestern(e.target.value).replace(/[^0-9]/g, ''))}
                  placeholder="البنط"
                  className="text-center text-2xl h-14 flex-1 font-bold"
                  disabled={multiplier === 'قهوة'}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowScanner(true)}
                  disabled={multiplier === 'قهوة'}
                  className="h-14 w-14 shrink-0"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>

              {/* Summary with Preview */}
              {entryTeamCardsRaw && (() => {
                const team1Raw = totals.team1Cards;
                const team2Raw = totals.team2Cards;
                const preview = previewRoundResult({
                  gameType,
                  buyingTeam,
                  team1RawPoints: team1Raw,
                  team2RawPoints: team2Raw,
                  team1Projects,
                  team2Projects,
                  multiplier,
                  kabootTeam,
                });
                return (
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-blue-500/10 rounded-lg p-2">
                      <div className="text-xs text-blue-400">{game.team1Name}</div>
                      <div className="text-2xl font-bold">{game.team1Score + preview.finalTeam1Points}</div>
                    </div>
                    <div className="bg-rose-500/10 rounded-lg p-2">
                      <div className="text-xs text-rose-400">{game.team2Name}</div>
                      <div className="text-2xl font-bold">{game.team2Score + preview.finalTeam2Points}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Projects Section - Always Visible */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              المشاريع
              {totalProjectsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary/20 rounded text-xs">
                  {totalProjectsCount}
                </span>
              )}
            </label>
            
            {/* Team Selection for Projects */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={projectsTeam === 1 ? 'default' : 'outline'}
                onClick={() => {
                  if (projectsTeam === 1) {
                    setProjectsTeam(null);
                    setProjects(createEmptyProjects());
                  } else {
                    setProjectsTeam(1);
                    setProjects(createEmptyProjects());
                  }
                }}
                size="sm"
                className={cn("h-10", projectsTeam === 1 && "bg-blue-600 hover:bg-blue-700")}
              >
                {game.team1Name}
              </Button>
              <Button
                variant={projectsTeam === 2 ? 'default' : 'outline'}
                onClick={() => {
                  if (projectsTeam === 2) {
                    setProjectsTeam(null);
                    setProjects(createEmptyProjects());
                  } else {
                    setProjectsTeam(2);
                    setProjects(createEmptyProjects());
                  }
                }}
                size="sm"
                className={cn("h-10", projectsTeam === 2 && "bg-rose-600 hover:bg-rose-700")}
              >
                {game.team2Name}
              </Button>
            </div>

            {/* Project Counters - Only show if team is selected */}
            {projectsTeam && (
              <div className="space-y-2">
                {availableProjects.map((p) => (
                  <CompactProjectCounter key={p.key} project={p.key} value={p.value} />
                ))}
              </div>
            )}
          </div>

          {/* Advanced Options - Collapsible */}
          {!kabootTeam && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-10">
                  <span className="text-sm">
                    المضاعفة
                    {multiplier !== 'عادي' && (
                      <span className="mr-2 px-1.5 py-0.5 bg-amber-500/20 rounded text-xs text-amber-400">
                        {multiplier}
                      </span>
                    )}
                  </span>
                  {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
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
                          "flex-1 min-w-[50px]",
                          m === 'قهوة' && multiplier === m && "bg-amber-600 hover:bg-amber-700"
                        )}
                        size="sm"
                      >
                        {m}
                      </Button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full text-lg py-6 mt-2"
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
