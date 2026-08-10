package com.ems.Exception.Controller;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.ems.Exception.Custom_Exception.CustomOrderNotFoundException;
import com.ems.Exception.Custom_Exception.InsufficientQuantity;
import com.ems.Exception.Custom_Exception.ItemNotFoundException;
import com.ems.Exception.Custom_Exception.LoanNotFoundException;
import com.ems.Exception.model.ErrorMessage;
import java.util.NoSuchElementException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;


import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionClass {

    @ExceptionHandler(ItemNotFoundException.class)
    public ResponseEntity<?> itemNotFound(ItemNotFoundException ex) {
       ErrorMessage errorMessage = new ErrorMessage(ex.getMessage(),"item is not present ", LocalDateTime.now());
       return new ResponseEntity<>(errorMessage, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(CustomOrderNotFoundException.class)
    public ResponseEntity<?> customOrderNotFound(CustomOrderNotFoundException ex) {
        ErrorMessage errorMessage = new ErrorMessage(ex.getMessage(), "Custom order not found", LocalDateTime.now());
        return new ResponseEntity<>(errorMessage, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InsufficientQuantity.class)
    public ResponseEntity<ErrorMessage> insufficientQuantity(InsufficientQuantity ex){
        ErrorMessage em= new ErrorMessage(ex.getMessage(),"Insufficient Quantity",LocalDateTime.now());
        log.warn("Insufficient quantity: {}", ex.getMessage());
        return new ResponseEntity<>(em, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorMessage> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorMessage em = new ErrorMessage(ex.getMessage(), "Invalid input", LocalDateTime.now());
        return new ResponseEntity<>(em, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorMessage> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(java.util.stream.Collectors.joining(", "));
        
        ErrorMessage em = new ErrorMessage(message, "Validation Failed", LocalDateTime.now());
        return new ResponseEntity<>(em, HttpStatus.BAD_REQUEST);
    }


    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorMessage> handleNoSuchElement(NoSuchElementException ex) {
        ErrorMessage em = new ErrorMessage(ex.getMessage(), "Resource not found", LocalDateTime.now());
        return new ResponseEntity<>(em, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessage> handleGenericException(Exception ex) {
        ErrorMessage em = new ErrorMessage(ex.getMessage(), "Internal Server Error", LocalDateTime.now());
        log.error("Unhandled exception", ex);
        return new ResponseEntity<>(em, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(LoanNotFoundException.class)
    public ResponseEntity<ErrorMessage> loanNotFound(LoanNotFoundException ex) {
    ErrorMessage errorMessage = new ErrorMessage(ex.getMessage(), "Loan not found", LocalDateTime.now());
    return new ResponseEntity<>(errorMessage, HttpStatus.NOT_FOUND);
}
}

