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

import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    // ── Record an interest payment & reduce outstanding balance ───────────────
    public InterestPayment recordInterestPayment(Long loanId, Double amountPaid, String fromDateStr, String toDateStr, Double interestRate) {
        Loan loan = repository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan " + loanId + " not found"));

        if (!"active".equalsIgnoreCase(loan.getStatus())) {
            throw new RuntimeException("Cannot pay interest on a closed loan");
        }

        LocalDate fromDate = LocalDate.parse(fromDateStr);
        LocalDate toDate = LocalDate.parse(toDateStr);

        Map<String, Object> calc = calculateInterestData(loan.getLoanAmount(), interestRate, fromDate, toDate);
        double totalWithInterest = ((Number) calc.get("totalAmount")).doubleValue();

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
        payment.setPaymentDate(toDate); // future calculations will anchor to this date
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

        Map<String, Object> result = calculateInterestData(loan.getLoanAmount(), MONTHLY_INTEREST_RATE, startDate, closeDate);
        result.put("months", result.get("totalMonths")); // for backwards compatibility with frontend
        return result;
    }

    public Map<String, Object> calculateInterestPreviewOnly(Double principal, String fromDateStr, String toDateStr, Double interestRate) {
        LocalDate fromDate = LocalDate.parse(fromDateStr);
        LocalDate toDate = LocalDate.parse(toDateStr);        
        return calculateInterestData(principal, interestRate, fromDate, toDate);
    }

    public Map<String, Object> calculateInterestData(double principal, double monthlyInterestRatePercent, LocalDate fromDate, LocalDate toDate) {
    if (principal < 0 || monthlyInterestRatePercent < 0) {
        throw new IllegalArgumentException("Principal and interest rate must be positive");
    }
    if (toDate.isBefore(fromDate)) {
        throw new IllegalArgumentException("To date cannot be before from date");
    }

    // caller passes the rate as typed by the user, e.g. 2 for "2%" —
    // conversion to decimal happens here, in exactly one place
    double monthlyInterestRate = monthlyInterestRatePercent / 100.0;

    int d1 = fromDate.getDayOfMonth();
    int m1 = fromDate.getMonthValue();
    int y1 = fromDate.getYear();

    int d2 = toDate.getDayOfMonth();
    int m2 = toDate.getMonthValue();
    int y2 = toDate.getYear();

    if (d1 == 31) d1 = 30;
    if (d2 == 31) d2 = 30;

    if (d2 < d1) {
        d2 += 30;
        m2 -= 1;
    }
    if (m2 < m1) {
        m2 += 12;
        y2 -= 1;
    }

    long fullYears = y2 - y1;
    long remainderWholeMonths = m2 - m1;
    long remainderDays = d2 - d1;
    long totalMonths = fullYears * 12 + remainderWholeMonths;

    double remainderMonths = remainderWholeMonths + (remainderDays / 30.0);

    double amount = principal;
    for (int i = 0; i < fullYears; i++) {
        amount = amount * (1 + monthlyInterestRate * 12);
    }
    amount = amount * (1 + monthlyInterestRate * remainderMonths);

    double interestAmount = amount - principal;

    Map<String, Object> result = new HashMap<>();
    result.put("principal", principal);
    result.put("totalMonths", totalMonths);
    result.put("remainderDays", remainderDays);
    result.put("interestAmount", Math.round(interestAmount));
    result.put("totalAmount", Math.round(amount));
    result.put("monthlyInterest", Math.round(principal * monthlyInterestRate));
    return result;
}

}
