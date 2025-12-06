-- Crear tabla para plantillas de mensajes
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para admins
CREATE POLICY "Admins have full access to message_templates" 
ON public.message_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'admin'
));

-- Lectura para diseñadores
CREATE POLICY "Designers can view message_templates" 
ON public.message_templates 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'designer'
));

-- Trigger para updated_at
CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_publication_planning_updated_at();

-- Insertar plantillas por defecto
INSERT INTO public.message_templates (name, content, description, is_default, category) VALUES
('Recordatorio de pago (con plazo)', '*Buenos días, {nombre}.*

Este es un mensaje automático.

Les recordamos la fecha de pago del día {plazo_inicio} al {dia_pago} de cada mes.

Los valores actualizados pueden encontrarlos en el siguiente enlace:
*Link:* https://gleztin.com.ar/index.php/valores-de-redes-sociales/
*Contraseña:* Gleztin (con mayúscula al inicio).

Si ya realizó el pago o la fecha indicada es incorrecta, le pedimos que nos lo informe.

En caso de tener alguna duda o no poder realizar el pago dentro de la fecha establecida, por favor, contáctenos.

Muchas gracias.', 'Recordatorio de pago con rango de fechas', true, 'pago'),
('Recordatorio de pago (sin plazo)', '*Buenos días, {nombre}.*

Este es un mensaje automático.

Les recordamos que la fecha de pago es el día {dia_pago} de cada mes.

Los valores actualizados pueden encontrarlos en el siguiente enlace:
*Link:* https://gleztin.com.ar/index.php/valores-de-redes-sociales/
*Contraseña:* Gleztin (con mayúscula al inicio).

Si ya realizó el pago o la fecha indicada es incorrecta, le pedimos que nos lo informe.

En caso de tener alguna duda o no poder realizar el pago dentro de la fecha establecida, por favor, contáctenos.

Muchas gracias.', 'Recordatorio de pago simple', true, 'pago'),
('Actualización de valores', 'Hola {nombre}, a partir de mañana 25 van a entrar en vigencia los valores actualizados. Los mismos los vas a encontrar en el siguiente link:

*Link*: https://gleztin.com.ar/index.php/valores-de-redes-sociales/

*Contraseña*: Gleztin (con mayúscula al inicio)

*En caso de no haber abonado el paquete anterior se cobrará con los valores actuales.*

Todos los *25 de cada mes* vamos a actualizar los valores en este mismo link.

Que tengas un buen día

ATTE: Gleztin Marketing Digital', 'Mensaje de actualización de precios', true, 'valores');