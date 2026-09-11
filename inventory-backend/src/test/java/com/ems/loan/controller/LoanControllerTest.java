package com.ems.loan.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import static org.mockito.ArgumentMatchers.any;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ems.loan.dto.LoanRequestDTO;
import com.ems.loan.dto.LoanResponseDTO;
import com.ems.loan.service.LoanService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(LoanController.class)
public class LoanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LoanService loanService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCloseLoan() throws Exception {

        Long id = 1L;

        LocalDate closeDate = LocalDate.now();
        BigDecimal settlementAmount = new BigDecimal("10000");


        LoanResponseDTO responseDTO = new LoanResponseDTO();
        responseDTO.setId(1L);
        responseDTO.setName("Atharv");
        responseDTO.setAddress("maha st");

        when(loanService.closeLoan(id, closeDate, settlementAmount)).thenReturn(responseDTO);

        mockMvc.perform(patch("/api/loans/{id}/close", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("closeDate", closeDate.toString(), "settlementAmount", settlementAmount.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Atharv"))
                .andExpect(jsonPath("$.address").value("maha st"));


    }

    @Test
    void testCreateLoan() throws Exception {

        LoanResponseDTO responseDTO = new LoanResponseDTO();
        responseDTO.setId(1L);
        responseDTO.setName("Atharv");
        responseDTO.setAddress("maha st");

        LoanRequestDTO requestDTO = new LoanRequestDTO();
        requestDTO.setName("Atharv");
        requestDTO.setAddress("maha st");

        when(loanService.saveLoan(any(LoanRequestDTO.class))).thenReturn(responseDTO);

        mockMvc.perform(post("/api/loans")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Atharv"))
                .andExpect(jsonPath("$.address").value("maha st"));
    }

    @Test
    void testFindByNameAndFatherName() throws Exception {
        String name = "Rohan Sharma";
        String fatherName = "Vijay Sharma";

        LoanResponseDTO responseDTO = new LoanResponseDTO();
        responseDTO.setId(1L);
        responseDTO.setName(name);
        responseDTO.setFatherName(fatherName);
        responseDTO.setAddress("Civil Lines, Kanpur");

        when(loanService.findByNameAndFatherName(name, fatherName)).thenReturn(Optional.of(responseDTO));

        mockMvc.perform(get("/api/loans/{name}/{fathername}", name, fatherName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Rohan Sharma"))
                .andExpect(jsonPath("$.fatherName").value("Vijay Sharma"))
                .andExpect(jsonPath("$.address").value("Civil Lines, Kanpur"));
    }

    @Test
    void testFindByNameAndFatherNameAndAddress() throws Exception {
        String name = "Rohan Sharma";
        String fatherName = "Vijay Sharma";
        String address = "Civil Lines, Kanpur";

        LoanResponseDTO responseDTO = new LoanResponseDTO();
        responseDTO.setId(1L);
        responseDTO.setName(name);
        responseDTO.setFatherName(fatherName);
        responseDTO.setAddress(address);

        when(loanService.findByNameAndFatherNameAndAddress(name, fatherName, address)).thenReturn(Optional.of(responseDTO));

        mockMvc.perform(get("/api/loans/{name}/{fathername}/{address}", name, fatherName, address))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Rohan Sharma"))
                .andExpect(jsonPath("$.fatherName").value("Vijay Sharma"))
                .andExpect(jsonPath("$.address").value("Civil Lines, Kanpur"));
    }

    @Test
    void testFindCustomer() throws Exception {
        String name = "Rohan Sharma";
        String fatherName = "Vijay Sharma";
        String address = "Civil Lines, Kanpur";

        LoanResponseDTO responseDTO = new LoanResponseDTO();
        responseDTO.setId(1L);
        responseDTO.setName(name);
        responseDTO.setFatherName(fatherName);
        responseDTO.setAddress(address);

        when(loanService.findByNameAndFatherNameAndAddress(name, fatherName, address)).thenReturn(Optional.of(responseDTO));

        mockMvc.perform(get("/api/loans/customer")
                .param("name", name)
                .param("fathername", fatherName)
                .param("address", address))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Rohan Sharma"))
                .andExpect(jsonPath("$.address").value("Civil Lines, Kanpur"));
    }

    @Test
    void testGetAllLoans() throws Exception {
        LoanResponseDTO responseDTO = new LoanResponseDTO();
        responseDTO.setId(1L);
        responseDTO.setName("Rohan Sharma");
        responseDTO.setAddress("Civil Lines, Kanpur");

        when(loanService.getAll()).thenReturn(List.of(responseDTO));

        mockMvc.perform(get("/api/loans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Rohan Sharma"))
                .andExpect(jsonPath("$[0].address").value("Civil Lines, Kanpur"));
    }
}
