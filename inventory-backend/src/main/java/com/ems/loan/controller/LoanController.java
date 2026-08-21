package com.ems.loan.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.model.PendingDisbursement;
import com.ems.loan.service.LoanService;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;

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
        log.info("Loan created ");
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

    @GetMapping("/{id}/interest-payments")
    public ResponseEntity<List<InterestPayment>> getInterestPayments(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getInterestPayments(id));
    }

    @PostMapping("/{id}/pay-interest")
    public ResponseEntity<InterestPayment> payInterest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        BigDecimal amountPaid = toBigDecimal(payload.get("amountPaid"));
        String fromDateStr = (String) payload.get("fromDate");
        String toDateStr = (String) payload.get("toDate");
        BigDecimal interestRate = toBigDecimal(payload.get("interestRate"));

        if (amountPaid == null || fromDateStr == null || toDateStr == null) {
            throw new IllegalArgumentException("amountPaid, fromDate, and toDate are required");
        }

        LocalDate fromDate = LocalDate.parse(fromDateStr);
        LocalDate toDate = LocalDate.parse(toDateStr);

        BigDecimal rate = interestRate != null ? interestRate : new BigDecimal("2.0");

        InterestPayment payment = loanService.recordInterestPayment(
                id,
                amountPaid,
                fromDate,
                toDate,
                rate);
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    @GetMapping("/calculate-interest")
    public ResponseEntity<Map<String, Object>> calculateInterest(
            @RequestParam BigDecimal principal,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam BigDecimal rate) {
        return ResponseEntity.ok(loanService.calculateInterestPreviewOnly(principal, fromDate, toDate, rate));
    }

    @GetMapping("/{id}/calculate-settlement")
    public ResponseEntity<Map<String, Object>> calculateSettlement(
            @PathVariable("id") Long id,
            @RequestParam LocalDate closeDate) {
        return ResponseEntity.ok(loanService.calculateSettlement(id, closeDate));
    }

    @PostMapping("/{id}/disbursements")
    public ResponseEntity<PendingDisbursement> addDisbursement(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        BigDecimal amount = toBigDecimal(payload.get("amount"));
        String disbursedDateStr = (String) payload.get("disbursedDate");

        if (amount == null || disbursedDateStr == null) {
            throw new IllegalArgumentException("amount and disbursedDate are required");
        }

        LocalDate disbursedDate = LocalDate.parse(disbursedDateStr);
        PendingDisbursement disbursement = loanService.addDisbursement(id, amount, disbursedDate);
        return ResponseEntity.status(HttpStatus.CREATED).body(disbursement);
    }

    @GetMapping("/{id}/preview-interest")
    public ResponseEntity<Map<String, Object>> previewInterestForLoan(
            @PathVariable Long id,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate,
            @RequestParam BigDecimal interestRate) {
        return ResponseEntity.ok(loanService.previewInterestForLoan(id, fromDate, toDate, interestRate));
    }

    @GetMapping("/{id}/pending-disbursements")
    public ResponseEntity<List<PendingDisbursement>> getPendingDisbursements(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getPendingDisbursements(id));
    }

    @DeleteMapping("/{id}/disbursements/{disbursementId}")
    public ResponseEntity<Void> deletePendingDisbursement(
            @PathVariable Long id,
            @PathVariable Long disbursementId) {
        loanService.deletePendingDisbursement(id, disbursementId);
        return ResponseEntity.noContent().build();
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