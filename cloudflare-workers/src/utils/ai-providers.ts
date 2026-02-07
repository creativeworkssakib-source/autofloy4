import { Env, AIProvider } from './types';

// Detect AI provider from API key
export function detectProvider(apiKey: string | null): AIProvider {
  if (!apiKey) return 'lovable';
  if (apiKey.startsWith('sk-')) return 'openai';
  if (apiKey.startsWith('AIza')) return 'google';
  return 'lovable';
}

// Call OpenAI API
export async function callOpenAI(
  messages: any[], 
  apiKey: string, 
  hasMedia: boolean
): Promise<string> {
  const model = hasMedia ? 'gpt-4o' : 'gpt-4o-mini';
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }
  
  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

// Call Google Gemini API
export async function callGoogleAI(
  messages: any[], 
  apiKey: string
): Promise<string> {
  // Convert messages to Gemini format
  const contents = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m: any) => m.role === 'system')?.content || '';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: { 
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI error: ${error}`);
  }

  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Call Lovable AI Gateway (fallback)
export async function callLovableAI(
  messages: any[], 
  apiKey: string, 
  hasMedia: boolean
): Promise<string> {
  const model = hasMedia ? 'openai/gpt-4o' : 'openai/gpt-4o-mini';
  
  const response = await fetch('https://ai.lovable.dev/api/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: 2048,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lovable AI error: ${error}`);
  }
  
  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

// Main AI router with fallback
export async function callAI(
  messages: any[],
  provider: AIProvider,
  customApiKey: string | null,
  lovableApiKey: string,
  hasMedia: boolean
): Promise<{ response: string; provider: AIProvider }> {
  try {
    let response: string;
    
    switch (provider) {
      case 'openai':
        if (!customApiKey) throw new Error('No OpenAI key');
        response = await callOpenAI(messages, customApiKey, hasMedia);
        break;
        
      case 'google':
        if (!customApiKey) throw new Error('No Google key');
        response = await callGoogleAI(messages, customApiKey);
        break;
        
      case 'lovable':
      default:
        response = await callLovableAI(messages, lovableApiKey, hasMedia);
        provider = 'lovable';
        break;
    }
    
    return { response, provider };
  } catch (error) {
    console.error(`${provider} AI failed, falling back to Lovable:`, error);
    
    // Fallback to Lovable
    const response = await callLovableAI(messages, lovableApiKey, hasMedia);
    return { response, provider: 'lovable' };
  }
}
