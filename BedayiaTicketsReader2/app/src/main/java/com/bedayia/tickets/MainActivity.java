package com.bedayia.tickets;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.widget.ImageButton;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
    private static final int QR_SCAN_REQUEST_CODE = 1001;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1002;
    private static final String PREFS_NAME = "LoginPrefs";
    private static final String API_KEY = "api_key";
    private static final String USERNAME = "username";
    
    private ImageButton scanButton;
    private ImageButton logoutButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        scanButton = findViewById(R.id.scan_button);
        logoutButton = findViewById(R.id.logout_button);
        
        scanButton.setOnClickListener(v -> {
            if (checkCameraPermission()) {
                launchQRScanner();
            } else {
                requestCameraPermission();
            }
        });

        logoutButton.setOnClickListener(v -> logout());
    }

    private void logout() {
        // Get the stored API key and username
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String apiKey = prefs.getString(API_KEY, "");
        String username = prefs.getString(USERNAME, "");
        
        if (!apiKey.isEmpty() && !username.isEmpty()) {
            // Call logout API
            OdooApiService.getInstance(this).logout(apiKey, username, new OdooApiCallback() {
                @Override
                public void onSuccess(String response) {
                    runOnUiThread(() -> {
                        // Clear the API key and username from SharedPreferences
                        SharedPreferences.Editor editor = prefs.edit();
                        editor.remove(API_KEY);
                        editor.remove(USERNAME);
                        editor.apply();

                        // Show logout message
                        Toast.makeText(MainActivity.this, "Logged out successfully", Toast.LENGTH_SHORT).show();

                        // Go back to LoginActivity
                        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                    });
                }

                @Override
                public void onError(String error) {
                    runOnUiThread(() -> {
                        // Even if API call fails, still logout locally
                        SharedPreferences.Editor editor = prefs.edit();
                        editor.remove(API_KEY);
                        editor.remove(USERNAME);
                        editor.apply();

                        Toast.makeText(MainActivity.this, "Logged out (offline)", Toast.LENGTH_SHORT).show();

                        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                    });
                }
            });
        } else {
            // No API key or username stored, just go to login
            Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();
            
            Intent intent = new Intent(MainActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        }
    }

    private boolean checkCameraPermission() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void requestCameraPermission() {
        ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.CAMERA},
                CAMERA_PERMISSION_REQUEST_CODE);
    }

    private void launchQRScanner() {
        Intent intent = new Intent(MainActivity.this, QRScannerActivity.class);
        startActivityForResult(intent, QR_SCAN_REQUEST_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                launchQRScanner();
            } else {
                Toast.makeText(this, "Camera permission is required to scan QR codes",
                        Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == QR_SCAN_REQUEST_CODE && resultCode == RESULT_OK) {
            String scannedData = data.getStringExtra("SCANNED_DATA");
            if (scannedData != null) {
                // Send the scanned data to Odoo API and launch InviteesActivity
                sendToOdooAPI(scannedData);
            }
        }
    }

    private void sendToOdooAPI(String scannedData) {
        OdooApiService.getInstance(this).getInviteesData(scannedData, new OdooApiCallback() {
            @Override
            public void onSuccess(String response) {
                runOnUiThread(() -> {
                    Intent intent = new Intent(MainActivity.this, InviteesActivity.class);
                    intent.putExtra("INVITEES_DATA", response);
                    startActivity(intent);
                });
            }

            @Override
            public void onError(String error) {
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "Error: " + error, Toast.LENGTH_LONG).show();
                });
            }
        });
    }
} 