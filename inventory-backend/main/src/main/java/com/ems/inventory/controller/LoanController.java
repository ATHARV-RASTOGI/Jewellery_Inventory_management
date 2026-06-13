package com.ems.inventory.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.inventory.model.Loan;
import com.ems.inventory.service.LoanService;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    private final LoanService loanService; // Fixed naming convention to camelCase

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
        return new ResponseEntity<>(savedLoan, HttpStatus.CREATED); // Improved: Changed OK to CREATED (201)
    }
}