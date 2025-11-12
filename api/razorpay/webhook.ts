import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// ---- Environment Variables ---- //
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
const razorpayKeyId = process.env.VITE_RAZORPAY_KEY_ID!;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET!;

// ---- Initialize Clients ---- //
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const body = req.body;

    // Verify Razorpay signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = body.event;
    const payload = body.payload?.payment?.entity;

    console.log('📩 Razorpay event received:', event);

    // Process successful payment
    if (event === 'payment.captured' && payload) {
      const rzpOrderId = payload.order_id;
      const paymentId = payload.id;
      const amount = payload.amount;
      const email = payload.email;

      // Find the order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('provider_order_id', rzpOrderId)
        .single();

      if (orderError || !order) {
        console.error('❌ Order not found:', orderError);
        return res.status(404).json({ error: 'Order not found' });
      }

      // Update order to "paid"
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          provider_payment_id: paymentId,
          amount_paise: amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('❌ Order update failed:', updateError);
        return res.status(500).json({ error: 'Failed to update order' });
      }

      // Insert tickets
      const qty = Number(order.qty || 1);
      const tickets = Array.from({ length: qty }).map(() => ({
        order_id: order.id,
        event_id: order.event_id,
        owner_email: order.email || email,
        status: 'active',
        created_at: new Date().toISOString(),
      }));

      const { error: ticketError } = await supabase.from('tickets').insert(tickets);
      if (ticketError) {
        console.error('❌ Ticket insert failed:', ticketError);
        return res.status(500).json({ error: 'Ticket creation failed' });
      }

      console.log(`✅ Order ${order.id} confirmed and ${qty} ticket(s) created.`);
      return res.status(200).json({ success: true });
    }

    // Ignore non-payment events
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('💥 Webhook handler crashed:', err);
    return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
  }
}
