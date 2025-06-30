
-- Crear perfiles para usuarios que tienen roles pero no tienen perfiles
INSERT INTO public.profiles (id, full_name)
SELECT 
    ur.user_id,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Usuario Diseñador') as full_name
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.id = ur.user_id
LEFT JOIN auth.users au ON au.id = ur.user_id
WHERE p.id IS NULL
AND ur.role = 'designer';
