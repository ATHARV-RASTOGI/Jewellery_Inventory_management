package com.ems.inventory.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ems.inventory.model.Loan;
import com.ems.inventory.repository.LoanRepository;


@Service
public class LoanService {

    private final LoanRepository repository;

    public LoanService(LoanRepository repo){
        this.repository=repo;
    }

    public List<Loan> getAll() {
        return repository.findAll();
    }

    public Loan saveLoan(Loan LoanData){
        return repository.save(LoanData);
    }

   public Double getTotalLoanAmount() {
    return repository.getTotalLoanAmount();
}
}
