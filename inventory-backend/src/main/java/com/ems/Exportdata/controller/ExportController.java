package com.ems.Exportdata.controller;

import java.io.IOException;
import java.time.LocalDate;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ems.Exportdata.service.ExportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService service;

    @GetMapping(produces= "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]>export(

        @RequestParam(defaultValue="true") boolean loans,
        @RequestParam(defaultValue="true") boolean inventory,
        @RequestParam(defaultValue="true") boolean sales,
        @RequestParam(defaultValue="true") boolean summary) throws IOException{

        byte[] excelBytes=service.exportToExcel(loans,inventory,sales,summary);

        String filename = "KK.J"+ LocalDate.now()+".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelBytes);
    
    }
        
    
}
