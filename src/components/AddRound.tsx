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

interface AddRoundProps {
  onPreviewChange?: (preview: { team1: number; team2: number } | null) => void;
}

const AddRound = ({ onPreviewChange }: AddRoundProps) => {
  const { game, addRound, canDoubleSun, previewRoundResult, getUnifiedHistory, undoLast } = useGame();
  const { settings } = useSettings();
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [gameType, setGameType] = useState<GameType>('صن');
  const [buyingTeam, setBuyingTeam] = useState<1 | 2>(1);
  const [entryTeam, setEntryTeam] = useState<1 | 2>(1);
  const [entryTeamCardsRaw, setEntryTeamCardsRaw] = useState('');
  const [projectsTeam, setProjectsTeam] = useState<1 | 2 | null>(null);
  const [projects, setProjects] = useState<TeamProjects>(createEmptyProjects());
  const [balootTeam, setBalootTeam] = useState<1 | 2 | null>(null);
  const [balootCount, setBalootCount] = useState(0);
  const [multiplier, setMultiplier] = useState<Multiplier>('عادي');
  const [showScanner, setShowScanner] = useState(false);
  const [kabootTeam, setKabootTeam] = useState<1 | 2 | null>(null);
  const [showKabootDialog, setShowKabootDialog] = useState(false);
  

  const unifiedHistory = getUnifiedHistory();

  // Reset when game type changes
  useEffect(() => {
    setProjectsTeam(null);
    setProjects(createEmptyProjects());
    setEntryTeamCardsRaw('');
    setKabootTeam(null);
    setMultiplier('عادي');
    setBalootTeam(null);
    setBalootCount(0);
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

  // المشاريع بدون البلوت (البلوت منفصل)
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

  // Get team1 and team2 projects based on selected projectsTeam + balootTeam
  const team1Projects: TeamProjects = {
    ...(projectsTeam === 1 ? projects : createEmptyProjects()),
    بلوت: balootTeam === 1 ? balootCount : 0,
  };
  const team2Projects: TeamProjects = {
    ...(projectsTeam === 2 ? projects : createEmptyProjects()),
    بلوت: balootTeam === 2 ? balootCount : 0,
  };

  // تحديد وضع المشاريع حسب الدبل
  const getProjectMultiplierInfo = () => {
    const mode = settings.projectMultiplierMode;
    
    // إذا 'full' = كل المشاريع تتبع المضاعف الكامل
    if (mode === 'full') {
      return { miyaDoubleOnly: false, allProjectsDoubleOnly: false };
    }
    
    // لا نطبق القيود إلا في حكم مع ×3 أو ×4
    if (gameType !== 'حكم') return { miyaDoubleOnly: false, allProjectsDoubleOnly: false };
    if (multiplier !== '×3' && multiplier !== '×4') return { miyaDoubleOnly: false, allProjectsDoubleOnly: false };
    if (kabootTeam) return { miyaDoubleOnly: false, allProjectsDoubleOnly: false };
    
    if (mode === 'miya-x2') {
      // المية فقط أقصاها ×2
      const hasMiya = team1Projects.مية > 0 || team2Projects.مية > 0;
      return { miyaDoubleOnly: hasMiya, allProjectsDoubleOnly: false };
    }
    
    if (mode === 'all-x2') {
      // كل المشاريع (سرا، 50، 100) أقصاها ×2
      const hasProjects = (team1Projects.سرا > 0 || team1Projects.خمسين > 0 || team1Projects.مية > 0) ||
                          (team2Projects.سرا > 0 || team2Projects.خمسين > 0 || team2Projects.مية > 0);
      return { miyaDoubleOnly: false, allProjectsDoubleOnly: hasProjects };
    }
    
    return { miyaDoubleOnly: false, allProjectsDoubleOnly: false };
  };

  const handleSubmit = () => {
    if ((totals.team1Cards === 0 && totals.team2Cards === 0) && multiplier !== 'قهوة' && !kabootTeam) return;

    const { miyaDoubleOnly, allProjectsDoubleOnly } = getProjectMultiplierInfo();
    submitRound(team1Projects, team2Projects, miyaDoubleOnly, allProjectsDoubleOnly);
  };

  const submitRound = (t1Projects: TeamProjects, t2Projects: TeamProjects, miyaDoubleOnly: boolean, allProjectsDoubleOnly: boolean) => {
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
      allProjectsDoubleOnly,
      hokmWithoutPointsMode: settings.hokmWithoutPointsMode,
    });

    // Reset form
    setEntryTeamCardsRaw('');
    setProjectsTeam(null);
    setProjects(createEmptyProjects());
    setMultiplier('عادي');
    setKabootTeam(null);
    setBalootTeam(null);
    setBalootCount(0);
  };


  const handleScanSuccess = (totalPoints: number) => {
    setEntryTeamCardsRaw(totalPoints.toString());
  };

  // Calculate preview
  const getPreview = () => {
    const team1Raw = kabootTeam ? 0 : totals.team1Cards;
    const team2Raw = kabootTeam ? 0 : totals.team2Cards;
    const { miyaDoubleOnly, allProjectsDoubleOnly } = getProjectMultiplierInfo();
    return previewRoundResult({
      gameType,
      buyingTeam,
      team1RawPoints: team1Raw,
      team2RawPoints: team2Raw,
      team1Projects,
      team2Projects,
      multiplier,
      kabootTeam,
      miyaDoubleOnly,
      allProjectsDoubleOnly,
      hokmWithoutPointsMode: settings.hokmWithoutPointsMode,
    });
  };

  const preview = getPreview();
  const showPreview = entryTeamCardsRaw || kabootTeam;

  // Send preview to parent
  useEffect(() => {
    if (showPreview && onPreviewChange) {
      onPreviewChange({
        team1: preview.finalTeam1Points,
        team2: preview.finalTeam2Points,
      });
    } else if (onPreviewChange) {
      onPreviewChange(null);
    }
  }, [showPreview, preview.finalTeam1Points, preview.finalTeam2Points, onPreviewChange]);

  return (
    <>
      <Card className="mx-4 mb-4 overflow-hidden glass border-border/50 shadow-xl">
        <CardContent className="p-4 space-y-4">
          {/* Top Bar: Game Type Toggle */}
          <div className="flex bg-muted rounded-lg p-0.5 h-12">
            <button
              onClick={() => { setGameType('صن'); setMultiplier('عادي'); }}
              className={cn(
                "flex-1 rounded-md text-sm font-medium transition-all flex items-center justify-center",
                gameType === 'صن' 
                  ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              صن
            </button>
            <button
              onClick={() => { setGameType('حكم'); setMultiplier('عادي'); }}
              className={cn(
                "flex-1 rounded-md text-sm font-medium transition-all flex items-center justify-center",
                gameType === 'حكم' 
                  ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              حكم
            </button>
          </div>

          {/* Buying Team - Above Points Entry */}
          <div className="flex bg-muted rounded-lg p-0.5 h-12">
            <button
              onClick={() => setBuyingTeam(1)}
              className={cn(
                "flex-1 rounded-md text-sm font-medium transition-all flex flex-col items-center justify-center",
                buyingTeam === 1 
                  ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              <span className="text-[9px] opacity-70 leading-none">المشترى</span>
              <span className="text-sm font-medium leading-tight">{game.team1Name}</span>
            </button>
            <button
              onClick={() => setBuyingTeam(2)}
              className={cn(
                "flex-1 rounded-md text-sm font-medium transition-all flex flex-col items-center justify-center",
                buyingTeam === 2 
                  ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-sm" 
                  : "text-muted-foreground"
              )}
            >
              <span className="text-[9px] opacity-70 leading-none">المشترى</span>
              <span className="text-sm font-medium leading-tight">{game.team2Name}</span>
            </button>
          </div>

          {/* Points Entry - Under Buying Team */}
          {!kabootTeam && (
            <div className="flex items-center gap-2">
              <div className="flex bg-muted rounded-lg p-0.5 h-12">
                <button
                  onClick={() => setEntryTeam(1)}
                  className={cn(
                    "w-10 rounded-md text-xs font-medium transition-all flex items-center justify-center",
                    entryTeam === 1 
                      ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  {game.team1Name}
                </button>
                <button
                  onClick={() => setEntryTeam(2)}
                  className={cn(
                    "w-10 rounded-md text-xs font-medium transition-all flex items-center justify-center",
                    entryTeam === 2 
                      ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-sm" 
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
                onChange={(e) => {
                  const cleaned = arabicToWestern(e.target.value).replace(/[^0-9]/g, '');
                  const value = parseInt(cleaned) || 0;
                  // الحد الأقصى: صن = 130، حكم = 162
                  if (value <= totalPoints) {
                    setEntryTeamCardsRaw(cleaned);
                  } else {
                    setEntryTeamCardsRaw(totalPoints.toString());
                  }
                }}
                placeholder="عدد الأبناط"
                className="text-center text-xl h-12 flex-1 font-bold placeholder:text-muted-foreground/40 placeholder:text-sm"
                disabled={multiplier === 'قهوة'}
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  import('sonner').then(({ toast }) => {
                    toast.info('قيد الإنشاء');
                  });
                }}
                disabled={multiplier === 'قهوة'}
                className="h-12 w-12 shrink-0"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Submit and Undo Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              className="flex-1 text-lg py-5 btn-press bg-gradient-to-r from-team-start to-team-end hover:opacity-90 shadow-lg"
              size="lg"
            >
              احسب
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => setShowUndoConfirm(true)}
              disabled={unifiedHistory.length === 0}
              className="py-5 px-4 btn-press"
              title="تراجع"
            >
              <Undo2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Kaboot Button - Single */}
          <button
            onClick={() => {
              if (kabootTeam) {
                setKabootTeam(null);
                setProjectsTeam(null);
                setProjects(createEmptyProjects());
              } else {
                setShowKabootDialog(true);
              }
            }}
            className={cn(
              "w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1",
              kabootTeam 
                ? "bg-amber-500 text-white shadow-lg" 
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
            )}
          >
            <Zap className="h-3.5 w-3.5" />
            {kabootTeam ? `كبوت ${kabootTeam === 1 ? game.team1Name : game.team2Name}` : 'كبوت'}
          </button>

          {/* Projects & Baloot Section (only when not kaboot) */}
          {!kabootTeam && (
            <div className="space-y-2">
              {/* Row 1: Team buttons for Projects + Baloot (Hokm) or just Projects (Sun) */}
              <div className={cn("grid gap-2", gameType === 'حكم' ? "grid-cols-4" : "grid-cols-2")}>
                {/* Projects Team 1 */}
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
                    "flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all active:scale-95",
                    projectsTeam === 1 
                      ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-lg" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-[10px] opacity-70">المشاريع</span>
                  <span className="text-sm font-medium">{game.team1Name}</span>
                </button>

                {/* Projects Team 2 */}
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
                    "flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all active:scale-95",
                    projectsTeam === 2 
                      ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-lg" 
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-[10px] opacity-70">المشاريع</span>
                  <span className="text-sm font-medium">{game.team2Name}</span>
                </button>

                {/* Baloot Team 1 (Hokm only) */}
                {gameType === 'حكم' && (
                  <button
                    onClick={() => {
                      if (balootTeam === 1) {
                        setBalootTeam(null);
                        setBalootCount(0);
                      } else {
                        setBalootTeam(1);
                        setBalootCount(1);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all active:scale-95",
                      balootTeam === 1 
                        ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-lg" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-[10px] opacity-70">بلوت</span>
                    <span className="text-sm font-medium">{game.team1Name}</span>
                  </button>
                )}

                {/* Baloot Team 2 (Hokm only) */}
                {gameType === 'حكم' && (
                  <button
                    onClick={() => {
                      if (balootTeam === 2) {
                        setBalootTeam(null);
                        setBalootCount(0);
                      } else {
                        setBalootTeam(2);
                        setBalootCount(1);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all active:scale-95",
                      balootTeam === 2 
                        ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-lg" 
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-[10px] opacity-70">بلوت</span>
                    <span className="text-sm font-medium">{game.team2Name}</span>
                  </button>
                )}
              </div>

              {/* Row 2: Project Chips */}
              <div className={cn("grid gap-2", gameType === 'صن' ? "grid-cols-4" : "grid-cols-3")}>
                {availableProjects.map((p) => {
                  const count = projects[p.key];
                  const isDisabled = !projectsTeam;
                  return (
                    <button
                      key={p.key}
                      onClick={() => projectsTeam && cycleProject(p.key)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-xl py-2 px-3 transition-all active:scale-95",
                        count > 0 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                        isDisabled && "opacity-40"
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
            </div>
          )}

          {/* Multiplier */}
          {!kabootTeam && (
            <div className={cn("grid gap-2", gameType === 'صن' ? "grid-cols-1" : "grid-cols-4")}>
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
          )}

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


      {/* Kaboot Dialog */}
      <Dialog open={showKabootDialog} onOpenChange={setShowKabootDialog}>
        <DialogContent className="max-w-sm p-4 rounded-2xl" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              كبوت
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Game Type Selection in Kaboot - Vertical */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setGameType('صن')}
                className={cn(
                  "py-3 rounded-xl font-bold text-sm transition-all",
                  gameType === 'صن' 
                    ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-lg" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                صن
              </button>
              <button
                onClick={() => setGameType('حكم')}
                className={cn(
                  "py-3 rounded-xl font-bold text-sm transition-all",
                  gameType === 'حكم' 
                    ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-lg" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                حكم
              </button>
            </div>

            {/* Team Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setKabootTeam(1);
                  setProjectsTeam(1);
                  setProjects(createEmptyProjects());
                }}
                className={cn(
                  "py-2 rounded-lg font-bold text-sm transition-all border-2 flex flex-col items-center",
                  kabootTeam === 1 
                    ? "bg-gradient-to-b from-team-start to-team-end border-team-start text-primary-foreground shadow-lg" 
                    : "bg-transparent border-border text-muted-foreground hover:border-team-start/60"
                )}
              >
                {game.team1Name}
              </button>
              <button
                onClick={() => {
                  setKabootTeam(2);
                  setProjectsTeam(2);
                  setProjects(createEmptyProjects());
                }}
                className={cn(
                  "py-2 rounded-lg font-bold text-sm transition-all border-2 flex flex-col items-center",
                  kabootTeam === 2 
                    ? "bg-gradient-to-b from-team-start to-team-end border-team-start text-primary-foreground shadow-lg" 
                    : "bg-transparent border-border text-muted-foreground hover:border-team-start/60"
                )}
              >
                {game.team2Name}
              </button>
            </div>

            {/* Projects in Kaboot */}
            {kabootTeam && (
              <div className={cn("grid gap-2", gameType === 'صن' ? "grid-cols-4" : "grid-cols-3")}>
                {availableProjects.map((p) => {
                  const count = projects[p.key];
                  return (
                    <button
                      key={p.key}
                      onClick={() => cycleProject(p.key)}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-xl py-2 px-3 transition-all active:scale-95",
                        count > 0 
                          ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-md" 
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

            {/* Baloot in Kaboot (Hokm only) */}
            {kabootTeam && gameType === 'حكم' && (
              <button
                onClick={() => {
                  if (balootTeam === kabootTeam) {
                    setBalootTeam(null);
                    setBalootCount(0);
                  } else {
                    setBalootTeam(kabootTeam);
                    setBalootCount(1);
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-center gap-1 rounded-xl py-2 px-3 transition-all active:scale-95",
                  balootTeam === kabootTeam 
                    ? "bg-gradient-to-b from-team-start to-team-end text-primary-foreground shadow-md" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="text-sm font-medium">بلوت</span>
                {balootTeam === kabootTeam && (
                  <span className="text-xs font-bold">x1</span>
                )}
              </button>
            )}

            {/* Preview in Kaboot */}
            {kabootTeam && (
              <div className="flex items-center justify-center gap-4 py-2 px-3 rounded-lg bg-muted/50">
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">{game.team1Name}</span>
                  <p className="text-lg font-bold bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">{game.team1Score + preview.finalTeam1Points}</p>
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">{game.team2Name}</span>
                  <p className="text-lg font-bold bg-gradient-to-b from-team-start to-team-end bg-clip-text text-transparent">{game.team2Score + preview.finalTeam2Points}</p>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={() => {
              handleSubmit();
              setShowKabootDialog(false);
            }} 
            className="w-full mt-2"
            disabled={!kabootTeam}
          >
            احسب
          </Button>
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
