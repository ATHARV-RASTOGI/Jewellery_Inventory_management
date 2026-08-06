package com.ems.Exception.Custom_Exception;

public class ItemNotFountException extends RuntimeException{

    public ItemNotFountException(String message){
        super(message);
    }
}
