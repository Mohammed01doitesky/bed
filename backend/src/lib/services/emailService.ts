import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { query } from '@/lib/db/connection';

export interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
}

export interface EmailData {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  attachments?: any[];
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static createTransporter(): nodemailer.Transporter {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'tickets@bedayia.com',
        pass: process.env.SMTP_PASS || ''
      }
    };

    return nodemailer.createTransport(config);
  }

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = this.createTransporter();
    }
    return this.transporter;
  }

  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'tickets@bedayia.com',
        to: emailData.to,
        cc: emailData.cc || '',
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments || []
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  static async sendEventInviteEmails(eventId: number): Promise<{ success: boolean; sent: number; failed: number }> {
    try {
      // Get event details
      const eventResult = await query(`
        SELECT name, email_subject 
        FROM bydaya_events 
        WHERE id = $1
      `, [eventId]);

      if (eventResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      const event = eventResult.rows[0];
      const eventName = event.name;
      const emailSubject = event.email_subject || 'BIS Tickets';

      // Get all invitees for this event with their QR codes (only those who haven't been sent emails)
      const inviteesResult = await query(`
        SELECT DISTINCT
          bei.id as invitee_id,
          bei.student_item_id,
          beitem.student_email,
          beitem.student_email_parent_1,
          beitem.student_email_parent_2,
          beitem.number_of_seats,
          bei.invitees_qrcode_text,
          bei.mail_send,
          bei.mail_sent_at
        FROM bydaya_event_invitees bei
        JOIN bydaya_event_items beitem ON bei.student_item_id = beitem.id
        WHERE beitem.event_id = $1 
        AND bei.main_invitee = true
        AND bei.invitees_qrcode_text IS NOT NULL
        AND bei.mail_send = false
      `, [eventId]);

      console.log(`Found ${inviteesResult.rows.length} invitees to send emails to`);
      if (inviteesResult.rows.length === 0) {
        console.log('No invitees found with QR codes for event', eventId);
      }

      let sent = 0;
      let failed = 0;

      for (const invitee of inviteesResult.rows) {
        try {
          // Generate QR code from text
          let qrCodeBase64 = '';
          if (invitee.invitees_qrcode_text) {
            const qrCodeBuffer = await QRCode.toBuffer(invitee.invitees_qrcode_text, {
              width: 256,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            qrCodeBase64 = qrCodeBuffer.toString('base64');
          }
          
          const numberOfSeats = invitee.number_of_seats || 1;
          
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Bedayia International School Event Invitation</h2>
              
              <p>To Whom It May Concern,</p>
              
              <p>Kindly find attached the QR code for your requested ticket to the upcoming Bedayia International School event.</p>
              
              ${qrCodeBase64 ? `<div style="text-align: center; margin: 20px 0;">
                <img src="data:image/png;base64,${qrCodeBase64}" 
                     style="width:200px;height:200px;object-fit:cover;" 
                     alt="QR Code"/>
              </div>` : ''}
              
              <p>please share the QR code with your invitees.</p>
              
              <p>We kindly ask that you have your designated QR code ready on your mobile device at the entrance gate, where it will be scanned and verified.</p>
              
              <p>Thank you and best regards,</p>
              
              <p><strong>BIS Tickets</strong><br/>
              Bedayia International School</p>
            </div>
          `;

          // Prepare recipient emails
          const recipients: string[] = [];
          if (invitee.student_email) recipients.push(invitee.student_email);
          
          // Add CC recipients
          const ccEmails: string[] = [];
          if (invitee.student_email_parent_1) ccEmails.push(invitee.student_email_parent_1);
          if (invitee.student_email_parent_2) ccEmails.push(invitee.student_email_parent_2);

          // Send to primary email
          if (recipients.length > 0) {
            const emailData: EmailData = {
              to: recipients[0],
              cc: ccEmails.join(', '),
              subject: eventName,
              html: emailHtml
            };

            const emailSent = await this.sendEmail(emailData);
            if (emailSent) {
              // Mark main invitee as sent and all invitees under the same student as sent
              console.log(`Updating all invitees for student_item_id: ${invitee.student_item_id}`);
              
              const updateResult = await query(`
                UPDATE bydaya_event_invitees 
                SET mail_send = true, mail_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE student_item_id = $1
              `, [invitee.student_item_id]);
              
              console.log(`Updated ${updateResult.rowCount} invitee records for student_item_id: ${invitee.student_item_id}`);
              
              sent++;
              console.log(`Email sent successfully to ${emailData.to} for student item ${invitee.student_item_id} - marked all invitees as sent`);
            } else {
              failed++;
            }
          } else {
            failed++;
            console.warn(`No email address found for student item ${invitee.student_item_id}`);
          }

        } catch (error) {
          failed++;
          console.error(`Error sending email for student item ${invitee.student_item_id}:`, error);
          
          // Log specific error details for debugging
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              name: error.name,
              stack: error.stack?.split('\n')[0]
            });
          }
        }
      }

      return {
        success: true,
        sent,
        failed
      };

    } catch (error) {
      console.error('Error in sendEventInviteEmails:', error);
      return {
        success: false,
        sent: 0,
        failed: 0
      };
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }

  static async getEmailStatistics(eventId?: number): Promise<{
    total_invitees: number;
    emails_sent: number;
    emails_pending: number;
    last_sent: Date | null;
  }> {
    try {
      let whereClause = '';
      const params: any[] = [];
      
      if (eventId) {
        whereClause = 'WHERE bei.event_id = $1 AND';
        params.push(eventId);
      }
      
      const result = await query(`
        SELECT 
          COUNT(*) as total_invitees,
          SUM(CASE WHEN bei.mail_send = true THEN 1 ELSE 0 END) as emails_sent,
          SUM(CASE WHEN bei.mail_send = false THEN 1 ELSE 0 END) as emails_pending,
          MAX(bei.mail_sent_at) as last_sent
        FROM bydaya_event_invitees bei
        JOIN bydaya_event_items beitem ON bei.student_item_id = beitem.id
        ${whereClause} bei.main_invitee = true
      `, params);

      const stats = result.rows[0];
      return {
        total_invitees: parseInt(stats.total_invitees) || 0,
        emails_sent: parseInt(stats.emails_sent) || 0,
        emails_pending: parseInt(stats.emails_pending) || 0,
        last_sent: stats.last_sent
      };
    } catch (error) {
      console.error('Error getting email statistics:', error);
      return {
        total_invitees: 0,
        emails_sent: 0,
        emails_pending: 0,
        last_sent: null
      };
    }
  }

  static async getDetailedEmailReport(eventId: number): Promise<{
    event_name: string;
    students_with_emails_sent: any[];
    students_pending_emails: any[];
    email_statistics: any;
  }> {
    try {
      // Get event name
      const eventResult = await query(`
        SELECT name FROM bydaya_events WHERE id = $1
      `, [eventId]);
      
      const eventName = eventResult.rows[0]?.name || 'Unknown Event';

      // Get students with emails sent
      const sentResult = await query(`
        SELECT 
          bei.invitees_name,
          beitem.student_name,
          beitem.student_email,
          bei.mail_sent_at
        FROM bydaya_event_invitees bei
        JOIN bydaya_event_items beitem ON bei.student_item_id = beitem.id
        WHERE bei.event_id = $1 
        AND bei.main_invitee = true
        AND bei.mail_send = true
        ORDER BY bei.mail_sent_at DESC
      `, [eventId]);

      // Get students pending emails
      const pendingResult = await query(`
        SELECT 
          bei.invitees_name,
          beitem.student_name,
          beitem.student_email,
          CASE 
            WHEN bei.invitees_qrcode_text IS NULL THEN 'Missing QR Code'
            WHEN beitem.student_email IS NULL THEN 'Missing Email'
            ELSE 'Ready to Send'
          END as status
        FROM bydaya_event_invitees bei
        JOIN bydaya_event_items beitem ON bei.student_item_id = beitem.id
        WHERE bei.event_id = $1 
        AND bei.main_invitee = true
        AND bei.mail_send = false
        ORDER BY beitem.student_name
      `, [eventId]);

      // Get statistics
      const statistics = await this.getEmailStatistics(eventId);

      return {
        event_name: eventName,
        students_with_emails_sent: sentResult.rows,
        students_pending_emails: pendingResult.rows,
        email_statistics: statistics
      };
    } catch (error) {
      console.error('Error getting detailed email report:', error);
      throw error;
    }
  }
}