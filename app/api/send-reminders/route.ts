import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

// MODE TEST : seuils en minutes au lieu de jours
const FIRST_REMINDER_THRESHOLD_MINUTES = 2;
const SECOND_REMINDER_THRESHOLD_MINUTES = 5;

export async function POST() {
  try {
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
      const minutesSinceCreated = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60)
      );

      if (!quote.contact_email) continue;

      const isFirstDue = minutesSinceCreated >= FIRST_REMINDER_THRESHOLD_MINUTES && !quote.first_reminder_sent;
      const isSecondDue = minutesSinceCreated >= SECOND_REMINDER_THRESHOLD_MINUTES && !quote.second_reminder_sent;

      if (!isFirstDue && !isSecondDue) continue;

      // Récupère les infos de l'artisan (nom entreprise + email pour reply-to)
      const { data: artisanData, error: artisanError } = await supabase.auth.admin.getUserById(quote.user_id);

      if (artisanError || !artisanData?.user) {
        console.error('Artisan not found for quote:', quote.id);
        continue;
      }

      const artisanEmail = artisanData.user.email;
      const businessName = artisanData.user.user_metadata?.business_name || artisanEmail;

      const formattedAmount = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(parseFloat(quote.amount));

      const formattedDate = new Date(quote.sent_date + 'T00:00:00').toLocaleDateString('fr-FR');

      // 1ère relance
      if (isFirstDue) {
        await resend.emails.send({
          from: 'DevisTrack <onboarding@resend.dev>',
          to: quote.contact_email,
          replyTo: artisanEmail,
          subject: `${businessName} – Suivi de votre devis`,
          html: `
            <p>Bonjour ${quote.prospect_name},</p>
            <p>J'espère que vous allez bien. Je me permets de revenir vers vous au sujet du devis de ${formattedAmount} que je vous ai transmis le ${formattedDate}.</p>
            <p>N'hésitez pas à me contacter si vous avez la moindre question ou si vous souhaitez que j'ajuste certains points.</p>
            <p>Je reste à votre disposition.</p>
            <p>Bien cordialement,<br>${businessName}</p>
          `,
        });

        await supabase
          .from('quotes')
          .update({ first_reminder_sent: true })
          .eq('id', quote.id);

        sent++;
        continue;
      }

      // 2e relance
      if (isSecondDue) {
        await resend.emails.send({
          from: 'DevisTrack <onboarding@resend.dev>',
          to: quote.contact_email,
          replyTo: artisanEmail,
          subject: `${businessName} – Toujours disponible pour votre projet`,
          html: `
            <p>Bonjour ${quote.prospect_name},</p>
            <p>Je me permets de revenir une dernière fois vers vous concernant le devis de ${formattedAmount} envoyé le ${formattedDate}.</p>
            <p>Si vous avez besoin de plus de temps ou d'informations complémentaires, n'hésitez pas à me le faire savoir — je suis là pour vous accompagner dans votre projet.</p>
            <p>Bien cordialement,<br>${businessName}</p>
          `,
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