package com.ems.Exception.Custom_Exception;

public class InsufficientQuantity extends RuntimeException {
    
    public InsufficientQuantity(String message) {
        super(message);
    }
}
