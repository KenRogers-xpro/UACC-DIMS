import api from './api';

function normalizeAiText(data) {
  return data?.data?.response?.text || data?.data?.response?.message || data?.message || data?.text || '';
}

export async function searchKnowledgeBase({ query, context = {} }) {
  const briefingPrompt = [
    'You are preparing a concise executive morning briefing for the General Manager.',
    'Summarize today\'s pending items, schedule, and flagged documents in natural language.',
    'Keep the response short, clear, and actionable.',
    `User query: ${query}`,
    context ? `Context: ${JSON.stringify(context, null, 2)}` : '',
  ].filter(Boolean).join('\n\n')

  try {
    const data = await api.post('/ai', {
      messages: [
        { role: 'system', text: 'You are a concise executive briefing assistant.' },
        { role: 'user', text: briefingPrompt },
      ],
    });
    return normalizeAiText(data);
  } catch (error) {
    console.error('searchKnowledgeBase error:', error);
    throw error;
  }
}

export async function askClaude(prompt) {
  return {
    reply: `Stub response for: ${prompt}`,
  }
}

export default askClaude;

