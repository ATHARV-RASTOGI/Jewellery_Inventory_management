package com.ems.Exportdata.controller;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ems.Exportdata.dto.ExportCriteria;
import com.ems.Exportdata.service.ExportService;

@WebMvcTest(ExportController.class)
public class ExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExportService exportService;

    private static final String EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    @Test
    void testExport_DefaultCriteria_ReturnsExcelFileWithHeaders() throws Exception {
        byte[] mockExcelData = new byte[]{1, 2, 3, 4, 5};
        when(exportService.exportToExcel(any(ExportCriteria.class))).thenReturn(mockExcelData);

        String expectedDate = LocalDate.now().toString();

        mockMvc.perform(get("/api/export"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, EXCEL_MEDIA_TYPE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        Matchers.containsString("attachment; filename=\"KK_Jewelers_Report_" + expectedDate + ".xlsx\"")))
                .andExpect(content().bytes(mockExcelData));
    }

    @Test
    void testExport_WithCustomQueryParameters_BindsCriteriaCorrectly() throws Exception {
        byte[] mockExcelData = new byte[]{10, 20, 30};
        when(exportService.exportToExcel(any(ExportCriteria.class))).thenReturn(mockExcelData);

        mockMvc.perform(get("/api/export")
                .param("loans", "false")
                .param("inventory", "true")
                .param("sales", "false")
                .param("summary", "false")
                .param("gold", "true")
                .param("silver", "false"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(mockExcelData));

        ArgumentCaptor<ExportCriteria> captor = ArgumentCaptor.forClass(ExportCriteria.class);
        verify(exportService).exportToExcel(captor.capture());

        ExportCriteria capturedCriteria = captor.getValue();
        assertFalse(capturedCriteria.loans());
        assertTrue(capturedCriteria.inventory());
        assertFalse(capturedCriteria.sales());
        assertFalse(capturedCriteria.summary());
        assertTrue(capturedCriteria.gold());
        assertFalse(capturedCriteria.silver());
    }
}
