import formData from 'form-data';
import Mailgun, { MailgunMessageData } from 'mailgun.js';
import config from '../config';

const API_KEY = config.variables.mailAPIKey;
const MAIL_DOMAIN = config.variables.mailDomain;

const mailgun = new Mailgun(formData);
const client = mailgun.client({ username: 'api', key: API_KEY });

export { client, MAIL_DOMAIN };
