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
    public Loan closeLoan(Long id, String closeDate, Double settlementAmount) {
        Loan existingLoan = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loan with ID " + id + " not found!"));

        // 1. Flip the status so it disappears from the "Open" list
        existingLoan.setStatus("closed");
        
        // 2. Save the settlement data
        existingLoan.setCloseDate(closeDate);
        existingLoan.setSettlementAmount(settlementAmount);

        // 3. Save to database
        return repository.save(existingLoan);
    }
}
