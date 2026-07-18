import Anthropic from '@anthropic-ai/sdk';

export const CLAUDE_AVAILABLE = Boolean(process.env.ANTHROPIC_API_KEY);

let client;
if (CLAUDE_AVAILABLE) {
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function callClaude({ system, prompt }) {
  if (!CLAUDE_AVAILABLE) {
    throw new Error('NO_API_KEY');
  }
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].text;
}
