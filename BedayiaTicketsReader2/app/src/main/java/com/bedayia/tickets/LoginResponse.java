package com.bedayia.tickets;

import com.google.gson.annotations.SerializedName;

public class LoginResponse {
    @SerializedName("message")
    private LoginMessage message;
    
    @SerializedName("success")
    private boolean success;

    public static class LoginMessage {
        @SerializedName("apikey")
        private String apikey;

        public String getApikey() {
            return apikey;
        }

        public void setApikey(String apikey) {
            this.apikey = apikey;
        }
    }

    public LoginMessage getMessage() {
        return message;
    }

    public void setMessage(LoginMessage message) {
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
} 