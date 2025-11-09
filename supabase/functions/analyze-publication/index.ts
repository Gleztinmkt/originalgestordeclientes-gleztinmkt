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

IMPORTANTE - DETECCIÓN DE COPYWRITING:
Busca estas palabras clave (case-insensitive) para identificar el copywriting:
- "texto publicación"
- "texto para la publicación"
- "texto de publicación"
- "copywriting"
- "copy"
- "texto para publicar"
- "caption"

El copywriting es TODO el contenido que viene DESPUÉS de estas palabras clave, incluyendo emojis, hashtags, y el texto completo.

IMPORTANTE - DETECCIÓN DE TIPO:
Analiza el TÍTULO para detectar el tipo de publicación:
- Si contiene "post", "imagen", "foto", "picture" → tipo: "image"
- Si contiene "reel", "video", "clip" → tipo: "reel"
- Si contiene "carrusel", "carousel", "slides" → tipo: "carousel"
- Por defecto: "image"

IMPORTANTE - EXTRACCIÓN DE TÍTULO:
El título es la primera línea o encabezado principal del texto. Puede tener números o viñetas al inicio (ej: "1. ", "2. ", "• ").

IMPORTANTE - EXTRACCIÓN DE DESCRIPCIÓN:
La descripción es todo el contenido técnico/creativo entre el título y el copywriting. Incluye:
- Duración
- Tono
- Escenas
- Narración
- Guiones
- Cualquier detalle técnico o creativo`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
                    description: 'El título o nombre de la publicación (primera línea o encabezado principal)'
                  },
                  description: {
                    type: 'string',
                    description: 'La descripción técnica/creativa de la publicación (duración, tono, escenas, narración, etc.)'
                  },
                  copywriting: {
                    type: 'string',
                    description: 'El texto para redes sociales (después de "Texto publicación:", "Copywriting:", "Copy:", etc.)'
                  },
                  type: {
                    type: 'string',
                    enum: ['image', 'reel', 'carousel'],
                    description: 'El tipo de publicación detectado desde el título. "image" si contiene post/imagen/foto, "reel" si contiene reel/video, "carousel" si contiene carrusel'
                  }
                },
                required: ['title', 'description', 'copywriting', 'type'],
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

    // Extraer los argumentos del tool call
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
        type: extractedData.type || 'image'
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
