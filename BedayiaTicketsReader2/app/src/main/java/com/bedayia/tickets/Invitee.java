package com.bedayia.tickets;

import com.google.gson.annotations.SerializedName;

public class Invitee {
    @SerializedName("main_invitee")
    private boolean mainInvitee;
    
    @SerializedName("number_of_seats")
    private int numberOfSeats;
    
    @SerializedName("invitees_qrcode_text")
    private String inviteesQrcodeText;
    
    @SerializedName("invitees_name")
    private String inviteesName;
    
    @SerializedName("invitees_attendance")
    private boolean inviteesAttendance;
    
    @SerializedName("invitees_attendance_time")
    private String inviteesAttendanceTime;

    // Getters and Setters
    public boolean isMainInvitee() {
        return mainInvitee;
    }

    public void setMainInvitee(boolean mainInvitee) {
        this.mainInvitee = mainInvitee;
    }

    public int getNumberOfSeats() {
        return numberOfSeats;
    }

    public void setNumberOfSeats(int numberOfSeats) {
        this.numberOfSeats = numberOfSeats;
    }

    public String getInviteesQrcodeText() {
        return inviteesQrcodeText;
    }

    public void setInviteesQrcodeText(String inviteesQrcodeText) {
        this.inviteesQrcodeText = inviteesQrcodeText;
    }

    public String getInviteesName() {
        return inviteesName;
    }

    public void setInviteesName(String inviteesName) {
        this.inviteesName = inviteesName;
    }

    public boolean isInviteesAttendance() {
        return inviteesAttendance;
    }

    public void setInviteesAttendance(boolean inviteesAttendance) {
        this.inviteesAttendance = inviteesAttendance;
    }

    public String getInviteesAttendanceTime() {
        return inviteesAttendanceTime;
    }

    public void setInviteesAttendanceTime(String inviteesAttendanceTime) {
        this.inviteesAttendanceTime = inviteesAttendanceTime;
    }
} 