import { Artist } from '../interfaces/artist';
import fs from 'fs';
import { Config } from './config';
import { HttpClient } from './http-client';
import { TemplateRenderer } from './template.renderer';

export class EmailService {
  private apiClient: HttpClient;
  private fromEmail: string;
  private donationInfoPath: string;
  private templateRenderer: TemplateRenderer;

  constructor() {
    const config = new Config();
    this.fromEmail = config.get('EMAIL_FROM');
    this.donationInfoPath = config.get('PATH_TO_DONATION_INFO_TEMPLATE');

    if (!fs.existsSync(this.donationInfoPath)) {
      throw new Error(
        `[EmailService] ❌ Donation info template not found at: ${this.donationInfoPath}`
      );
    }

    this.apiClient = new HttpClient(config.get('API_URL'), {
      'Content-Type': 'application/json',
      'X-AUTH-KEY': config.get('TRUSTED_CLIENT_AUTH_TOKEN'),
    });

    // Initialize template renderer
    this.templateRenderer = new TemplateRenderer();
  }

  public async notifyDonation(
    artist: Artist,
    donorName: string,
    donorEmail: string,
    amount: number,
    currency: string,
    message?: string
  ): Promise<void> {
    const subject = `New Donation for ${artist.name}`;

    // Prepare context for the template
    const context = {
      artistName: artist.name,
      donorName: donorName || 'Anonymous',
      donorEmail: donorEmail || 'Not provided',
      amount: amount.toFixed(2),
      currency,
      message:
        message && message.trim() !== ''
          ? message.trim().split(/\r?\n+/)
          : null,
      signature: 'Your Studio System',
    };

    // Render email content using the TemplateRendererService
    const html = await this.templateRenderer.render(
      this.donationInfoPath,
      context
    );

    // Send the email
    await this.sendEmail(artist.webmail.email, subject, html);
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    const payload = { from: this.fromEmail, to, subject, html };
    const response = await this.apiClient.post('/emails/send', payload);

    if (response.status < 200 || response.status >= 300) {
      const errorText =
        typeof response.body === 'object'
          ? JSON.stringify(response.body, null, 2)
          : response.body || 'Unknown error';

      throw new Error(`Failed to send email:\n${errorText}`);
    }
  }
}
