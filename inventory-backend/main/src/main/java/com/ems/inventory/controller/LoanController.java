package com.ems.inventory.controller;

import java.util.ArrayList;
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

    private final LoanService loanservice;

    public LoanController (LoanService service){
        this.loanservice=service;
    }

    @GetMapping
    public ResponseEntity<List<Object>> getAllLoans() {
        return new ResponseEntity<>(new ArrayList<>(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Loan> createloan(@RequestBody Loan loandata){
        Loan savedLoan= loanservice.saveLoan(loandata);
        System.out.println("DATA RECEIVED FROM REACT: " + loandata);
        return new ResponseEntity<>(savedLoan,HttpStatus.OK);
    }
}