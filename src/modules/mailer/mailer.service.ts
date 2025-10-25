import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true only if using port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false }, // dev only
    });

    // Optional: verify connection on startup
    this.transporter.verify((error) => {
      if (error) {
        console.error('SMTP connection error:', error);
      } else {
        console.log('SMTP server is ready to take messages', process.env.SMTP_HOST);
      }
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Hive 3D" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });
      console.log('MAIL SENT', info.messageId);
      return info;
    } catch (err) {
      console.error('MAIL ERROR', err);
      throw err;
    }
  }

  async sendOtp(email: string, otp: string) {
    return this.sendMail(
      email,
      'Your OTP Code',
      `Your OTP is ${otp}. It will expire in 5 minutes.`,
      `<p>Your OTP is <b>${otp}</b>. It will expire in 2 minutes.</p>`,
    );
  }
}
