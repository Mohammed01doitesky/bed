import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';
import { EventService } from '@/lib/services/eventService';
import { corsHeaders } from '@/lib/middleware';
import * as XLSX from 'xlsx';

interface StudentRow {
  student_id: string;
  student_name: string;
  student_email: string;
  student_email_parent_1: string;
  student_email_parent_2?: string;
  number_of_seats?: number;
  invitees?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    
    // Check if event exists
    const eventCheck = await query('SELECT id FROM bydaya_events WHERE id = $1 AND active = true', [eventId]);
    if (eventCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Please upload .xlsx, .xls, or .csv file" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Read and parse the file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { success: false, message: "No worksheets found in the file" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json(
        { success: false, message: "No data found in the file" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Get column names from the first row
    const firstRow = jsonData[0];
    const columnNames = Object.keys(firstRow);
    
    // Function to find column by various name patterns (case insensitive, flexible matching)
    const findColumn = (patterns: string[]): string | null => {
      for (const pattern of patterns) {
        const found = columnNames.find(col => {
          const cleanCol = col.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          const cleanPattern = pattern.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanCol.includes(cleanPattern) || cleanPattern.includes(cleanCol);
        });
        if (found) return found;
      }
      return null;
    };

    // Look for required columns with flexible naming
    const studentIdCol = findColumn(['studentid', 'id', 'studentnumber', 'number', 'رقم', 'code']);
    const studentNameCol = findColumn(['studentname', 'name', 'fullname', 'اسم']);
    const studentEmailCol = findColumn(['studentemail', 'email', 'mail', 'البريد']);
    const parent1EmailCol = findColumn(['parentemail', 'parent1', 'guardian', 'ولي', 'father', 'mother']);

    // If we can't find the required columns, show what's available
    const missingInfo = [];
    if (!studentIdCol) missingInfo.push('Student ID/Number');
    if (!studentNameCol) missingInfo.push('Student Name');
    if (!studentEmailCol) missingInfo.push('Student Email');
    if (!parent1EmailCol) missingInfo.push('Parent Email');
    
    if (missingInfo.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Could not automatically match column names`,
        errors: [
          `Available columns in your Excel file: ${columnNames.join(', ')}`,
          `Could not find: ${missingInfo.join(', ')}`,
          `Please check your column names match one of these patterns:`,
          `- Student ID: containing 'id', 'number', 'student'`,
          `- Student Name: containing 'name', 'student'`, 
          `- Student Email: containing 'email', 'mail'`,
          `- Parent Email: containing 'parent', 'guardian', 'father', 'mother'`
        ]
      }, { status: 400, headers: corsHeaders() });
    }

    // Process each row
    const errors: string[] = [];
    let studentsAdded = 0;
    const existingStudentIds: string[] = [];

    // Get existing student IDs for this event
    const existingStudents = await query(
      'SELECT student_id FROM bydaya_event_items WHERE event_id = $1 AND active = true',
      [eventId]
    );
    const existingIds = new Set(existingStudents.rows.map(row => row.student_id));

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because array is 0-indexed and assuming row 1 is headers

      try {
        // Use the dynamically found column names
        const normalizedRow: StudentRow = {
          student_id: row[studentIdCol!]?.toString().trim(),
          student_name: row[studentNameCol!]?.toString().trim(),
          student_email: row[studentEmailCol!]?.toString().trim(),
          student_email_parent_1: row[parent1EmailCol!]?.toString().trim(),
          student_email_parent_2: findColumn(['parent2', 'parentemail2', 'guardian2', 'mother', 'father']) ? 
            row[findColumn(['parent2', 'parentemail2', 'guardian2', 'mother', 'father'])!]?.toString().trim() : '',
          number_of_seats: parseInt(findColumn(['seats', 'numberofseats', 'seat']) ? 
            row[findColumn(['seats', 'numberofseats', 'seat'])!]?.toString() || '1' : '1'),
          invitees: findColumn(['invitees', 'guests', 'attendees']) ? 
            row[findColumn(['invitees', 'guests', 'attendees'])!]?.toString().trim() : ''
        };

        // Validate required fields
        if (!normalizedRow.student_id || !normalizedRow.student_name || !normalizedRow.student_email || !normalizedRow.student_email_parent_1) {
          errors.push(`Row ${rowNumber}: Missing required data`);
          continue;
        }

        // Check if student ID already exists
        if (existingIds.has(normalizedRow.student_id)) {
          existingStudentIds.push(normalizedRow.student_id);
          errors.push(`Row ${rowNumber}: Student ID '${normalizedRow.student_id}' already exists in this event`);
          continue;
        }

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedRow.student_email)) {
          errors.push(`Row ${rowNumber}: Invalid student email format`);
          continue;
        }
        if (!emailRegex.test(normalizedRow.student_email_parent_1)) {
          errors.push(`Row ${rowNumber}: Invalid parent 1 email format`);
          continue;
        }
        if (normalizedRow.student_email_parent_2 && !emailRegex.test(normalizedRow.student_email_parent_2)) {
          errors.push(`Row ${rowNumber}: Invalid parent 2 email format`);
          continue;
        }

        // Create the student
        await EventService.createEventItem({
          event_id: eventId,
          student_id: normalizedRow.student_id,
          student_name: normalizedRow.student_name,
          student_email: normalizedRow.student_email,
          student_email_parent_1: normalizedRow.student_email_parent_1,
          student_email_parent_2: normalizedRow.student_email_parent_2 || undefined,
          number_of_seats: normalizedRow.number_of_seats || 1,
          invitees: normalizedRow.invitees || undefined
        });

        studentsAdded++;
        existingIds.add(normalizedRow.student_id); // Add to set to prevent duplicates within the same file

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        errors.push(`Row ${rowNumber}: Failed to process - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const response = {
      success: studentsAdded > 0,
      message: studentsAdded > 0 
        ? `Successfully processed ${studentsAdded} out of ${jsonData.length} students`
        : 'No students were added',
      studentsAdded,
      errors: errors.length > 0 ? errors : undefined
    };

    return NextResponse.json(response, {
      status: studentsAdded > 0 ? 200 : 400,
      headers: corsHeaders()
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to process file",
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    }, { 
      status: 500,
      headers: corsHeaders()
    });
  }
}