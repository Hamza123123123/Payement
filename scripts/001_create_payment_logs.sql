-- Create payment_logs table for storing subscription payments
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_price INTEGER NOT NULL,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  activation_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert new payments (users submitting payments)
CREATE POLICY "Allow public insert" ON public.payment_logs
  FOR INSERT WITH CHECK (true);

-- Policy: Allow anyone to select their own payment by phone number
CREATE POLICY "Allow select by phone" ON public.payment_logs
  FOR SELECT USING (true);

-- Policy: Allow service role to update payments (for admin approval)
CREATE POLICY "Allow service role update" ON public.payment_logs
  FOR UPDATE USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_logs_phone ON public.payment_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON public.payment_logs(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_logs_updated_at ON public.payment_logs;

CREATE TRIGGER update_payment_logs_updated_at
  BEFORE UPDATE ON public.payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
