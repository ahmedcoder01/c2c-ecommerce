import { MAIL_DOMAIN, client } from '../lib/mail';

export const sendEmail = async ({
  emails,
  subject,
  message,
}: {
  emails: string[];
  message: string;
  subject: string;
  templateId?: number;
}) => {
  client.messages.create(MAIL_DOMAIN, {
    from: 'Excited User <mailgun@sandbox-123.mailgun.org>',
    to: emails,
    subject,
    text: message,
  });
};
