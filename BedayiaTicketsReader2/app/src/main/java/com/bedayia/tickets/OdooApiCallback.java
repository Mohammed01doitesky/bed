package com.bedayia.tickets;

public interface OdooApiCallback {
    void onSuccess(String response);
    void onError(String error);
} 