package com.ems.Exception.Controller;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.ems.Exception.Custom_Exception.BackendNotResponding;
import com.ems.Exception.Custom_Exception.InsufficientQuantity;
import com.ems.Exception.Custom_Exception.ItemNotFountException;
import com.ems.Exception.Custom_Exception.NoDataSaved;
import com.ems.Exception.model.ErrorMessage;

@RestControllerAdvice
public class GlobalExceptionClass {

    @ExceptionHandler(ItemNotFountException.class)
    public ResponseEntity<?> itemNotFound(ItemNotFountException ex) {
       ErrorMessage errorMessage = new ErrorMessage(ex.getMessage(),"item is not present ", LocalDateTime.now());
       return new ResponseEntity<>(errorMessage, HttpStatus.NOT_FOUND);
    }


    @ExceptionHandler(BackendNotResponding.class)
    public ResponseEntity<?> BackendNotFound(BackendNotResponding ex){
        ErrorMessage em = new ErrorMessage(ex.getMessage(),"Problem in the backend service ", LocalDateTime.now());
        System.out.println(em);
        return new ResponseEntity<>(em, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(InsufficientQuantity.class)
    public ResponseEntity<ErrorMessage>InsufficientQuantity(InsufficientQuantity ex){
        ErrorMessage em= new ErrorMessage(ex.getMessage(),"Insufficient Quantity",LocalDateTime.now());
        System.out.println(em);
        return new ResponseEntity<>(em, HttpStatus.BAD_REQUEST);
       
    }

    @ExceptionHandler(NoDataSaved.class)
    public ResponseEntity<ErrorMessage> DataNotsavedorChanged(NoDataSaved ex){
        ErrorMessage error = new ErrorMessage(ex.getMessage(),"One opreation to save data failed so the other operation was also reverted ",LocalDateTime.now());
        return new ResponseEntity<>(error, HttpStatus.NOT_ACCEPTABLE);
    }

    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ErrorMessage> handleConstraintViolation(jakarta.validation.ConstraintViolationException ex) {
        String message = ex.getConstraintViolations().stream()
                .map(jakarta.validation.ConstraintViolation::getMessage)
                .collect(java.util.stream.Collectors.joining(", "));
        
        ErrorMessage em = new ErrorMessage(message, "Validation Failed", LocalDateTime.now());
        return new ResponseEntity<>(em, HttpStatus.BAD_REQUEST);
    }
}
