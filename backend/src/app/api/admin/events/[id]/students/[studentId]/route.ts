import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    const { id, studentId: studentIdStr } = await params;
    const eventId = parseInt(id);
    const studentId = parseInt(studentIdStr);
    const body = await request.json();
    
    const {
      student_id,
      student_name,
      student_email,
      student_email_parent_1,
      student_email_parent_2,
      number_of_seats,
      invitees
    } = body;

    // Validate required fields
    if (!student_id || !student_name || !student_email || !student_email_parent_1) {
      return NextResponse.json(
        { error: "Required fields: student_id, student_name, student_email, student_email_parent_1" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Set default number_of_seats to 1
    const defaultNumberOfSeats = number_of_seats || 1;

    // Check if student ID already exists in this event (excluding current student)
    const existingStudent = await query(
      'SELECT id FROM bydaya_event_items WHERE event_id = $1 AND student_id = $2 AND active = true AND id != $3',
      [eventId, student_id, studentId]
    );
    
    if (existingStudent.rows.length > 0) {
      return NextResponse.json(
        { error: "Student ID already exists in this event" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Update the student
    const result = await query(`
      UPDATE bydaya_event_items 
      SET 
        student_id = $1,
        student_name = $2,
        student_email = $3,
        student_email_parent_1 = $4,
        student_email_parent_2 = $5,
        number_of_seats = $6,
        invitees = $7,
        updated_at = NOW()
      WHERE id = $8 AND event_id = $9 AND active = true
      RETURNING *
    `, [
      student_id,
      student_name,
      student_email,
      student_email_parent_1,
      student_email_parent_2 || null,
      defaultNumberOfSeats,
      invitees || null,
      studentId,
      eventId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Update the main student invitee record
    await query(`
      UPDATE bydaya_event_invitees 
      SET invitees_name = $1, updated_at = NOW()
      WHERE student_item_id = $2 AND event_id = $3 AND main_invitee = true AND active = true
    `, [student_name, studentId, eventId]);

    // If invitees list changed, update additional invitee records (not the main student)
    if (invitees !== undefined) {
      // First, deactivate existing non-main invitees for this student
      await query(`
        UPDATE bydaya_event_invitees 
        SET active = false, updated_at = NOW()
        WHERE student_item_id = $1 AND event_id = $2 AND main_invitee = false
      `, [studentId, eventId]);

      // Parse the invitees list and create new records for additional invitees
      const inviteeNames = invitees ? invitees.split(',').map((name: string) => name.trim()).filter((name: string) => name.length > 0) : [];
      
      if (inviteeNames.length > 0) {
        // Use the main student's QR code for all family members
        const mainQrCodeText = `EventID : ${eventId},ID : ${studentId}, Name : ${student_name}`;
        
        for (const inviteeName of inviteeNames) {
          await query(`
            INSERT INTO bydaya_event_invitees (
              event_id, 
              student_item_id, 
              invitees_name, 
              invitees_qrcode_text,
              main_invitee,
              invitees_attendance,
              active,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          `, [
            eventId,
            studentId, 
            inviteeName,
            mainQrCodeText, // All family members use the main student's QR code
            false, // These are additional invitees, not main
            false,
            true
          ]);
        }
      }
    }

    return NextResponse.json({
      student: result.rows[0],
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  try {
    const { id, studentId: studentIdStr } = await params;
    const eventId = parseInt(id);
    const studentId = parseInt(studentIdStr);

    // Soft delete student
    const result = await query(`
      UPDATE bydaya_event_items 
      SET active = false, updated_at = NOW()
      WHERE id = $1 AND event_id = $2 AND active = true
      RETURNING id
    `, [studentId, eventId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Also soft delete related invitees
    await query(`
      UPDATE bydaya_event_invitees 
      SET active = false, updated_at = NOW()
      WHERE student_item_id = $1
    `, [studentId]);

    return NextResponse.json({
      message: "Student deleted successfully",
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}