-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to receipts bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts');

-- Allow public reads from receipts bucket
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');
