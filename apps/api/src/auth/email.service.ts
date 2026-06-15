import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';

type VerificationEmailInput = {
  email: string;
  firstName: string;
  token: string;
};

type PasswordResetEmailInput = VerificationEmailInput;

@Injectable()
export class EmailService {
  async sendVerificationEmail(input: VerificationEmailInput) {
    if (!this.isEmailDeliveryEnabled()) {
      return { sent: false };
    }

    if (!this.isSmtpConfigured()) {
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
        'Please verify your Zamindar Plus account with this code:',
        input.token,
        '',
        'This code will expire in 24 hours.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#12201b">
          <h2>Verify your Zamindar Plus email</h2>
          <p>Assalam o alaikum ${this.escapeHtml(input.firstName)},</p>
          <p>Please verify your account to start using Zamindar Plus.</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:8px">${input.token}</p>
          <p>This code will expire in 24 hours.</p>
        </div>
      `,
    });

    return { sent: true };
  }

  async sendPasswordResetEmail(input: PasswordResetEmailInput) {
    if (!this.isEmailDeliveryEnabled()) {
      return { sent: false };
    }

    if (!this.isSmtpConfigured()) {
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
      subject: 'Reset your Zamindar Plus password',
      text: [
        `Assalam o alaikum ${input.firstName},`,
        '',
        'Use this code to reset your Zamindar Plus password:',
        input.token,
        '',
        'This code will expire in 1 hour. If you did not request it, ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#12201b">
          <h2>Reset your Zamindar Plus password</h2>
          <p>Assalam o alaikum ${this.escapeHtml(input.firstName)},</p>
          <p>Use this secure code to set a new password.</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:8px">${input.token}</p>
          <p>This code will expire in 1 hour. If you did not request it, ignore this email.</p>
        </div>
      `,
    });

    return { sent: true };
  }

  private isSmtpConfigured() {
    return Boolean(
      process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim(),
    );
  }

  private isEmailDeliveryEnabled() {
    return process.env.EMAIL_DELIVERY_ENABLED === 'true';
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
