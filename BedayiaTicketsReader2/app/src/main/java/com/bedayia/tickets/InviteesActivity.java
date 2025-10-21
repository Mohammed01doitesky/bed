package com.bedayia.tickets;

import android.os.Bundle;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InviteesActivity extends AppCompatActivity implements InviteesAdapter.OnAttendanceChangeListener {
    private ListView inviteesListView;
    private InviteesAdapter adapter;
    private List<Invitee> inviteesList;
    private Button submitButton;
    private View mainInviteeCard;
    private TextView mainInviteeName;
    private TextView mainInviteeQrcode;
    private TextView mainInviteeSeats;
    private Map<Integer, Boolean> originalAttendance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_invitees);

        inviteesListView = findViewById(R.id.invitees_list_view);
        submitButton = findViewById(R.id.submit_button);
        mainInviteeCard = findViewById(R.id.main_invitee_card);
//        mainInviteeName = findViewById(R.id.main_invitee_name);
        mainInviteeQrcode = findViewById(R.id.main_invitee_qrcode);
        mainInviteeSeats = findViewById(R.id.main_invitee_seats);
        inviteesList = new ArrayList<>();
        originalAttendance = new HashMap<>();
        adapter = new InviteesAdapter(this, inviteesList, this);
        inviteesListView.setAdapter(adapter);
        submitButton.setEnabled(false);

        // Get the JSON response from the previous activity
        String jsonResponse = getIntent().getStringExtra("INVITEES_DATA");
        if (jsonResponse != null) {
            parseInviteesData(jsonResponse);
        }

        // Set up submit button
        submitButton.setOnClickListener(v -> submitAttendanceData());
    }

    private void parseInviteesData(String jsonResponse) {
        try {
            Gson gson = new Gson();
            Type listType = new TypeToken<List<Invitee>>(){}.getType();
            List<Invitee> invitees = gson.fromJson(jsonResponse, listType);
            
            // Find main invitee
            Invitee mainInvitee = null;
            for (Invitee inv : invitees) {
                    mainInvitee = inv;
                    break;
            }
            if (mainInvitee != null) {
                mainInviteeCard.setVisibility(View.VISIBLE);
//                mainInviteeName.setText("Name: " + mainInvitee.getInviteesName());
                mainInviteeSeats.setText("Seats: " + mainInvitee.getNumberOfSeats());
                mainInviteeQrcode.setText("QRCode: " + mainInvitee.getInviteesQrcodeText());
            } else {
                mainInviteeCard.setVisibility(View.GONE);
            }

            inviteesList.clear();
            inviteesList.addAll(invitees);
            // Store original attendance states
            originalAttendance.clear();
            for (int i = 0; i < inviteesList.size(); i++) {
                originalAttendance.put(i, inviteesList.get(i).isInviteesAttendance());
            }
            adapter.notifyDataSetChanged();
            submitButton.setEnabled(false);
            
        } catch (Exception e) {
            Toast.makeText(this, "Error parsing data: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void submitAttendanceData() {
        // Show loading state
        submitButton.setEnabled(false);
        submitButton.setText("Submitting...");

        // Send updated data to API
        OdooApiService.getInstance(this).updateInviteesData(inviteesList, new OdooApiCallback() {
            @Override
            public void onSuccess(String response) {
                runOnUiThread(() -> {
                    submitButton.setEnabled(false);
                    submitButton.setText("Submit Attendance");
                    Toast.makeText(InviteesActivity.this, "Attendance updated successfully!", Toast.LENGTH_LONG).show();
                    finish();
                });
            }

            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    submitButton.setEnabled(true);
                    submitButton.setText("Submit Attendance");
                    Toast.makeText(InviteesActivity.this, "Error: " + error, Toast.LENGTH_LONG).show();
                });
            }
        });
    }

    // Called by adapter when a checkbox is changed
    @Override
    public void onAttendanceChanged() {
        boolean changed = false;
        for (int i = 0; i < inviteesList.size(); i++) {
            if (originalAttendance.containsKey(i) && inviteesList.get(i).isInviteesAttendance() != originalAttendance.get(i)) {
                changed = true;
                break;
            }
        }
        submitButton.setEnabled(changed);
    }
} 