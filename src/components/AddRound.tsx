import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Undo2 } from 'lucide-react';
import { GameType, Multiplier, TeamProjects, createEmptyProjects, PROJECT_VALUES } from '@/types/baloot';
import { cn } from '@/lib/utils';
import { Camera, Zap } from 'lucide-react';
import CardScanner from './CardScanner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  const { game, addRound, canDoubleSun, previewRoundResult, getUnifiedHistory, undoLast } = useGame();
  const { settings } = useSettings();
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [gameType, setGameType] = useState<GameType>('حكم');
  const [buyingTeam, setBuyingTeam] = useState<1 | 2>(1);
  const [entryTeam, setEntryTeam] = useState<1 | 2>(1);
  const [entryTeamCardsRaw, setEntryTeamCardsRaw] = useState('');
  const [projectsTeam, setProjectsTeam] = useState<1 | 2 | null>(null);
  const [projects, setProjects] = useState<TeamProjects>(createEmptyProjects());
  const [multiplier, setMultiplier] = useState<Multiplier>('عادي');
  const [showScanner, setShowScanner] = useState(false);
  const [kabootTeam, setKabootTeam] = useState<1 | 2 | null>(null);
  const [showMiyaDialog, setShowMiyaDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<{
    team1Projects: TeamProjects;
    team2Projects: TeamProjects;
  } | null>(null);

  const unifiedHistory = getUnifiedHistory();

  // Reset when game type changes
  useEffect(() => {
    setProjectsTeam(null);
    setProjects(createEmptyProjects());
    setEntryTeamCardsRaw('');
    setKabootTeam(null);
    setMultiplier('عادي');
  }, [gameType]);

  // Auto-set projects team when kaboot is selected
  useEffect(() => {
    if (kabootTeam) {
      setProjectsTeam(kabootTeam);
      setProjects(createEmptyProjects());
    }
  }, [kabootTeam]);

  if (!game) return null;

  const hokmMultipliers: Multiplier[] = ['دبل', '×3', '×4', 'قهوة'];
  const sunMultipliers: Multiplier[] = ['دبل'];

  const availableMultipliers = gameType === 'حكم' ? hokmMultipliers : sunMultipliers;
  const canDouble = gameType === 'حكم' || canDoubleSun();

  const availableProjects: { key: ProjectKey; label: string }[] = gameType === 'صن'
    ? [
        { key: 'سرا', label: 'سرا' },
        { key: 'خمسين', label: '50' },
        { key: 'مية', label: '100' },
        { key: 'أربعمية', label: '400' },
      ]
    : [
        { key: 'سرا', label: 'سرا' },
        { key: 'خمسين', label: '50' },
        { key: 'مية', label: '100' },
        { key: 'بلوت', label: 'بلوت' },
      ];

  const cycleProject = (project: ProjectKey) => {
    // حدود كل مشروع
    let maxCount = 4;
    if (project === 'بلوت') maxCount = 1;
    else if (project === 'مية') maxCount = 2;
    else if (project === 'أربعمية' && gameType === 'صن') maxCount = 1;
    
    setProjects(prev => ({
      ...prev,
      [project]: prev[project] >= maxCount ? 0 : prev[project] + 1,
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

  // تحديد إذا كان هناك مية في حكم مع ×3 أو ×4
  const shouldAskForMiyaMultiplier = () => {
    // إذا الإعداد مغلق، لا تسأل
    if (!settings.showMiyaPopup) return false;
    if (gameType !== 'حكم') return false;
    if (multiplier !== '×3' && multiplier !== '×4') return false;
    if (kabootTeam) return false;
    
    // اسأل إذا أي فريق عنده مية
    return team1Projects.مية > 0 || team2Projects.مية > 0;
  };

  const handleSubmit = () => {
    if ((totals.team1Cards === 0 && totals.team2Cards === 0) && multiplier !== 'قهوة' && !kabootTeam) return;

    // تحقق إذا كان يجب سؤال الخصم عن طريقة حساب المية
    if (shouldAskForMiyaMultiplier()) {
      setPendingSubmit({ team1Projects, team2Projects });
      setShowMiyaDialog(true);
      return;
    }

    submitRound(team1Projects, team2Projects, false);
  };

  const submitRound = (t1Projects: TeamProjects, t2Projects: TeamProjects, miyaDoubleOnly: boolean) => {
    const team1Raw = kabootTeam ? 0 : totals.team1Cards;
    const team2Raw = kabootTeam ? 0 : totals.team2Cards;

    addRound({
      gameType,
      buyingTeam,
      team1RawPoints: team1Raw,
      team2RawPoints: team2Raw,
      team1Projects: t1Projects,
      team2Projects: t2Projects,
      multiplier,
      kabootTeam,
      miyaDoubleOnly,
      hokmWithoutPointsMode: settings.hokmWithoutPointsMode,
    });

    // Reset form
    setEntryTeamCardsRaw('');
    setProjectsTeam(null);
    setProjects(createEmptyProjects());
    setMultiplier('عادي');
    setKabootTeam(null);
    setPendingSubmit(null);
  };

  // الخصم يريد المية فقط ×2
  const handleMiyaDoubleOnly = () => {
    if (!pendingSubmit) return;
    setShowMiyaDialog(false);
    submitRound(pendingSubmit.team1Projects, pendingSubmit.team2Projects, true);
  };

  // الخصم يريد المية على حسب المضاعف
  const handleMiyaWithMultiplier = () => {
    if (!pendingSubmit) return;
    setShowMiyaDialog(false);
    submitRound(pendingSubmit.team1Projects, pendingSubmit.team2Projects, false);
  };

  const handleScanSuccess = (totalPoints: number) => {
    setEntryTeamCardsRaw(totalPoints.toString());
  };

  // Calculate preview
  const getPreview = () => {
    const team1Raw = kabootTeam ? 0 : totals.team1Cards;
    const team2Raw = kabootTeam ? 0 : totals.team2Cards;
    return previewRoundResult({
      gameType,
      buyingTeam,
      team1RawPoints: team1Raw,
      team2RawPoints: team2Raw,
      team1Projects,
      team2Projects,
      multiplier,
      kabootTeam,
      hokmWithoutPointsMode: settings.hokmWithoutPointsMode,
    });
  };

  const preview = getPreview();
  const showPreview = entryTeamCardsRaw || kabootTeam;

  return (
    <>
      <Card className="mx-4 mb-4 overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Top Bar: Game Type Toggle */}
          <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => { setGameType('حكم'); setMultiplier('عادي'); }}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                gameType === 'حكم' 
                  ? "bg-background shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              حكم
            </button>
            <button
              onClick={() => { setGameType('صن'); setMultiplier('عادي'); }}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                gameType === 'صن' 
                  ? "bg-background shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              صن
            </button>
          </div>

          {/* Buying Team - Large Buttons */}
          <span className="text-xs text-muted-foreground text-center block">المشترى</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBuyingTeam(1)}
              className={cn(
                "py-3 rounded-lg font-bold text-lg transition-all border-2",
                buyingTeam === 1 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "bg-transparent border-blue-600/30 text-blue-400 hover:border-blue-600/60"
              )}
            >
              {game.team1Name}
            </button>
            <button
              onClick={() => setBuyingTeam(2)}
              className={cn(
                "py-3 rounded-lg font-bold text-lg transition-all border-2",
                buyingTeam === 2 
                  ? "bg-rose-600 border-rose-600 text-white" 
                  : "bg-transparent border-rose-600/30 text-rose-400 hover:border-rose-600/60"
              )}
            >
              {game.team2Name}
            </button>
          </div>

          {/* Kaboot Toggle - Compact */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setKabootTeam(kabootTeam === 1 ? null : 1)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1",
                kabootTeam === 1 
                  ? "bg-amber-500 text-white" 
                  : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              كبوت
            </button>
            <button
              onClick={() => setKabootTeam(kabootTeam === 2 ? null : 2)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1",
                kabootTeam === 2 
                  ? "bg-amber-500 text-white" 
                  : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              كبوت
            </button>
          </div>

          {/* Projects - Team Selection as Grid */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground text-center block">المشاريع</span>
            {kabootTeam ? (
              // When kaboot is active, show only the kaboot team (locked)
              <div className="grid grid-cols-2 gap-2">
                <div className={cn(
                  "flex items-center justify-center rounded-xl py-2 px-3",
                  kabootTeam === 1 
                    ? "bg-blue-600 text-white" 
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  <span className="text-sm font-medium">{game.team1Name}</span>
                </div>
                <div className={cn(
                  "flex items-center justify-center rounded-xl py-2 px-3",
                  kabootTeam === 2 
                    ? "bg-rose-600 text-white" 
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  <span className="text-sm font-medium">{game.team2Name}</span>
                </div>
              </div>
            ) : (
              // Normal mode - allow team selection
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (projectsTeam === 1) {
                      setProjectsTeam(null);
                      setProjects(createEmptyProjects());
                    } else {
                      setProjectsTeam(1);
                      setProjects(createEmptyProjects());
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-xl py-2 px-3 transition-all active:scale-95",
                    projectsTeam === 1 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-sm font-medium">{game.team1Name}</span>
                </button>
                <button
                  onClick={() => {
                    if (projectsTeam === 2) {
                      setProjectsTeam(null);
                      setProjects(createEmptyProjects());
                    } else {
                      setProjectsTeam(2);
                      setProjects(createEmptyProjects());
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-xl py-2 px-3 transition-all active:scale-95",
                    projectsTeam === 2 
                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-sm font-medium">{game.team2Name}</span>
                </button>
              </div>
            )}

            {/* Project Chips - Tap to cycle */}
            {projectsTeam && (
              <div className="grid grid-cols-4 gap-2">
                {availableProjects.map((p) => {
                  const count = projects[p.key];
                  return (
                    <button
                      key={p.key}
                      onClick={() => cycleProject(p.key)}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-xl py-2 px-3 transition-all active:scale-95",
                        count > 0 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span className="text-sm font-medium">{p.label}</span>
                      {count > 0 && (
                        <span className="text-xs font-bold">x{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multiplier - Same style as projects */}
          {!kabootTeam && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">الدبل</span>
              <div className="grid grid-cols-4 gap-2">
                {availableMultipliers.map((m) => {
                  const isDisabled = gameType === 'صن' && m === 'دبل' && !canDouble;
                  const isSelected = multiplier === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMultiplier(isSelected ? 'عادي' : m)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center justify-center rounded-xl py-2 px-3 transition-all active:scale-95",
                        isSelected 
                          ? m === 'قهوة' 
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                            : "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                        isDisabled && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span className="text-sm font-medium">{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Points Entry - Only show if not Kaboot */}
          {!kabootTeam && (
            <div className="space-y-2">
              {/* Entry Team Toggle - Inline with Input */}
              <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => setEntryTeam(1)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      entryTeam === 1 
                        ? "bg-blue-600 text-white" 
                        : "text-muted-foreground"
                    )}
                  >
                    {game.team1Name}
                  </button>
                  <button
                    onClick={() => setEntryTeam(2)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      entryTeam === 2 
                        ? "bg-rose-600 text-white" 
                        : "text-muted-foreground"
                    )}
                  >
                    {game.team2Name}
                  </button>
                </div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={entryTeamCardsRaw}
                  onChange={(e) => setEntryTeamCardsRaw(arabicToWestern(e.target.value).replace(/[^0-9]/g, ''))}
                  placeholder="البنط"
                  className="text-center text-xl h-12 flex-1 font-bold"
                  disabled={multiplier === 'قهوة'}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setShowScanner(true)}
                  disabled={multiplier === 'قهوة'}
                  className="h-12 w-12 shrink-0"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview - Compact */}
          {showPreview && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className={cn(
                "rounded-lg py-2",
                "bg-blue-500/10"
              )}>
                <div className="text-xs text-blue-400">{game.team1Name}</div>
                <div className="text-xl font-bold">{game.team1Score + preview.finalTeam1Points}</div>
              </div>
              <div className={cn(
                "rounded-lg py-2",
                "bg-rose-500/10"
              )}>
                <div className="text-xs text-rose-400">{game.team2Name}</div>
                <div className="text-xl font-bold">{game.team2Score + preview.finalTeam2Points}</div>
              </div>
            </div>
          )}

          {/* Submit and Undo Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              className="flex-1 text-lg py-5"
              size="lg"
            >
              احسب
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => setShowUndoConfirm(true)}
              disabled={unifiedHistory.length === 0}
              className="py-5 px-4"
              title="تراجع"
            >
              <Undo2 className="h-5 w-5" />
            </Button>
          </div>
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

      {/* Dialog المية */}
      <Dialog open={showMiyaDialog} onOpenChange={setShowMiyaDialog}>
        <DialogContent className="max-w-xs p-4" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center text-base">المية؟</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleMiyaDoubleOnly}
              className="py-5 text-lg font-bold"
            >
              ×2
            </Button>
            <Button
              onClick={handleMiyaWithMultiplier}
              className="py-5 text-lg font-bold"
            >
              {multiplier}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
};

export default AddRound;
