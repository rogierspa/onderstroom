import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_MAILTO}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Vercel Cron roept dit endpoint aan — beveilig met secret header
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') || 'daily';
  const payload = JSON.stringify(
    type === 'weekly'
      ? { title: 'De Onderstroom', body: 'Je weekreflectie wacht 📓', url: '/week' }
      : { title: 'De Onderstroom', body: 'Even inchecken? Dagboek staat klaar 🌿', url: '/dagboek' }
  );

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys');

  if (!subscriptions?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      );
      sent++;
    } catch (err: any) {
      // 410 = subscription verlopen, verwijder uit DB
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return NextResponse.json({ sent });
}
