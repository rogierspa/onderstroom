import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();
    const { endpoint, keys } = subscription;

    await supabase
      .from('push_subscriptions')
      .upsert({ endpoint, keys }, { onConflict: 'endpoint' });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}
