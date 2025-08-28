import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { corsHeaders } from '@/lib/middleware';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inviteeId = parseInt(id);

    // Get invitee data
    const result = await query(`
      SELECT 
        inv.invitees_qrcode_text,
        inv.invitees_name,
        e.name as event_name,
        ei.student_name
      FROM bydaya_event_invitees inv
      JOIN bydaya_event_items ei ON inv.student_item_id = ei.id
      JOIN bydaya_events e ON inv.event_id = e.id
      WHERE inv.id = $1 AND inv.active = true
    `, [inviteeId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invitee not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    const invitee = result.rows[0];
    
    // Generate QR code as base64
    const qrCodeBuffer = await QRCode.toBuffer(invitee.invitees_qrcode_text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const qrCodeBase64 = qrCodeBuffer.toString('base64');

    return NextResponse.json({
      qrcode: qrCodeBase64,
      qrcode_text: invitee.invitees_qrcode_text,
      invitee_name: invitee.invitees_name,
      event_name: invitee.event_name,
      student_name: invitee.student_name,
      success: true
    }, {
      status: 200,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { 
        status: 500,
        headers: corsHeaders()
      }
    );
  }
}