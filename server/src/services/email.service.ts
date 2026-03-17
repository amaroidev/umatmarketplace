import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // We use ethereal email for dev/testing or standard SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal_password',
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"CampusMarketplace" <${process.env.SMTP_FROM || 'noreply@campusmarketplace.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      
      // Useful for testing with ethereal email
      if (process.env.NODE_ENV !== 'production' && info.messageId) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Templates
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to CampusMarketplace!';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #0a0a0a; text-transform: uppercase; letter-spacing: 1px;">Welcome, ${name}!</h1>
        <p style="color: #555555; line-height: 1.6;">
          We're thrilled to have you on board. CampusMarketplace is the easiest way to buy and sell items directly on campus.
        </p>
        <p style="color: #555555; line-height: 1.6;">
          Start browsing listings or post your own items today.
        </p>
        <div style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; display: inline-block;">
            Explore Marketplace
          </a>
        </div>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendOrderUpdateEmail(to: string, orderId: string, status: string): Promise<boolean> {
    const subject = `Order Update: ${status.toUpperCase()}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #0a0a0a; text-transform: uppercase; letter-spacing: 1px;">Order Status Update</h1>
        <p style="color: #555555; line-height: 1.6;">
          Your order (ID: <strong>${orderId}</strong>) has been updated.
        </p>
        <p style="color: #555555; line-height: 1.6;">
          New Status: <span style="background-color: #f3f4f6; padding: 4px 8px; font-weight: bold;">${status}</span>
        </p>
        <div style="margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${orderId}" style="background-color: #0a0a0a; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; display: inline-block;">
            View Order
          </a>
        </div>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }

  async sendPaymentReceiptEmail(to: string, orderId: string, amount: number): Promise<boolean> {
    const subject = 'Payment Receipt';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <h1 style="color: #0a0a0a; text-transform: uppercase; letter-spacing: 1px;">Payment Successful</h1>
        <p style="color: #555555; line-height: 1.6;">
          We have received your payment of <strong>GHS ${amount.toFixed(2)}</strong> for order <strong>${orderId}</strong>.
        </p>
        <p style="color: #555555; line-height: 1.6;">
          The seller has been notified and will process your order shortly.
        </p>
      </div>
    `;
    return this.sendEmail({ to, subject, html });
  }
}

export const emailService = new EmailService();
