package com.bedayia.tickets;

import com.google.gson.annotations.SerializedName;

public class LoginRequest {
    @SerializedName("login")
    private String login;
    
    @SerializedName("password")
    private String password;
    
    @SerializedName("db")
    private String db;

    public LoginRequest(String login, String password, String db) {
        this.login = login;
        this.password = password;
        this.db = db;
    }

    // Getters and Setters
    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getDb() {
        return db;
    }

    public void setDb(String db) {
        this.db = db;
    }
} 