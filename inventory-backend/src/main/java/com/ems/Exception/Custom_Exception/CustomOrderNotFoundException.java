package com.ems.Exception.Custom_Exception;


public class CustomOrderNotFoundException extends RuntimeException{

    public CustomOrderNotFoundException(Long id){
        super("Custom order not found with id: " + id);
    }
    
}

                                                                                                                    