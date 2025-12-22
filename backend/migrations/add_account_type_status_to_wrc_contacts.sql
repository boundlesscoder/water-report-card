-- Migration: Add account_type and account_status fields to wrc_contacts table
-- Date: 2024

-- Add account_type column
ALTER TABLE public.wrc_contacts 
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);

-- Add account_status column
ALTER TABLE public.wrc_contacts 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN public.wrc_contacts.account_type IS 'Account type: Commercial, Residential, Institutional, or Non-Profit';
COMMENT ON COLUMN public.wrc_contacts.account_status IS 'Account status: Active, Prospect, or Inactive';

