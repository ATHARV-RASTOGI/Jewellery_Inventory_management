package com.ems.inventory.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.ems.inventory.model.InterestPayment;
import com.ems.inventory.model.Loan;
import com.ems.inventory.repository.InterestPaymentRepository;
import com.ems.inventory.repository.LoanRepository;


@Service
public class LoanService {

    private final LoanRepository repository;
    private final InterestPaymentRepository interestPaymentRepository;

    public LoanService(LoanRepository repo, InterestPaymentRepository intrest){
        this.repository=repo;
        this.interestPaymentRepository=intrest;
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

        
        existingLoan.setStatus("closed");
        
        // 2. Save the settlement data
        existingLoan.setCloseDate(closeDate);
        existingLoan.setSettlementAmount(settlementAmount);

        // 3. Save to database
        return repository.save(existingLoan);
    }

       public List<InterestPayment> getInterestPayments(Long loanId) {
        return interestPaymentRepository.findByLoanIdOrderByPaymentDateAsc(loanId);
    }

    // ── Record an interest payment & reduce outstanding balance ───────────────
    public InterestPayment recordInterestPayment(Long loanId, Double amountPaid) {
        Loan loan = repository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan " + loanId + " not found"));

        if (!"active".equalsIgnoreCase(loan.getStatus())) {
            throw new RuntimeException("Cannot pay interest on a closed loan");
        }

        // Reduce the loan's outstanding amount
        double newBalance = loan.getLoanAmount() - amountPaid;
        if (newBalance < 0) newBalance = 0;
        loan.setLoanAmount(newBalance);
        repository.save(loan);

        // Record the payment with the new balance
        InterestPayment payment = new InterestPayment();
        payment.setLoanId(loanId);
        payment.setAmountPaid(amountPaid);
        payment.setPaymentDate(LocalDate.now());
        payment.setBalanceAfter(newBalance);

        return interestPaymentRepository.save(payment);
    }


}
