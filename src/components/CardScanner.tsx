import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Loader2, Check } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { GameType, Multiplier } from '@/types/baloot';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CardScannerProps {
  gameType: GameType;
  buyingTeam: 1 | 2;
  multiplier: Multiplier;
  onClose: () => void;
  onSuccess: (totalPoints: number) => void;
}

interface AnalysisResult {
  cards: string[];
  trickPoints: number;
  projects: { name: string; points: number }[];
  totalPoints: number;
  notes: string;
}

type TrumpSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

const TRUMP_SUITS: { value: TrumpSuit; label: string; icon: string }[] = [
  { value: 'hearts', label: 'هارت', icon: '♥️' },
  { value: 'diamonds', label: 'دينار', icon: '♦️' },
  { value: 'clubs', label: 'كلب', icon: '♣️' },
  { value: 'spades', label: 'بستوني', icon: '♠️' },
];

const CardScanner = ({ gameType, buyingTeam, multiplier, onClose, onSuccess }: CardScannerProps) => {
  const { game } = useGame();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [trumpSuit, setTrumpSuit] = useState<TrumpSuit | null>(null);
  const [showTrumpSelector, setShowTrumpSelector] = useState(gameType === 'حكم');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('لا يمكن الوصول للكاميرا');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const captureFromCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    if (gameType === 'حكم' && !trumpSuit) {
      toast.error('يرجى اختيار نوع الحكم أولاً');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-cards', {
        body: { 
          imageBase64: capturedImage,
          gameType,
          trumpSuit: gameType === 'حكم' ? trumpSuit : undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
    } catch (error) {
      console.error('Error analyzing cards:', error);
      toast.error('حدث خطأ في تحليل الصورة');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmResult = () => {
    if (!result) return;
    onSuccess(result.totalPoints);
    onClose();
  };

  const resetScan = () => {
    setCapturedImage(null);
    setResult(null);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">📷 تصوير الأوراق</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Trump Suit Selector for حكم */}
          {gameType === 'حكم' && showTrumpSelector && (
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر نوع الحكم (الطرنيب)</label>
              <div className="grid grid-cols-4 gap-2">
                {TRUMP_SUITS.map((suit) => (
                  <Button
                    key={suit.value}
                    variant={trumpSuit === suit.value ? 'default' : 'outline'}
                    onClick={() => {
                      setTrumpSuit(suit.value);
                      setShowTrumpSelector(false);
                    }}
                    className="flex flex-col items-center py-4 text-lg"
                  >
                    <span className="text-2xl">{suit.icon}</span>
                    <span className="text-xs mt-1">{suit.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Show selected trump suit */}
          {gameType === 'حكم' && trumpSuit && !showTrumpSelector && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <span className="text-sm">نوع الحكم:</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTrumpSelector(true)}
                className="text-lg"
              >
                {TRUMP_SUITS.find(s => s.value === trumpSuit)?.icon} {TRUMP_SUITS.find(s => s.value === trumpSuit)?.label}
              </Button>
            </div>
          )}

          {(!showTrumpSelector || gameType === 'صن') && (
            <>
              {!capturedImage ? (
                <>
                  {isStreaming ? (
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button onClick={captureFromCamera} className="flex-1">
                          <Camera className="h-4 w-4 ml-2" />
                          التقط الصورة
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button onClick={startCamera} className="w-full py-8 text-lg">
                        <Camera className="h-6 w-6 ml-2" />
                        فتح الكاميرا
                      </Button>
                      
                      <div className="text-center text-muted-foreground">أو</div>
                      
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-6"
                      >
                        اختر صورة من المعرض
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured cards"
                      className="w-full rounded-lg"
                    />
                    {!result && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetScan}
                        className="absolute top-2 left-2 bg-background/80"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {!result && !isAnalyzing && (
                    <Button onClick={analyzeImage} className="w-full py-6 text-lg">
                      تحليل الأوراق بالذكاء الاصطناعي
                    </Button>
                  )}

                  {isAnalyzing && (
                    <div className="flex items-center justify-center gap-3 py-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>جاري التحليل...</span>
                    </div>
                  )}

                  {result && (
                    <Card className="border-primary/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-center">✅ نتيجة التحليل</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                          <span className="font-medium">نقاط الأكلات</span>
                          <span className="text-2xl font-bold text-primary">{result.trickPoints}</span>
                        </div>

                        {result.projects.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-muted-foreground">المشاريع:</span>
                            {result.projects.map((project, i) => (
                              <div key={i} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span>{project.name}</span>
                                <span className="font-bold">+{project.points}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center p-4 bg-accent/20 rounded-lg border-2 border-accent">
                          <span className="font-bold text-lg">المجموع</span>
                          <span className="text-4xl font-bold text-accent">{result.totalPoints}</span>
                        </div>

                        {result.notes && (
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{result.notes}</p>
                        )}

                        <p className="text-center text-sm text-muted-foreground pt-2">
                          هل تريد إدخال هذه النتيجة؟
                        </p>

                        <div className="flex gap-2 pt-2">
                          <Button onClick={confirmResult} className="flex-1 py-5 text-lg">
                            <Check className="h-5 w-5 ml-2" />
                            تأكيد الإدخال
                          </Button>
                          <Button variant="outline" onClick={resetScan} className="flex-1 py-5">
                            إعادة التصوير
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            صوّر أوراق المشتري ({buyingTeam === 1 ? game?.team1Name : game?.team2Name}) في نهاية الجولة
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardScanner;
