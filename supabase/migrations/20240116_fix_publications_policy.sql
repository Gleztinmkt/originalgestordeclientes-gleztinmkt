-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for now" ON publications;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON publications
FOR SELECT
TO public
USING (
  deleted_at IS NULL
);

CREATE POLICY "Enable insert for authenticated users"
ON publications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON publications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON publications
FOR DELETE
TO authenticated
USING (true);