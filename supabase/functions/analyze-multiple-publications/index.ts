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

ESTRUCTURA TÍPICA DE CADA PUBLICACIÓN:
1. TÍTULO: La primera línea de cada publicación. Puede incluir número, tipo (REEL, POST, IMAGEN, CARRUSEL) y nombre. Limpia el título removiendo prefijos numéricos y el tipo.
   - "REEL 3 - ¿CUÁNDO CAMBIAR TU IPHONE?" → título: "¿CUÁNDO CAMBIAR TU IPHONE?"
   - "1. IMAGEN – Promoción Mensual" → título: "Promoción Mensual"

2. DESCRIPCIÓN: TODO el contenido entre el título y la sección de copywriting. Incluye:
   - Guiones de video, escenas, instrucciones de grabación
   - Textos en pantalla, narración, voces
   - Duración, tono, estilo visual
   - IMPORTANTE: Aunque tenga muchos "dos puntos" (:) en el texto (como "Señal 1:", "Texto o voz:"), TODO eso es DESCRIPCIÓN, NO copywriting. La descripción termina donde empieza el COPY.

3. COPYWRITING: SOLO el texto para publicar en redes sociales. Se identifica porque viene DESPUÉS de palabras clave como:
   - "COPY:", "COPY", "Copywriting:", "Texto publicación:", "Caption:", "Texto para publicar:", "texto para la publicación:"
   - Incluye emojis, hashtags y todo el texto para la red social.
   - NO confundir textos de guión/narración con el copywriting.

4. TIPO: Determina basándote en el título y contenido:
   - "reel" si menciona: reel, video, clip, grabación, escenas de video
   - "carousel" si menciona: carrusel, carousel, múltiples imágenes, slides
   - "image" si menciona: imagen, post, foto, gráfica, o si no especifica tipo

5. ENLACES: URLs (https://, http://, www.) encontradas en el texto de cada publicación. Si tienen etiqueta asociada ("Referencia:", "Canción:", "Link:", "Inspiración:"), usar esa etiqueta. Si no, generar una etiqueta descriptiva.

IMPORTANTE:
- Separa claramente cada publicación individual
- Si no encuentras algún campo, déjalo vacío pero NO omitas la publicación
- Preserva el formato y emojis del copywriting
- Identifica TODAS las publicaciones, no solo algunas
- La DESCRIPCIÓN puede ser larga y contener muchos ":" - eso es normal en guiones de video`;

    console.log('Enviando solicitud a la IA...');

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
                          description: 'Título limpio de la publicación (sin números de orden ni tipo)'
                        },
                        type: {
                          type: 'string',
                          enum: ['reel', 'carousel', 'image'],
                          description: 'Tipo de publicación'
                        },
                        description: {
                          type: 'string',
                          description: 'Todo el contenido entre el título y el COPY (guiones, escenas, instrucciones, etc.)'
                        },
                        copywriting: {
                          type: 'string',
                          description: 'Solo el texto para redes sociales después de COPY:/Copywriting:/etc.'
                        },
                        links: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              label: {
                                type: 'string',
                                description: 'Etiqueta del enlace'
                              },
                              url: {
                                type: 'string',
                                description: 'La URL completa'
                              }
                            },
                            required: ['label', 'url']
                          },
                          description: 'URLs encontradas en esta publicación'
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
