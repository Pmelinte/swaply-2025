-- Migration: Create profiles table for Swaply 2025
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  location TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User can read own profile
CREATE POLICY "User can select own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- User can insert own profile
CREATE POLICY "User can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User can update own profile
CREATE POLICY "User can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- User can delete own profile
CREATE POLICY "User can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger for profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
