package com.ems.loan.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.service.LoanService;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService;
   
    public LoanController(LoanService service ) {
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
        return new ResponseEntity<>(savedLoan, HttpStatus.CREATED); // Improved: Changed OK to CREATED (201)
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
    InterestPayment payment = loanService.recordInterestPayment(id, amount.doubleValue());
    return ResponseEntity.status(HttpStatus.CREATED).body(payment);
}
}