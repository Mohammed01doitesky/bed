package com.bedayia.tickets;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import retrofit2.http.Body;
import retrofit2.http.POST;
import java.io.IOException;
import java.util.List;

public class OdooApiService {
    private static final String TAG = "OdooApiService";
    private static final String BASE_URL = "http://192.168.1.2:3000/api/v1/";
    private static final String PREFS_NAME = "LoginPrefs";
    private static final String API_KEY = "api_key";
    
    private static OdooApiService instance;
    private final OdooApiInterface apiInterface;
    private Context context;

    private OdooApiService(Context context) {
        this.context = context;
        
        // Create logging interceptor
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        // Create authorization interceptor
        Interceptor authInterceptor = new Interceptor() {
            @Override
            public okhttp3.Response intercept(Chain chain) throws IOException {
                Request originalRequest = chain.request();
                
                // Get API key from SharedPreferences
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String apiKey = prefs.getString(API_KEY, "");
                
                // Add Authorization header if API key exists
                Request.Builder requestBuilder = originalRequest.newBuilder();
                if (!apiKey.isEmpty()) {
                    requestBuilder.addHeader("Authorization", "Bearer " + apiKey);
                }
                
                Request request = requestBuilder.build();
                return chain.proceed(request);
            }
        };

        // Create OkHttp client with interceptors
        OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(logging)
                .addInterceptor(authInterceptor)
                .build();

        // Create Retrofit instance
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        apiInterface = retrofit.create(OdooApiInterface.class);
    }

    public static synchronized OdooApiService getInstance(Context context) {
        if (instance == null) {
            instance = new OdooApiService(context);
        }
        return instance;
    }

    public void login(String username, String password, String db, OdooApiCallback callback) {
        LoginRequest loginRequest = new LoginRequest(username, password, db);
        
        Call<JsonObject> call = apiInterface.login(loginRequest);
        call.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonObject loginResponse = response.body();
                    boolean success = loginResponse.has("success") && loginResponse.get("success").getAsBoolean();
                    
                    if (success && loginResponse.has("message")) {
                        JsonArray messageArray = loginResponse.getAsJsonArray("message");
                        if (messageArray.size() > 0) {
                            JsonObject message = messageArray.get(0).getAsJsonObject();
                            if (message.has("apikey")) {
                                String apiKey = message.get("apikey").getAsString();
                                Log.d(TAG, "Login successful, API key: " + apiKey);
                                callback.onSuccess(apiKey);
                            } else {
                                Log.e(TAG, "Login response missing apikey");
                                callback.onError("Login failed: No API key in response");
                            }
                        } else {
                            Log.e(TAG, "Login response message array is empty");
                            callback.onError("Login failed: Empty response");
                        }
                    } else {
                        Log.e(TAG, "Login failed: success = " + success);
                        callback.onError("Login failed: Invalid credentials");
                    }
                } else {
                    Log.e(TAG, "Login API Error: " + response.code() + " " + response.message());
                    callback.onError("Login failed: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Log.e(TAG, "Login Network Error", t);
                callback.onError("Network Error: " + t.getMessage());
            }
        });
    }

    public void logout(String apiKey, String username, OdooApiCallback callback) {
        // Create request body with API key and username
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("api_key", apiKey);
        requestBody.addProperty("username", username);
        
        Call<JsonObject> call = apiInterface.logout(requestBody);
        call.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonObject logoutResponse = response.body();
                    boolean success = logoutResponse.has("success") && logoutResponse.get("success").getAsBoolean();
                    
                    if (success) {
                        Log.d(TAG, "Logout successful: " + logoutResponse.get("message").getAsString());
                        callback.onSuccess("Logout successful");
                    } else {
                        Log.e(TAG, "Logout failed");
                        callback.onError("Logout failed");
                    }
                } else {
                    Log.e(TAG, "Logout API Error: " + response.code() + " " + response.message());
                    callback.onError("Logout failed: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Log.e(TAG, "Logout Network Error", t);
                callback.onError("Network Error: " + t.getMessage());
            }
        });
    }

    public void getInviteesData(String qrCodeText, OdooApiCallback callback) {
        // Send invitees_qrcode_text in the body
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("invitees_qrcode_text", qrCodeText);
        Call<JsonObject> call = apiInterface.getInviteesData(requestBody);
        call.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Log.d(TAG, "API Response: " + response.body().toString());
                    // Extract the invitees array from the "message" field
                    JsonArray inviteesArray = response.body().getAsJsonArray("message");
                    if (inviteesArray != null) {
                        callback.onSuccess(inviteesArray.toString());
                    } else {
                        callback.onError("No invitees data found in response");
                    }
                } else {
                    Log.e(TAG, "API Error: " + response.code() + " " + response.message());
                    callback.onError("API Error: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Log.e(TAG, "Network Error", t);
                callback.onError("Network Error: " + t.getMessage());
            }
        });
    }

    public void updateInviteesData(List<Invitee> invitees, OdooApiCallback callback) {
        // Create request body with invitees list
        JsonObject requestBody = new JsonObject();
        JsonArray inviteesArray = new JsonArray();
        
        for (Invitee invitee : invitees) {
            JsonObject inviteeObject = new JsonObject();
            inviteeObject.addProperty("main_invitee", invitee.isMainInvitee());
            inviteeObject.addProperty("number_of_seats", invitee.getNumberOfSeats());
            inviteeObject.addProperty("invitees_qrcode_text", invitee.getInviteesQrcodeText());
            inviteeObject.addProperty("invitees_name", invitee.getInviteesName());
            inviteeObject.addProperty("invitees_attendance", invitee.isInviteesAttendance());
            inviteeObject.addProperty("invitees_attendance_time", invitee.getInviteesAttendanceTime());
            inviteesArray.add(inviteeObject);
        }
        
        requestBody.add("invitees", inviteesArray);

        // Make API call
        Call<JsonObject> call = apiInterface.updateInviteesData(requestBody);
        call.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Log.d(TAG, "Update API Response: " + response.body().toString());
                    callback.onSuccess(response.body().toString());
                } else {
                    Log.e(TAG, "Update API Error: " + response.code() + " " + response.message());
                    callback.onError("Update API Error: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Log.e(TAG, "Update Network Error", t);
                callback.onError("Update Network Error: " + t.getMessage());
            }
        });
    }

    // Retrofit interface for API calls
    private interface OdooApiInterface {
        @POST("tickets/login")
        Call<JsonObject> login(@Body LoginRequest loginRequest);
        
        @POST("tickets/get_data")
        Call<JsonObject> getInviteesData(@Body JsonObject requestBody);
        
        @POST("tickets/update_data")
        Call<JsonObject> updateInviteesData(@Body JsonObject requestBody);
        
        @POST("tickets/logout")
        Call<JsonObject> logout(@Body JsonObject requestBody);
    }
} 