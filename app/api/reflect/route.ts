import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEMS } from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { type, content } = await req.json();
    const system = SYSTEMS[type as keyof typeof SYSTEMS];
    if (!system) return NextResponse.json({ error: 'Unknown type' }, { status: 400 });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ reflection: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'AI call failed' }, { status: 500 });
  }
}
