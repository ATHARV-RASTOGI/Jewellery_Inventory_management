package com.ems.Exception.Custom_Exception;

public class LoanNotFoundException extends RuntimeException{
    
    public LoanNotFoundException(String message) {
        super(message);
    }
}
