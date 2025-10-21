package com.bedayia.tickets;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class LoginActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "LoginPrefs";
    private static final String API_KEY = "api_key";
    private static final String USERNAME = "username";
    private static final String DB_NAME = "bedayia_school";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        EditText emailField = findViewById(R.id.email_field);
        EditText passwordField = findViewById(R.id.password_field);
        Button loginButton = findViewById(R.id.login_button);

        loginButton.setOnClickListener(v -> {
            String username = emailField.getText().toString().trim();
            String password = passwordField.getText().toString().trim();

            if (TextUtils.isEmpty(username) || TextUtils.isEmpty(password)) {
                Toast.makeText(this, "Please enter username and password", Toast.LENGTH_SHORT).show();
                return;
            }

            // Show loading state
            loginButton.setEnabled(false);
            loginButton.setText("Logging in...");

            // Make login API call
            OdooApiService.getInstance(this).login(username, password, DB_NAME, new OdooApiCallback() {
                @Override
                public void onSuccess(String apiKey) {
                    runOnUiThread(() -> {
                        // Save API key and username to SharedPreferences
                        saveApiKey(apiKey, username);
                        
                        // Navigate to MainActivity
                        Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                        startActivity(intent);
                        finish();
                    });
                }

                @Override
                public void onError(String error) {
                    runOnUiThread(() -> {
                        loginButton.setEnabled(true);
                        loginButton.setText("Login");
                        Toast.makeText(LoginActivity.this, error, Toast.LENGTH_LONG).show();
                    });
                }
            });
        });
    }

    private void saveApiKey(String apiKey, String username) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(API_KEY, apiKey);
        editor.putString(USERNAME, username);
        editor.apply();
    }

    // Method to get saved API key (can be used in other activities)
    public static String getApiKey(SharedPreferences prefs) {
        return prefs.getString(API_KEY, "");
    }

    // Method to get saved username (can be used in other activities)
    public static String getUsername(SharedPreferences prefs) {
        return prefs.getString(USERNAME, "");
    }
} 