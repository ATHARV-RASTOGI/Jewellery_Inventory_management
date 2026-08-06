package com.ems.Exception.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Getter;


@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class ErrorMessage {
    
    private String message;
    private String details;
    private LocalDateTime timeStamp;
  
}
