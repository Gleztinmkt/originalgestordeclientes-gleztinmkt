-- Enable RLS
ALTER TABLE deleted_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now
CREATE POLICY "Enable all access for now"
ON deleted_items
FOR ALL
TO authenticated
USING (true);