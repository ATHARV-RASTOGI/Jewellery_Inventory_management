package com.ems.loan.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ems.loan.dto.LoanRequestDTO;
import com.ems.loan.dto.LoanResponseDTO;
import com.ems.loan.service.LoanService;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;
    private final ObjectMapper objectMapper;

    public LoanController(LoanService service) {
        this.loanService = service;
        this.objectMapper = new ObjectMapper();
    }

    private BigDecimal toBigDecimal(Object raw) {
        if (raw == null) return null;
        return objectMapper.convertValue(raw, BigDecimal.class);
    }

    @GetMapping
    public ResponseEntity<List<LoanResponseDTO>> getAllLoans() {
        List<LoanResponseDTO> loans = loanService.getAll();
        return new ResponseEntity<>(loans, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<LoanResponseDTO> createLoan(@RequestBody LoanRequestDTO loanData) {
        LoanResponseDTO savedLoan = loanService.saveLoan(loanData);
        log.info("Loan created with id: {}", savedLoan.getId());
        return new ResponseEntity<>(savedLoan, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<LoanResponseDTO> closeLoan(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String closeDateStr = (String) payload.get("closeDate");
        LocalDate closeDate = closeDateStr != null ? LocalDate.parse(closeDateStr) : null;
        BigDecimal settlementAmount = toBigDecimal(payload.get("settlementAmount"));
        LoanResponseDTO closedLoan = loanService.closeLoan(id, closeDate, settlementAmount);
        return ResponseEntity.ok(closedLoan);
    }

    @GetMapping("/customer")
    public ResponseEntity<LoanResponseDTO> findCustomer(
            @RequestParam String name,
            @RequestParam String fathername,
            @RequestParam(required = false) String address) {
        LoanResponseDTO loan = (address != null && !address.trim().isEmpty())
                ? loanService.findByNameAndFatherNameAndAddress(name, fathername, address).orElse(null)
                : loanService.findByNameAndFatherName(name, fathername).orElse(null);
        return ResponseEntity.ok(loan);
    }

    @GetMapping("/{name}/{fathername}/{address}")
    public ResponseEntity<LoanResponseDTO> findByNameAndFatherNameAndAddress(
            @PathVariable String name,
            @PathVariable String fathername,
            @PathVariable String address) {
        return ResponseEntity.ok(loanService.findByNameAndFatherNameAndAddress(name, fathername, address).orElse(null));
    }

    @GetMapping("/{name}/{fathername}")
    public ResponseEntity<LoanResponseDTO> findByNameAndFatherName(
            @PathVariable String name,
            @PathVariable String fathername) {
        return ResponseEntity.ok(loanService.findByNameAndFatherName(name, fathername).orElse(null));
    }
}