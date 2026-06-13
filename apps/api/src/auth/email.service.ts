import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

type VerificationEmailInput = {
  email: string;
  firstName: string;
  token: string;
};

@Injectable()
export class EmailService {
  async sendVerificationEmail(input: VerificationEmailInput) {
    const verificationUrl = this.buildVerificationUrl(input.token);

    if (!this.isSmtpConfigured()) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(
          `Email verification link for ${input.email}: ${verificationUrl}`,
        );
        return { sent: false, verificationUrl };
      }

      throw new ServiceUnavailableException(
        'Email delivery is not configured.',
      );
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: input.email,
      subject: 'Verify your Zamindar Plus email',
      text: [
        `Assalam o alaikum ${input.firstName},`,
        '',
        'Please verify your Zamindar Plus account by opening this link:',
        verificationUrl,
        '',
        'This link will expire in 24 hours.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#12201b">
          <h2>Verify your Zamindar Plus email</h2>
          <p>Assalam o alaikum ${this.escapeHtml(input.firstName)},</p>
          <p>Please verify your account to start using Zamindar Plus.</p>
          <p>
            <a href="${verificationUrl}" style="background:#147a63;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">
              Verify email
            </a>
          </p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    });

    return { sent: true, verificationUrl };
  }

  private buildVerificationUrl(token: string) {
    const appUrl =
      process.env.APP_URL?.trim() ||
      process.env.CORS_ORIGIN?.split(',')[0]?.trim() ||
      'http://localhost:5173';

    const url = new URL(appUrl);
    url.searchParams.set('verifyEmail', token);

    return url.toString();
  }

  private isSmtpConfigured() {
    return Boolean(
      process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim(),
    );
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
