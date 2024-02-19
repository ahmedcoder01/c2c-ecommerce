import { MAIL_DOMAIN, client } from '../lib/mail';
import logger from '../logger';

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
  logger.info(`MOCK: Sending email to ${emails} with subject: ${subject} and message: ${message}`);
  // client.messages.create(MAIL_DOMAIN, {
  //   from: 'Excited User <mailgun@sandbox-123.mailgun.org>',
  //   to: emails,
  //   subject,
  //   text: message,
  // });
};
