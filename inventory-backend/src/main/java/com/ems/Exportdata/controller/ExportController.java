package com.ems.Exportdata.controller;

import java.io.IOException;
import java.time.LocalDate;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.Exportdata.dto.ExportCriteria;
import com.ems.Exportdata.service.ExportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService service;

    private static final String EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    @GetMapping(produces = EXCEL_MEDIA_TYPE)
    public ResponseEntity<byte[]> export(@ModelAttribute ExportCriteria criteria) throws IOException {

        byte[] excelBytes = service.exportToExcel(criteria);

        String filename = "KK_Jewelers_Report_" + LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(EXCEL_MEDIA_TYPE))
                .body(excelBytes);
    }
}
