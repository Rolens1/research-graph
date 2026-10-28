-- 0003_user_theme_preference.sql
-- Add theme preference column to public.profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme VARCHAR(16) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark'));

-- Ensure RLS update policy permits authenticated users to update their own profile theme
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'profiles_update_policy'
  ) THEN
    CREATE POLICY profiles_update_policy ON public.profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;
