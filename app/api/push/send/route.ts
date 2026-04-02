import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_MAILTO}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: NextRequest) {
  // Vercel Cron stuurt Authorization header, geen x-cron-secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Accepteer zowel Vercel cron auth als handmatige aanroep met secret
  const isVercelCron = authHeader === `Bearer ${cronSecret}`;
  const isManual = req.headers.get('x-cron-secret') === cronSecret;

  if (!isVercelCron && !isManual && cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') || 'daily';
  const payload = JSON.stringify(
    type === 'weekly'
      ? { title: 'De Onderstroom', body: 'Je weekreflectie wacht 📓', url: '/week' }
      : { title: 'De Onderstroom', body: 'Even inchecken? Dagboek staat klaar 🌿', url: '/dagboek' }
  );

  const { data: subscriptions } = await supabase.from('push_subscriptions').select('endpoint, keys');
  if (!subscriptions?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
      sent++;
    } catch (err: any) {
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }
  return NextResponse.json({ sent });
}
