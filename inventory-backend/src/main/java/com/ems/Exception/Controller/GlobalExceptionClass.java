package com.ems.Exception.Controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

import org.springframework.boot.actuate.autoconfigure.observation.ObservationProperties.Http;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
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


    private ResponseEntity<ErrorMessage> buildResponse(String message, String details, HttpStatus status) {
        ErrorMessage errorMessage = new ErrorMessage(message, details, LocalDateTime.now());
        return new ResponseEntity<>(errorMessage, status);
    }


    @ExceptionHandler(ItemNotFoundException.class)
    public ResponseEntity<ErrorMessage> itemNotFound(ItemNotFoundException ex) {
       return buildResponse(ex.getMessage(),"Item Not Found",HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(CustomOrderNotFoundException.class)
    public ResponseEntity<ErrorMessage> customOrderNotFound(CustomOrderNotFoundException ex) {
        return buildResponse(ex.getMessage(), "Custom order not found", HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InsufficientQuantity.class)
    public ResponseEntity<ErrorMessage> insufficientQuantity(InsufficientQuantity ex){
       return buildResponse(ex.getMessage(),"Insufficient Quantity",HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorMessage> handleConstraintViolation(ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(java.util.stream.Collectors.joining(", "));
        return buildResponse(message, "Validation Failed", HttpStatus.BAD_REQUEST);
    }


    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorMessage> NoSuchElement(NoSuchElementException ex) {
        return buildResponse (ex.getMessage(),"Resource Not Found " ,HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(LoanNotFoundException.class)
    public ResponseEntity<ErrorMessage> loanNotFound(LoanNotFoundException ex) {
    return buildResponse (ex.getMessage(),"Loan not found" , HttpStatus.NOT_FOUND);

    }

   @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class, DateTimeParseException.class, HttpMessageNotReadableException.class})
   public ResponseEntity<ErrorMessage> handleBadRequest(Exception ex) {
    return buildResponse(ex.getMessage(), "Malformed Request or Invalid Operation", HttpStatus.BAD_REQUEST);
   }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessage> handleGenericException(Exception ex) {
        log.error("Unhandled internal server error: ", ex);
      
        return buildResponse("An internal server error occurred. Please contact the administrator.", "Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
    }

}
