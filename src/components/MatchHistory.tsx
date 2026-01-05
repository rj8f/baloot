import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { History, Trophy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GameRecord {
  id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  winner: number | null;
  created_at: string;
  finished_at: string | null;
}

const MatchHistory = () => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchGames = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('games')
      .select('id, team1_name, team2_name, team1_score, team2_score, winner, created_at, finished_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setGames(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchGames();
    }
  }, [isOpen]);

  const deleteGame = async (id: string) => {
    await supabase.from('games').delete().eq('id', id);
    setGames(games.filter(g => g.id !== id));
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'd MMM yyyy - h:mm a', { locale: ar });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-12 text-muted-foreground">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>سجل المباريات</span>
            {games.length > 0 && !isOpen && (
              <span className="px-1.5 py-0.5 bg-primary/20 rounded text-xs">{games.length}</span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-2">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">لا توجد مباريات سابقة</div>
        ) : (
          <div className="space-y-2">
            {games.map((game) => (
              <Card key={game.id} className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={game.winner === 1 ? "font-bold text-blue-500" : ""}>
                          {game.team1_name}
                        </span>
                        <span className="text-xl font-bold">
                          {game.team1_score}
                        </span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-xl font-bold">
                          {game.team2_score}
                        </span>
                        <span className={game.winner === 2 ? "font-bold text-rose-500" : ""}>
                          {game.team2_name}
                        </span>
                        {game.winner && (
                          <Trophy className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(game.created_at)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/50 hover:text-destructive"
                      onClick={() => deleteGame(game.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MatchHistory;
