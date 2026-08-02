package com.ems.loan.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.repository.InterestPaymentRepository;
import com.ems.loan.repository.LoanRepository;

@Service
public class LoanService {

    private final LoanRepository repository;
    private final InterestPaymentRepository interestPaymentRepository;

    private static final double MONTHLY_INTEREST_RATE = 0.02;

    public LoanService(LoanRepository repo, InterestPaymentRepository intrest) {
        this.repository = repo;
        this.interestPaymentRepository = intrest;
    }

    public List<Loan> getAll() {
        return repository.findAll();
    }

    public Loan saveLoan(Loan loanData) {
        if (loanData.getStatus() == null || loanData.getStatus().isBlank()) {
            loanData.setStatus("active");
        }
        return repository.save(loanData);
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
        return interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId);
    }

    // ── Record an interest payment & reduce outstanding balance ───────────────
    public InterestPayment recordInterestPayment(Long loanId, Double amountPaid) {
        Loan loan = repository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan " + loanId + " not found"));

        if (!"active".equalsIgnoreCase(loan.getStatus())) {
            throw new RuntimeException("Cannot pay interest on a closed loan");
        }

        LocalDate today = LocalDate.now();
        List<InterestPayment> payments = interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId);
        LocalDate startDate = loan.getIssueDate();
        if (payments != null && !payments.isEmpty()) {
            startDate = payments.get(payments.size() - 1).getPaymentDate();
        }

        long days = java.time.temporal.ChronoUnit.DAYS.between(startDate, today);
        if (days < 0)
            days = 0;
        double months = Math.max(1, days / 30.44);

        // Calculate accrued interest since last payment (or issue date)
        double totalWithInterest = loan.getLoanAmount() * Math.pow(1 + MONTHLY_INTEREST_RATE, months);

        // Apply payment against total amount
        double newBalance = totalWithInterest - amountPaid;
        if (newBalance < 0)
            newBalance = 0;

        loan.setLoanAmount(newBalance);
        repository.save(loan);

        // Record the payment with the new balance
        InterestPayment payment = new InterestPayment();
        payment.setCustomer_name(loan.getName());
        payment.setAddress(loan.getAddress());
        payment.setLoan(loan);
        payment.setAmountPaid(amountPaid);
        payment.setPaymentDate(today);
        payment.setBalanceAfter(newBalance);

        return interestPaymentRepository.save(payment);
    }

    // In LoanService.java — add this method:
    public long countActiveLoans() {
        return repository.countActiveLoans();
    }

    public Map<String, Object> calculateSettlement(Long loanId, String closeDateStr) {
        Loan loan = repository.findById(loanId).orElseThrow(() -> new RuntimeException("loan not found" + loanId));

        LocalDate closeDate = LocalDate.parse(closeDateStr);

        List<InterestPayment> payments = interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId);
        LocalDate startDate = loan.getIssueDate();
        if (payments != null && !payments.isEmpty()) {
            startDate = payments.get(payments.size() - 1).getPaymentDate();
        }

        long days = java.time.temporal.ChronoUnit.DAYS.between(startDate, closeDate);
        if (days < 0)
            days = 0;
        double months = Math.max(1, days / 30.44);
        int monthsCeil = (int) Math.ceil(months);

        double totalAmount = loan.getLoanAmount() * Math.pow(1 + MONTHLY_INTEREST_RATE, months);
        double interestAmount = totalAmount - loan.getLoanAmount();

        Map<String, Object> result = new HashMap<>();
        result.put("principal", loan.getLoanAmount());
        result.put("months", monthsCeil);
        result.put("interestAmount", Math.round(interestAmount));
        result.put("totalAmount", Math.round(totalAmount));
        result.put("monthlyInterest", Math.round(loan.getLoanAmount() * MONTHLY_INTEREST_RATE));
        return result;

    }

}
