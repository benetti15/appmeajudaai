import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, attachments, image_urls = [] } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user) throw new Error('Unauthorized');
    
    console.log('AI Agent request from user:', user.id, 'message:', message);
    
    // FLUXO ESPECIAL: Detectar se é foto de solicitação de serviço
    if (image_urls && image_urls.length > 0 && !context.current_request_id && !context.step) {
      const isServiceRequest = await detectIfServiceRequestPhoto(image_urls[0], message);
      
      if (isServiceRequest) {
        console.log('Service request photo detected, starting photo flow');
        return await handlePhotoRequestCreation(image_urls[0], message, context, user, supabaseClient);
      }
    }
    
    // FLUXO ESPECIAL: Continuar fluxo de criação por foto
    if (context.photo_analysis && context.step) {
      console.log('Continuing photo request flow, step:', context.step);
      return await continuePhotoRequestFlow(message, context, user, supabaseClient);
    }
    
    // 1. Buscar conversas anteriores e memória
    const { data: conversations } = await supabaseClient
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const { data: userMemory } = await supabaseClient
      .from('ai_user_memory')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // 2. Construir histórico de mensagens
    const conversationHistory = conversations?.messages || [];
    
    // 3. Construir system prompt com contexto
    const systemPrompt = buildSystemPrompt(user, context, userMemory);
    
    // 4. Definir ferramentas disponíveis
    const tools = defineTools();
    
    // 5. Chamar Lovable AI com tool calling
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-10),
          { role: 'user', content: message }
        ],
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
      }),
    });
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }
    
    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message;
    
    console.log('AI response:', assistantMessage);
    
    // 6. Executar tool calls se houver
    let toolResults = [];
    if (assistantMessage.tool_calls) {
      console.log('Executing tool calls:', assistantMessage.tool_calls.length);
      toolResults = await executeToolCalls(
        assistantMessage.tool_calls, 
        supabaseClient, 
        user
      );
    }
    
    // 7. Se houver tool calls, fazer segunda chamada ao AI com os resultados
    let finalResponse = assistantMessage.content;
    if (toolResults.length > 0) {
      console.log('Making second AI call with tool results');
      const secondCallMessages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: message },
        assistantMessage,
        ...toolResults.map(tr => ({
          role: 'tool',
          tool_call_id: tr.tool_call_id,
          content: JSON.stringify(tr.result)
        }))
      ];
      
      const secondAiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: secondCallMessages,
          temperature: 0.7,
        }),
      });
      
      const secondAiData = await secondAiResponse.json();
      finalResponse = secondAiData.choices[0].message.content;
    }
    
    // 8. Salvar conversa atualizada
    const updatedMessages = [
      ...conversationHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { 
        role: 'assistant', 
        content: finalResponse, 
        timestamp: new Date().toISOString(),
        tool_calls: assistantMessage.tool_calls || []
      }
    ];
    
    await supabaseClient
      .from('ai_conversations')
      .upsert({
        user_id: user.id,
        messages: updatedMessages,
        context: context,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    console.log('Conversation saved successfully');
    
    // 9. Retornar resposta
    return new Response(
      JSON.stringify({
        message: finalResponse,
        tool_calls_executed: toolResults.length > 0,
        suggested_actions: extractSuggestedActions(finalResponse, context)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('AI Agent Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(user: any, context: any, userMemory: any): string {
  const userType = user.user_metadata?.user_type || 'client';
  
  let prompt = `Você é o Toninho, o Agente Oficial de Inteligência Artificial do aplicativo Me Ajuda ai! 💚🤖

O Me Ajuda ai é uma plataforma que conecta clientes a profissionais de serviços gerais (marido de aluguel, diaristas, eletricistas, encanadores, montadores, etc.).

INFORMAÇÕES DO USUÁRIO:
- Nome: ${user.user_metadata?.full_name || 'Usuário'}
- Tipo: ${userType === 'client' ? 'Cliente' : 'Profissional'}
- ID: ${user.id}

`;

  if (userType === 'client') {
    prompt += `SUAS FUNÇÕES PARA CLIENTES:
1. Entender pedidos em linguagem natural (texto, voz ou imagem)
2. Identificar categoria de serviço automaticamente
3. Preencher solicitações de forma inteligente
4. Solicitar apenas dados realmente faltantes
5. SEMPRE confirmar antes de criar pedidos reais
6. Acompanhar status de solicitações
7. Explicar diferenças entre orçamentos de forma clara
8. Sugerir o melhor orçamento baseado nas necessidades do cliente

`;
  } else {
    prompt += `SUAS FUNÇÕES PARA PROFISSIONAIS:
1. Ler solicitações e gerar orçamentos completos e profissionais
2. Calcular preços sugeridos usando a ferramenta adequada
3. Criar mensagens profissionais e claras para clientes
4. Ajudar no chat com respostas rápidas e eficientes
5. Otimizar rotas e horários do dia de trabalho
6. Lembrar de atualizar status do serviço (a caminho, chegou, executando, concluído)

`;
  }
  
  if (userMemory?.preferences) {
    prompt += `PREFERÊNCIAS DO USUÁRIO:
${JSON.stringify(userMemory.preferences, null, 2)}

`;
  }
  
  if (context) {
    prompt += `CONTEXTO ATUAL:
- Página: ${context.page || 'Desconhecida'}
- Solicitação atual: ${context.current_request_id || 'Nenhuma'}
- Última ação: ${context.last_action || 'Nenhuma'}

`;
  }
  
  prompt += `REGRAS CRÍTICAS DE SEGURANÇA:
1. NUNCA invente preços - use SEMPRE a ferramenta suggestPrice
2. NUNCA execute ações sem confirmação explícita do usuário
3. Peça dados somente quando realmente necessário
4. Se estiver em dúvida sobre algo, PERGUNTE ao usuário
5. Ofereça opções rápidas (chips) quando o usuário parecer perdido
6. Mantenha tom amigável, humano, simples e brasileiro
7. Toda ação que afeta o banco de dados PRECISA de confirmação primeiro
8. Sempre explique O QUE você vai fazer ANTES de fazer

FERRAMENTAS DISPONÍVEIS:
Você tem acesso a ferramentas para executar ações reais no sistema. Use-as quando necessário, mas SEMPRE confirme com o usuário antes de executar ações críticas como criar pedidos, enviar orçamentos ou mudar status.`;

  return prompt;
}

function defineTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'createRequest',
        description: 'Cria uma nova solicitação de serviço. SEMPRE confirme com o usuário ANTES de executar esta ação.',
        parameters: {
          type: 'object',
          properties: {
            category_id: { type: 'string', description: 'ID da categoria do serviço' },
            title: { type: 'string', description: 'Título curto e claro da solicitação' },
            description: { type: 'string', description: 'Descrição detalhada do problema/serviço' },
            urgency_level: { 
              type: 'number', 
              description: 'Nível de urgência: 1=baixa, 2=média, 3=alta'
            },
            address: { type: 'string', description: 'Endereço completo formatado' },
            city: { type: 'string', description: 'Cidade' },
            state: { type: 'string', description: 'Estado (sigla)' }
          },
          required: ['category_id', 'title', 'description', 'urgency_level', 'address', 'city', 'state']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'listQuotes',
        description: 'Lista todos os orçamentos recebidos para uma solicitação específica',
        parameters: {
          type: 'object',
          properties: {
            request_id: { type: 'string', description: 'ID da solicitação' }
          },
          required: ['request_id']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'submitQuote',
        description: 'Envia um orçamento para uma solicitação. SEMPRE confirme com o profissional ANTES de enviar.',
        parameters: {
          type: 'object',
          properties: {
            request_id: { type: 'string', description: 'ID da solicitação' },
            amount: { type: 'number', description: 'Valor do orçamento em reais' },
            description: { type: 'string', description: 'Descrição detalhada do que será feito' },
            estimated_time: { type: 'string', description: 'Tempo estimado para conclusão' },
            materials_included: { type: 'boolean', description: 'Se materiais estão inclusos no preço' }
          },
          required: ['request_id', 'amount', 'description']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'updateStatus',
        description: 'Atualiza o status de um serviço. SEMPRE confirme com o usuário ANTES de executar.',
        parameters: {
          type: 'object',
          properties: {
            request_id: { type: 'string', description: 'ID da solicitação' },
            new_status: { 
              type: 'string',
              enum: ['pending', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled'],
              description: 'Novo status do serviço' 
            }
          },
          required: ['request_id', 'new_status']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'suggestPrice',
        description: 'Retorna faixa de preço sugerida e materiais recomendados baseado no tipo de serviço. Use SEMPRE que precisar sugerir preços.',
        parameters: {
          type: 'object',
          properties: {
            service_description: { type: 'string', description: 'Descrição completa do serviço/problema' },
            urgency: { 
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Nível de urgência' 
            }
          },
          required: ['service_description']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'getRequestDetails',
        description: 'Busca detalhes completos de uma solicitação específica',
        parameters: {
          type: 'object',
          properties: {
            request_id: { type: 'string', description: 'ID da solicitação' }
          },
          required: ['request_id']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'getUserRequests',
        description: 'Lista todas as solicitações do usuário atual',
        parameters: {
          type: 'object',
          properties: {
            status_filter: { type: 'string', description: 'Filtrar por status (opcional)' }
          }
        }
      }
    }
  ];
}

async function executeToolCalls(
  toolCalls: any[], 
  supabaseClient: any, 
  user: any
): Promise<any[]> {
  const results = [];
  
  for (const toolCall of toolCalls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    
    console.log(`Executing tool: ${functionName}`, args);
    
    let result;
    
    try {
      switch (functionName) {
        case 'createRequest':
          result = await createRequest(args, supabaseClient, user);
          break;
          
        case 'listQuotes':
          result = await listQuotes(args, supabaseClient, user);
          break;
          
        case 'submitQuote':
          result = await submitQuote(args, supabaseClient, user);
          break;
          
        case 'updateStatus':
          result = await updateStatus(args, supabaseClient, user);
          break;
          
        case 'suggestPrice':
          result = await suggestPrice(args);
          break;
          
        case 'getRequestDetails':
          result = await getRequestDetails(args, supabaseClient, user);
          break;
          
        case 'getUserRequests':
          result = await getUserRequests(args, supabaseClient, user);
          break;
          
        default:
          result = { error: `Ferramenta desconhecida: ${functionName}` };
      }
    } catch (error) {
      console.error(`Error executing ${functionName}:`, error);
      result = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    results.push({
      tool_call_id: toolCall.id,
      result: result
    });
  }
  
  return results;
}

async function createRequest(args: any, supabaseClient: any, user: any) {
  try {
    const { data, error } = await supabaseClient
      .from('service_requests')
      .insert({
        client_id: user.id,
        category_id: args.category_id,
        title: args.title,
        description: args.description,
        urgency_level: args.urgency_level,
        address: args.address,
        city: args.city,
        state: args.state,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { 
      success: true, 
      request_id: data.id, 
      message: 'Solicitação criada com sucesso! Profissionais da região serão notificados.' 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function listQuotes(args: any, supabaseClient: any, user: any) {
  try {
    const { data, error } = await supabaseClient
      .from('quotes')
      .select(`
        *,
        professional:profiles!quotes_professional_id_fkey(
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('request_id', args.request_id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { 
      success: true, 
      quotes: data,
      total: data.length,
      message: data.length > 0 
        ? `Encontrados ${data.length} orçamento(s) para esta solicitação.`
        : 'Nenhum orçamento recebido ainda.'
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function submitQuote(args: any, supabaseClient: any, user: any) {
  try {
    const { data, error } = await supabaseClient
      .from('quotes')
      .insert({
        request_id: args.request_id,
        professional_id: user.id,
        amount: args.amount,
        description: args.description,
        estimated_time: args.estimated_time || '2 horas',
        materials_included: args.materials_included ?? false,
        is_accepted: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Buscar cliente para notificar
    const { data: requestData } = await supabaseClient
      .from('service_requests')
      .select('client_id, title')
      .eq('id', args.request_id)
      .single();
    
    if (requestData) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: requestData.client_id,
          type: 'new_quote',
          title: 'Novo Orçamento Recebido! 💰',
          message: `Você recebeu um orçamento de R$ ${args.amount} para "${requestData.title}"`,
          related_id: data.id
        });
    }
    
    return { 
      success: true, 
      quote_id: data.id, 
      message: 'Orçamento enviado com sucesso! O cliente será notificado.' 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function updateStatus(args: any, supabaseClient: any, user: any) {
  try {
    const { error } = await supabaseClient
      .from('service_requests')
      .update({ 
        status: args.new_status,
        extended_status: args.new_status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', args.request_id);
    
    if (error) throw error;
    
    const statusMessages: any = {
      'pending': 'Aguardando orçamentos',
      'quoted': 'Orçamentos recebidos',
      'accepted': 'Orçamento aceito',
      'in_progress': 'Serviço em andamento',
      'completed': 'Serviço concluído',
      'cancelled': 'Serviço cancelado'
    };
    
    return { 
      success: true, 
      message: `Status alterado para: ${statusMessages[args.new_status] || args.new_status}` 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function suggestPrice(args: any) {
  const description = args.service_description.toLowerCase();
  
  // Categorias e preços base
  const servicePatterns: any = {
    'elétrica|eletric|chuveiro|tomada|disjuntor|luz|lampada': {
      category: 'Elétrica',
      min: 80,
      max: 300,
      hourly: 50,
      parts: ['Fios elétricos', 'Disjuntores', 'Tomadas', 'Interruptores']
    },
    'hidráulica|encanamento|torneira|pia|vazamento|cano|entupimento': {
      category: 'Hidráulica',
      min: 100,
      max: 350,
      hourly: 60,
      parts: ['Tubos PVC', 'Conexões', 'Vedantes', 'Registros']
    },
    'limpeza|faxina|diarista': {
      category: 'Limpeza',
      min: 50,
      max: 200,
      hourly: 30,
      parts: ['Produtos de limpeza']
    },
    'montagem|montar|móvel|estante|guarda-roupa': {
      category: 'Montagem',
      min: 60,
      max: 200,
      hourly: 40,
      parts: ['Parafusos', 'Buchas', 'Cola']
    },
    'pintura|pintar|parede': {
      category: 'Pintura',
      min: 100,
      max: 400,
      hourly: 50,
      parts: ['Tinta', 'Massa corrida', 'Lixa', 'Pincel/Rolo']
    }
  };
  
  let selectedService: any = {
    category: 'Serviços Gerais',
    min: 80,
    max: 300,
    hourly: 50,
    parts: []
  };
  
  for (const [pattern, service] of Object.entries(servicePatterns)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(description)) {
      selectedService = service;
      break;
    }
  }
  
  // Ajustar por urgência
  let multiplier = 1;
  if (args.urgency === 'high') multiplier = 1.5;
  else if (args.urgency === 'medium') multiplier = 1.2;
  
  const suggestedMin = Math.round(selectedService.min * multiplier);
  const suggestedMax = Math.round(selectedService.max * multiplier);
  const hourlyRate = Math.round(selectedService.hourly * multiplier);
  
  return {
    success: true,
    category: selectedService.category,
    price_range: {
      min: suggestedMin,
      max: suggestedMax,
      hourly_rate: hourlyRate,
      currency: 'BRL'
    },
    suggested_parts: selectedService.parts,
    urgency_multiplier: multiplier,
    notes: `Preços baseados em ${args.urgency || 'medium'} urgência para categoria ${selectedService.category}. Valores podem variar conforme complexidade e materiais necessários.`
  };
}

async function getRequestDetails(args: any, supabaseClient: any, user: any) {
  try {
    const { data, error } = await supabaseClient
      .from('service_requests')
      .select(`
        *,
        client:profiles!service_requests_client_id_fkey(
          full_name,
          phone,
          avatar_url
        ),
        category:service_categories(
          name,
          icon
        )
      `)
      .eq('id', args.request_id)
      .single();
    
    if (error) throw error;
    
    return { 
      success: true, 
      request: data,
      message: `Solicitação encontrada: "${data.title}"`
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function getUserRequests(args: any, supabaseClient: any, user: any) {
  try {
    let query = supabaseClient
      .from('service_requests')
      .select(`
        id,
        title,
        status,
        created_at,
        urgency_level,
        category:service_categories(name)
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (args.status_filter) {
      query = query.eq('status', args.status_filter);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { 
      success: true, 
      requests: data,
      total: data.length,
      message: data.length > 0
        ? `Encontradas ${data.length} solicitação(ões)`
        : 'Nenhuma solicitação encontrada'
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============ FUNÇÕES PARA CRIAÇÃO POR FOTO ============

async function detectIfServiceRequestPhoto(imageUrl: string, userMessage: string): Promise<boolean> {
  try {
    const quickCheck = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um detector especializado. Retorne apenas "SIM" ou "NAO".\nA imagem mostra um problema doméstico que requer serviço profissional (elétrica, encanamento, construção, reparo, limpeza, etc)?'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Mensagem do usuário: "${userMessage}"` },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_completion_tokens: 10
      })
    });

    const data = await quickCheck.json();
    const response = data.choices[0].message.content.toUpperCase();
    return response.includes('SIM');
  } catch (error) {
    console.error('Error detecting service request photo:', error);
    return false;
  }
}

async function handlePhotoRequestCreation(imageUrl: string, userMessage: string, context: any, user: any, supabaseClient: any) {
  try {
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é o Toninho, assistente do Me Ajuda ai.
Analise esta imagem de um problema doméstico e retorne JSON:
{
  "problem": "descrição clara do problema em português",
  "category": "eletrica|encanamento|construcao|limpeza|pintura|marcenaria|jardinagem|refrigeracao",
  "severity": "urgente|moderado|baixo",
  "confidence": 0-100,
  "estimated_cost": "R$ X - R$ Y",
  "materials": ["material1", "material2"],
  "first_question": "pergunta específica e direta sobre o problema"
}`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `${userMessage}\n\nAnalise esta imagem e me ajude a criar uma solicitação de serviço.` },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_completion_tokens: 800
      })
    });

    const analysisData = await analysisResponse.json();
    const content = analysisData.choices[0].message.content;
    
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    const analysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);

    // Mapear categoria para ID do banco
    const { data: categories } = await supabaseClient
      .from('service_categories')
      .select('id, name');
    
    const categoryMap: any = {};
    if (categories) {
      categories.forEach((cat: any) => {
        const normalized = cat.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        categoryMap[normalized] = cat.id;
      });
    }

    const categoryId = categoryMap[analysis.category] || categoryMap['eletrica'] || null;

    const responseMessage = `📸 Entendi! Analisei sua foto e identifiquei:

🔍 **Problema detectado:** ${analysis.problem}
📁 **Categoria:** ${analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1)}
⚠️ **Urgência:** ${analysis.severity === 'urgente' ? '🔴 Alta' : analysis.severity === 'moderado' ? '🟡 Média' : '🟢 Baixa'}
💰 **Custo estimado:** ${analysis.estimated_cost}
${analysis.confidence > 70 ? `✅ Confiança: ${analysis.confidence}%` : ''}

Vou fazer algumas perguntas para criar a melhor solicitação possível:

**Pergunta 1/4:** ${analysis.first_question}`;

    return new Response(
      JSON.stringify({
        message: responseMessage,
        suggested_actions: [],
        metadata: {
          photo_analysis: analysis,
          category_id: categoryId,
          image_url: imageUrl,
          step: 1,
          total_steps: 4,
          answers: []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error analyzing photo:', error);
    return new Response(
      JSON.stringify({ 
        message: '❌ Ops! Tive dificuldade em analisar a foto. Pode tentar tirar outra foto com melhor iluminação?',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function continuePhotoRequestFlow(userAnswer: string, context: any, user: any, supabaseClient: any) {
  const { photo_analysis, step, answers = [], category_id, image_url } = context;
  
  // Armazenar resposta atual
  const newAnswers = [...answers, {
    step: step,
    answer: userAnswer
  }];

  // Se completou todas as perguntas, criar solicitação
  if (step >= 4) {
    return await createServiceRequestFromPhoto(photo_analysis, newAnswers, category_id, image_url, user, supabaseClient);
  }

  // Gerar próxima pergunta
  const nextQuestionPrompt = getNextQuestionPrompt(step + 1);
  
  try {
    const questionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é o Toninho. ${nextQuestionPrompt}`
          },
          {
            role: 'user',
            content: `Problema: ${photo_analysis.problem}
Resposta anterior: ${userAnswer}
Todas respostas: ${JSON.stringify(newAnswers)}

Faça a próxima pergunta necessária para completar a solicitação.`
          }
        ],
        max_completion_tokens: 200
      })
    });

    const data = await questionResponse.json();
    const nextQuestion = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        message: `✅ Anotado!\n\n**Pergunta ${step + 1}/4:** ${nextQuestion}`,
        metadata: {
          photo_analysis,
          category_id,
          image_url,
          step: step + 1,
          total_steps: 4,
          answers: newAnswers
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating next question:', error);
    return new Response(
      JSON.stringify({ error: 'Error generating question' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function getNextQuestionPrompt(step: number): string {
  const prompts = {
    2: 'Pergunte sobre QUANDO o cliente precisa do serviço (hoje, amanhã, esta semana, sem pressa). Seja breve e objetivo.',
    3: 'Pergunte se há ALGUM DETALHE ADICIONAL importante que o profissional deve saber antes de fazer o orçamento. Seja direto.',
    4: 'Confirme o ENDEREÇO onde será feito o serviço. Pergunte se o endereço cadastrado está correto ou se é outro local.'
  };
  return prompts[step as keyof typeof prompts] || 'Faça uma pergunta relevante sobre o serviço.';
}

async function createServiceRequestFromPhoto(
  analysis: any, 
  answers: any[], 
  categoryId: string,
  imageUrl: string,
  user: any, 
  supabaseClient: any
) {
  try {
    // Construir descrição detalhada
    const description = `${analysis.problem}

**Detalhes fornecidos pelo cliente:**
${answers.map((a, i) => `${i + 1}. ${a.answer}`).join('\n')}

**Análise técnica (IA):**
- Urgência: ${analysis.severity}
- Materiais necessários: ${analysis.materials.join(', ')}
- Custo estimado: ${analysis.estimated_cost}`;

    // Buscar perfil do usuário para pegar endereço
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('city, state, formatted_address')
      .eq('id', user.id)
      .single();

    // Mapear urgência
    const urgencyMap: any = {
      'urgente': 3,
      'moderado': 2,
      'baixo': 1
    };

    const { data: request, error } = await supabaseClient
      .from('service_requests')
      .insert({
        client_id: user.id,
        category_id: categoryId,
        title: `${analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1)} - ${analysis.problem.substring(0, 50)}`,
        description: description,
        urgency_level: urgencyMap[analysis.severity] || 2,
        status: 'pending',
        images_urls: [imageUrl],
        city: profile?.city || '',
        state: profile?.state || '',
        address: profile?.formatted_address || 'Endereço a confirmar'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service request:', error);
      return new Response(
        JSON.stringify({
          message: '❌ Ops! Tive um problema ao criar sua solicitação. Pode tentar novamente?',
          error: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        message: `🎉 **Solicitação criada com sucesso!**

📋 **Pedido #${request.id.substring(0, 8)}**

${description}

Profissionais da região já podem ver seu pedido e enviar orçamentos!`,
        
        suggested_actions: [
          {
            label: '👀 Ver Solicitação',
            action: `navigate:/service-request/${request.id}`
          },
          {
            label: '📨 Ver Meus Pedidos',
            action: 'navigate:/my-requests'
          }
        ],
        
        metadata: {
          request_created: true,
          request_id: request.id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating service request:', error);
    return new Response(
      JSON.stringify({ 
        message: '❌ Erro ao criar solicitação. Tente novamente.',
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

function extractSuggestedActions(response: string, context: any): any[] {
  const actions = [];
  
  // Sugerir ações baseado no contexto e resposta
  if (context?.page === '/categories' || response.toLowerCase().includes('criar') || response.toLowerCase().includes('solicitação')) {
    actions.push({ label: '➕ Criar Solicitação', action: 'create_request' });
  }
  
  if (context?.current_request_id || response.toLowerCase().includes('orçamento')) {
    actions.push({ label: '💰 Ver Orçamentos', action: 'list_budgets' });
  }
  
  if (response.toLowerCase().includes('status') || response.toLowerCase().includes('acompanhar')) {
    actions.push({ label: '📊 Ver Meus Pedidos', action: 'my_requests' });
  }
  
  actions.push({ label: '❓ Ajuda', action: 'help' });
  
  return actions;
}
