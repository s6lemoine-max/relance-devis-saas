import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST() {
  try {
    // Récupère les devis en attente qui n'ont pas encore été relancés
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const today = new Date();
    let sent = 0;

    for (const quote of quotes) {
      const createdDate = new Date(quote.created_at);
      const daysSinceCreated = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 1ère relance à J+3
      if (
        daysSinceCreated === 3 &&
        !quote.first_reminder_sent &&
        quote.contact_email
      ) {
        await resend.emails.send({
          from: 'noreply@relance-devis.com',
          to: quote.contact_email,
          subject: `Relance : Devis ${quote.prospect_name}`,
          html: `<p>Bonjour ${quote.prospect_name},</p>
            <p>Je reviens vers vous concernant le devis de ${quote.amount}€ envoyé le ${quote.sent_date}.</p>
            <p>Avez-vous des questions ou souhaitez-vous que j'ajuste quelque chose ?</p>
            <p>Cordialement</p>`,
        });

        await supabase
          .from('quotes')
          .update({ first_reminder_sent: true })
          .eq('id', quote.id);

        sent++;
      }

      // 2e relance à J+7
      if (
        daysSinceCreated === 7 &&
        !quote.second_reminder_sent &&
        quote.contact_email
      ) {
        await resend.emails.send({
          from: 'noreply@relance-devis.com',
          to: quote.contact_email,
          subject: `2e relance : Devis ${quote.prospect_name}`,
          html: `<p>Bonjour ${quote.prospect_name},</p>
            <p>Je relance concernant le devis de ${quote.amount}€ du ${quote.sent_date}.</p>
            <p>C'est la dernière relance avant expiration. Confirmez-vous votre intérêt ?</p>
            <p>Cordialement</p>`,
        });

        await supabase
          .from('quotes')
          .update({ second_reminder_sent: true })
          .eq('id', quote.id);

        sent++;
      }
    }

    return Response.json({ success: true, remindersSent: sent });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}