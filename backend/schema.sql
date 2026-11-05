-- ====================================================================
-- TASKFLOW DATABASE SCHEMA & POLICIES FOR SUPABASE
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Create PROFILES table (synced with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users and service_role to read profiles (needed for task assignment)
CREATE POLICY "Allow authenticated read profiles" 
    ON public.profiles FOR SELECT 
    TO authenticated, service_role 
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" 
    ON public.profiles FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id);

-- Allow service_role full access to profiles
CREATE POLICY "Allow service role full access to profiles" 
    ON public.profiles FOR ALL 
    TO service_role 
    USING (true);

-- 2. Automatically create/update profile when user signs in or registers via Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any users already created in auth.users
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 3. Create or Update TASKS table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view tasks (users can see tasks they created or are assigned to, or workspace tasks)
CREATE POLICY "Allow authenticated read tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert tasks
CREATE POLICY "Allow authenticated create tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Allow creator or assignee to update tasks
CREATE POLICY "Allow users to update relevant tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = assigned_to);

-- Allow creator to delete tasks
CREATE POLICY "Allow creator to delete tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Allow service_role full bypass and access to tasks
CREATE POLICY "Allow service role full access to tasks"
    ON public.tasks FOR ALL
    TO service_role
    USING (true);

-- 4. Grant table privileges to service_role, authenticated, and anon
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles TO anon;
