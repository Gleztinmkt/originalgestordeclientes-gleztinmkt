
-- Habilitar RLS en la tabla publications si no está habilitado
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Enable all access for now" ON publications;
DROP POLICY IF EXISTS "Enable read access for all users" ON publications;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON publications;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON publications;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON publications;

-- Crear política que permita a todos los usuarios autenticados ver publicaciones
CREATE POLICY "Authenticated users can view publications"
ON publications
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Crear política que permita a todos los usuarios autenticados insertar publicaciones
CREATE POLICY "Authenticated users can insert publications"
ON publications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Crear política que permita a todos los usuarios autenticados actualizar publicaciones
CREATE POLICY "Authenticated users can update publications"
ON publications
FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);

-- Crear política que permita a todos los usuarios autenticados eliminar publicaciones (soft delete)
CREATE POLICY "Authenticated users can delete publications"
ON publications
FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);

-- También verificar que los clientes sean visibles para usuarios autenticados
-- Habilitar RLS en clients si no está habilitado
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Crear política para que usuarios autenticados puedan ver clientes
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;
CREATE POLICY "Authenticated users can view clients"
ON clients
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Crear política para que usuarios autenticados puedan insertar clientes
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
CREATE POLICY "Authenticated users can insert clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Crear política para que usuarios autenticados puedan actualizar clientes
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
CREATE POLICY "Authenticated users can update clients"
ON clients
FOR UPDATE
TO authenticated
USING (deleted_at IS NULL)
WITH CHECK (true);
