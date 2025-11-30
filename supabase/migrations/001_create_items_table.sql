-- Migration: Create items table for Swaply 2025
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User can read own items
CREATE POLICY "User can select own items"
ON public.items
FOR SELECT
USING (auth.uid() = user_id);

-- User can insert own items
CREATE POLICY "User can insert own items"
ON public.items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User can update own items
CREATE POLICY "User can update own items"
ON public.items
FOR UPDATE
USING (auth.uid() = user_id);

-- User can delete own items
CREATE POLICY "User can delete own items"
ON public.items
FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
