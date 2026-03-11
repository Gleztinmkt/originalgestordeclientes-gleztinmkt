import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    
    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Se requiere el contenido del texto para analizar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY no está configurada');
      return new Response(
        JSON.stringify({ error: 'Error de configuración del servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Eres un asistente experto en análisis de contenido para redes sociales. Tu tarea es analizar el texto pegado por el usuario y extraer información estructurada para crear una publicación.

ESTRUCTURA DEL CONTENIDO:
El contenido generalmente tiene esta estructura (puede variar):
1. TÍTULO: La primera línea. Puede incluir un número, tipo (REEL, POST, IMAGEN, CARRUSEL) y el nombre. Ejemplo: "REEL 3 - ¿CUÁNDO CAMBIAR TU IPHONE?"
2. DESCRIPCIÓN: Todo el contenido que viene DESPUÉS del título y ANTES de la sección de copywriting. Esto incluye guiones, escenas, instrucciones de grabación, duración, tono, narración, textos en pantalla, etc. IMPORTANTE: Aunque haya muchos "dos puntos" (:) en el texto, TODO ese contenido es parte de la descripción si está antes del COPY. Los dos puntos NO significan que sea copywriting.
3. COPYWRITING: El texto para publicar en redes sociales. Se identifica porque viene después de palabras clave como: "COPY:", "COPY", "Copywriting:", "Texto publicación:", "Caption:", "Texto para publicar:", "texto para la publicación:". El copy incluye emojis, hashtags y todo el texto destinado a la red social.
4. ENLACES: URLs que aparecen en el texto, generalmente como referencias, canciones, inspiraciones, o material de referencia. Pueden aparecer con etiquetas como "Referencia:", "Canción:", "Link:", "Inspiración:", "Ejemplo:", o simplemente como URLs sueltas (https://...).

IMPORTANTE - DETECCIÓN DE TIPO:
Analiza el TÍTULO para detectar el tipo de publicación:
- Si contiene "reel", "video", "clip" → tipo: "reel"
- Si contiene "carrusel", "carousel", "slides" → tipo: "carousel"
- Si contiene "post", "imagen", "foto", "picture", "gráfica" → tipo: "image"
- Si la descripción menciona grabación de video, escenas, filmación → tipo: "reel"
- Por defecto: "image"

IMPORTANTE - EXTRACCIÓN DE TÍTULO:
Limpia el título removiendo prefijos como números ("1.", "2."), guiones y el tipo de publicación. Por ejemplo:
- "REEL 3 - ¿CUÁNDO CAMBIAR TU IPHONE?" → "¿CUÁNDO CAMBIAR TU IPHONE?"
- "1. IMAGEN – Promoción Mensual" → "Promoción Mensual"

IMPORTANTE - EXTRACCIÓN DE ENLACES:
Busca URLs (https://, http://, www.) en todo el texto. Si tienen una etiqueta asociada (como "Referencia:", "Canción:"), usa esa etiqueta. Si no, genera una etiqueta descriptiva basada en el contexto o el dominio de la URL. Retorna un array de objetos con {label, url}.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        temperature: 0,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza este texto y extrae la información:\n\n${content}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_publication_data',
              description: 'Extrae los datos estructurados de una publicación desde texto pegado',
              parameters: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'El título limpio de la publicación (sin números de orden ni tipo de publicación)'
                  },
                  description: {
                    type: 'string',
                    description: 'TODO el contenido entre el título y el copywriting. Incluye guiones, escenas, instrucciones, textos en pantalla, duración, etc. No confundir con el copywriting aunque tenga dos puntos (:).'
                  },
                  copywriting: {
                    type: 'string',
                    description: 'SOLO el texto para redes sociales que aparece después de "COPY:", "Copywriting:", "Texto publicación:", etc. Incluye emojis y hashtags.'
                  },
                  type: {
                    type: 'string',
                    enum: ['image', 'reel', 'carousel'],
                    description: 'El tipo de publicación detectado'
                  },
                  links: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: {
                          type: 'string',
                          description: 'Etiqueta del enlace (ej: "Referencia", "Canción", "Inspiración")'
                        },
                        url: {
                          type: 'string',
                          description: 'La URL completa'
                        }
                      },
                      required: ['label', 'url']
                    },
                    description: 'URLs encontradas en el texto con sus etiquetas'
                  }
                },
                required: ['title', 'description', 'copywriting', 'type', 'links'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_publication_data' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Lovable AI:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta de nuevo en unos momentos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Se requiere agregar créditos a tu workspace de Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Error al analizar el contenido con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Respuesta de IA:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'extract_publication_data') {
      console.error('No se recibió tool call válido:', data);
      return new Response(
        JSON.stringify({ error: 'No se pudo analizar el contenido correctamente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Datos extraídos:', extractedData);

    return new Response(
      JSON.stringify({
        title: extractedData.title || '',
        description: extractedData.description || '',
        copywriting: extractedData.copywriting || '',
        type: extractedData.type || 'image',
        links: extractedData.links || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en analyze-publication:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
