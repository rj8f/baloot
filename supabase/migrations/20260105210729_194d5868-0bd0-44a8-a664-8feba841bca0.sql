-- Create games history table
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team1_name TEXT NOT NULL DEFAULT 'لنا',
  team2_name TEXT NOT NULL DEFAULT 'لهم',
  team1_score INTEGER NOT NULL DEFAULT 0,
  team2_score INTEGER NOT NULL DEFAULT 0,
  winner INTEGER, -- 1 or 2 or null if not finished
  rounds JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no auth required for this app)
CREATE POLICY "Anyone can read games" 
ON public.games 
FOR SELECT 
USING (true);

-- Allow public insert
CREATE POLICY "Anyone can insert games" 
ON public.games 
FOR INSERT 
WITH CHECK (true);

-- Allow public update
CREATE POLICY "Anyone can update games" 
ON public.games 
FOR UPDATE 
USING (true);

-- Allow public delete
CREATE POLICY "Anyone can delete games" 
ON public.games 
FOR DELETE 
USING (true);