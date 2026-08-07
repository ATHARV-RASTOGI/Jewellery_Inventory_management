package com.ems.loan.controller;

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

import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.service.LoanService;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;

    public LoanController(LoanService service) {
        this.loanService = service;
    }

    @GetMapping
    public ResponseEntity<List<Loan>> getAllLoans() {
        List<Loan> loans = loanService.getAll();
        return new ResponseEntity<>(loans, HttpStatus.OK); // Fixed: Returning the actual ResponseEntity object
    }

    @PostMapping
    public ResponseEntity<Loan> createLoan(@RequestBody Loan loanData) {
        Loan savedLoan = loanService.saveLoan(loanData);
        System.out.println("DATA RECEIVED FROM REACT: " + loanData);
        return new ResponseEntity<>(savedLoan, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<Loan> closeLoan(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {

        String closeDate = (String) payload.get("closeDate");

        Number amountNumber = (Number) payload.get("settlementAmount");
        Double settlementAmount = amountNumber != null ? amountNumber.doubleValue() : null;
        Loan closedLoan = loanService.closeLoan(id, closeDate, settlementAmount);

        return ResponseEntity.ok(closedLoan);
    }

    @GetMapping("/{id}/interest-payments")
    public ResponseEntity<List<InterestPayment>> getInterestPayments(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getInterestPayments(id));
    }

    @PostMapping("/{id}/pay-interest")
    public ResponseEntity<InterestPayment> payInterest(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> payload) {

        Number amount = (Number) payload.get("amountPaid");
        String fromDate = (String) payload.get("fromDate");
        String toDate = (String) payload.get("toDate");
        Number interestRate = (Number) payload.get("interestRate");

        InterestPayment payment = loanService.recordInterestPayment(
                id, 
                amount.doubleValue(),
                fromDate,
                toDate,
                interestRate != null ? interestRate.doubleValue() : 2.0
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }

    @GetMapping("/calculate-interest")
    public ResponseEntity<Map<String, Object>> calculateInterest(
            @RequestParam Double principal,
            @RequestParam String fromDate,
            @RequestParam String toDate,
            @RequestParam Double rate) {
        return ResponseEntity.ok(loanService.calculateInterestPreviewOnly(principal, fromDate, toDate, rate));
    }

    @GetMapping("/{id}/calculate-settlement")
    public ResponseEntity<Map<String, Object>> calculateSettlement(
            @PathVariable("id")Long id,
            @RequestParam String closeDate) {
        return ResponseEntity.ok(loanService.calculateSettlement(id, closeDate));
    }
}