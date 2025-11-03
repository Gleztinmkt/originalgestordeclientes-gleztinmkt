-- Drop the existing policy for designers viewing clients
DROP POLICY IF EXISTS "Designers can view clients from their agency" ON public.clients;

-- Create a new policy that allows designers to view all clients when agency_id is null
-- or to view clients from their agency when they have an agency_id
CREATE POLICY "Designers can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'designer'::user_role
  )
  AND (
    -- If the designer has no agency_id, they can see all clients
    (SELECT agency_id FROM profiles WHERE id = auth.uid()) IS NULL
    -- Or if they have an agency_id, they can see clients from their agency
    OR agency_id IN (
      SELECT profiles.agency_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
);