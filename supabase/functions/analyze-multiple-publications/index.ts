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
        JSON.stringify({ error: 'El contenido es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY no está configurada');
      return new Response(
        JSON.stringify({ error: 'Configuración de API faltante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Eres un asistente que analiza calendarios de publicaciones de redes sociales.

Tu tarea es identificar TODAS las publicaciones individuales dentro del texto proporcionado y extraer la información de cada una.

Para cada publicación, debes identificar:
1. **Título/Nombre**: El nombre o título de la publicación
2. **Tipo**: Determina si es:
   - "reel" si menciona: video, reel, reels, audiovisual
   - "carousel" si menciona: carrusel, carousel, múltiples imágenes
   - "image" si menciona: imagen, post, foto, gráfica, o si no especifica tipo
3. **Descripción**: La descripción del contenido visual o escenas del video/imagen
4. **Copywriting**: El texto que irá en la publicación (caption). Busca secciones que digan "texto publicación", "copy", "caption", "texto", etc.

IMPORTANTE:
- Separa claramente cada publicación individual
- Si no encuentras algún campo, déjalo vacío pero NO omitas la publicación
- Preserva el formato y emojis del copywriting
- Identifica TODAS las publicaciones, no solo algunas

Retorna un array con todas las publicaciones encontradas.`;

    console.log('Enviando solicitud a la IA...');

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
          { role: 'user', content: `Analiza este calendario y extrae TODAS las publicaciones:\n\n${content}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_publications',
              description: 'Extrae todas las publicaciones del calendario',
              parameters: {
                type: 'object',
                properties: {
                  publications: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: {
                          type: 'string',
                          description: 'Título o nombre de la publicación'
                        },
                        type: {
                          type: 'string',
                          enum: ['reel', 'carousel', 'image'],
                          description: 'Tipo de publicación'
                        },
                        description: {
                          type: 'string',
                          description: 'Descripción del contenido visual'
                        },
                        copywriting: {
                          type: 'string',
                          description: 'Texto que irá en la publicación'
                        }
                      },
                      required: ['title', 'type']
                    }
                  }
                },
                required: ['publications']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_publications' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido, intenta más tarde' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Se requiere agregar créditos a tu workspace de Lovable AI' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Error de la API de IA:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Error al procesar con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('Respuesta de IA:', JSON.stringify(aiResponse, null, 2));

    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== 'extract_publications') {
      console.error('No se recibió la respuesta esperada de la IA');
      return new Response(
        JSON.stringify({ error: 'Respuesta inválida de la IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Publicaciones extraídas:', result.publications.length);

    return new Response(
      JSON.stringify({ publications: result.publications }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en analyze-multiple-publications:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
