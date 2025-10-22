import { query } from '@/lib/db/connection';
import { BydayaEventInvitee, GetDataResponse, UpdateDataRequest } from '@/types';
import { format } from 'date-fns';

export class EventService {
  
  static async getInviteesByQRCode(qrCodeText: string): Promise<GetDataResponse> {
    try {
      const result = await query(`
        SELECT 
          bei.main_invitee,
          bei.invitees_qrcode_text,
          bei.invitees_name,
          bei.invitees_attendance,
          bei.invitees_attendance_time,
          beitem.number_of_seats
        FROM bydaya_event_invitees bei
        JOIN bydaya_event_items beitem ON bei.student_item_id = beitem.id
        WHERE bei.invitees_qrcode_text = $1 AND bei.main_invitee = false
        ORDER BY bei.id
      `, [qrCodeText]);

      const invitees = result.rows.map(row => ({
        main_invitee: row.main_invitee,
        number_of_seats: row.number_of_seats || null,
        invitees_qrcode_text: row.invitees_qrcode_text,
        invitees_name: row.invitees_name,
        invitees_attendance: row.invitees_attendance,
        invitees_attendance_time: row.invitees_attendance_time 
          ? format(new Date(row.invitees_attendance_time), 'yyyy-MM-dd HH:mm:ss')
          : null
      }));

      return {
        message: invitees,
        success: true
      };
    } catch (error) {
      console.error('Error fetching invitees:', error);
      throw error;
    }
  }

  static async updateInviteesAttendance(updateData: UpdateDataRequest): Promise<{ message: string; success: boolean }> {
    try {
      for (const invitee of updateData.invitees) {
        const { invitees_name, invitees_attendance, invitees_qrcode_text } = invitee;

        // Find the invitee record
        const findResult = await query(`
          SELECT id, invitees_attendance_time 
          FROM bydaya_event_invitees 
          WHERE invitees_qrcode_text = $1 AND invitees_name = $2
        `, [invitees_qrcode_text, invitees_name]);

        if (findResult.rows.length > 0) {
          const inviteeRecord = findResult.rows[0];
          
          // Only update if attendance is true and no previous attendance time
          if (invitees_attendance && !inviteeRecord.invitees_attendance_time) {
            await query(`
              UPDATE bydaya_event_invitees 
              SET invitees_attendance = true, 
                  invitees_attendance_time = NOW(),
                  updated_at = NOW()
              WHERE id = $1
            `, [inviteeRecord.id]);
          }
        }
      }

      return {
        message: "Successfully updated invitee's attendance",
        success: true
      };
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  }

  static async createEvent(eventData: {
    name: string;
    location?: string;
    email_subject?: string;
  }) {
    try {
      const result = await query(`
        INSERT INTO bydaya_events (name, location, email_subject)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [eventData.name, eventData.location, eventData.email_subject || 'BIS Tickets']);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  static async createEventItem(itemData: {
    event_id: number;
    student_id: string;
    student_name: string;
    student_email: string;
    student_email_parent_1: string;
    student_email_parent_2?: string;
    number_of_seats: number;
    invitees?: string;
  }) {
    try {
      // Create the event item
      const itemResult = await query(`
        INSERT INTO bydaya_event_items 
        (event_id, student_id, student_name, student_email, student_email_parent_1, student_email_parent_2, number_of_seats, invitees)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        itemData.event_id,
        itemData.student_id,
        itemData.student_name,
        itemData.student_email,
        itemData.student_email_parent_1,
        itemData.student_email_parent_2,
        itemData.number_of_seats,
        itemData.invitees
      ]);

      const eventItem = itemResult.rows[0];

      // Generate QR code text
      const qrCodeText = `${itemData.student_id}${itemData.student_name}`;

      // Create main invitee
      await query(`
        INSERT INTO bydaya_event_invitees 
        (event_id, student_item_id, invitees_name, invitees_qrcode_text, main_invitee)
        VALUES ($1, $2, $3, $4, true)
      `, [itemData.event_id, eventItem.id, itemData.student_name, qrCodeText]);

      // Create additional invitees if provided
      if (itemData.invitees) {
        const inviteeNames = itemData.invitees.split(',');
        for (const name of inviteeNames) {
          const trimmedName = name.trim();
          if (trimmedName) {
            await query(`
              INSERT INTO bydaya_event_invitees 
              (event_id, student_item_id, invitees_name, invitees_qrcode_text, main_invitee)
              VALUES ($1, $2, $3, $4, false)
            `, [itemData.event_id, eventItem.id, trimmedName, qrCodeText]);
          }
        }
      }

      return eventItem;
    } catch (error) {
      console.error('Error creating event item:', error);
      throw error;
    }
  }
}