-- Limpiar y recrear políticas RLS para tabla clients
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
DROP POLICY IF EXISTS "Enable all access" ON clients;
DROP POLICY IF EXISTS "Enable delete for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for all users" ON clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable update for all users" ON clients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON clients;

-- Políticas simples y claras para clients
CREATE POLICY "Admins have full access to clients"
ON clients
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Designers can view clients from their agency"
ON clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'designer'
  )
  AND agency_id IN (
    SELECT agency_id FROM profiles WHERE id = auth.uid()
  )
);

-- Limpiar y recrear políticas RLS para tabla publications
DROP POLICY IF EXISTS "Authenticated users can delete publications" ON publications;
DROP POLICY IF EXISTS "Authenticated users can insert publications" ON publications;
DROP POLICY IF EXISTS "Authenticated users can update publications" ON publications;
DROP POLICY IF EXISTS "Authenticated users can view publications" ON publications;
DROP POLICY IF EXISTS "Enable full access for admins" ON publications;
DROP POLICY IF EXISTS "Enable limited updates for designers" ON publications;
DROP POLICY IF EXISTS "Enable read access for designers" ON publications;
DROP POLICY IF EXISTS "Enable update for all users" ON publications;

-- Políticas simples para publications
CREATE POLICY "Admins have full access to publications"
ON publications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Designers can view and update publications"
ON publications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'designer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'designer'
  )
);

-- Limpiar y recrear políticas RLS para tabla tasks
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable delete for all users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for all users" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable update for all users" ON tasks;

-- Políticas simples para tasks
CREATE POLICY "Admins have full access to tasks"
ON tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Designers can view tasks"
ON tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'designer'
  )
);