package com.ems.loan.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exception.Custom_Exception.LoanNotFoundException;
import com.ems.loan.model.InterestPayment;
import com.ems.loan.model.Loan;
import com.ems.loan.model.PendingDisbursement;
import com.ems.loan.repository.InterestPaymentRepository;
import com.ems.loan.repository.LoanRepository;
import com.ems.loan.repository.PendingDisbursementRepository;

import com.ems.loan.model.LoanStatus;

@Service
public class LoanService {

    private final LoanRepository repository;
    private final InterestPaymentRepository interestPaymentRepository;
    private final PendingDisbursementRepository pendingDisbursementRepository;

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal THIRTY = new BigDecimal("30");
    private static final BigDecimal TWELVE = new BigDecimal("12");
    private static final int CALC_SCALE = 10;                 // internal precision
    private static final int MONEY_SCALE = 0;                 // whole rupees, matches current UI
    private static final RoundingMode RM = RoundingMode.HALF_UP;

    private static final BigDecimal MONTHLY_INTEREST_RATE = new BigDecimal("2.0"); // 2%, used by calculateSettlement

    public LoanService(LoanRepository repo, InterestPaymentRepository intrest,
            PendingDisbursementRepository pendingRepo) {
        this.repository = repo;
        this.interestPaymentRepository = intrest;
        this.pendingDisbursementRepository = pendingRepo;
    }

    public List<Loan> getAll() {
        return repository.findAll();
    }

    public Loan saveLoan(Loan loanData) {
        if (loanData.getStatus() == null) {
            loanData.setStatus(LoanStatus.ACTIVE);
        }
        return repository.save(loanData);
    }

    public BigDecimal getTotalLoanAmount() {
        return repository.getTotalLoanAmount();
    }

    public long countActiveLoans() {
        return repository.countActiveLoans();
    }

    public List<InterestPayment> getInterestPayments(Long loanId) {
        return interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId);
    }

    @Transactional
    public Loan closeLoan(Long id, LocalDate closeDate, BigDecimal settlementAmount) {
        Loan existingLoan = repository.findById(id)
                .orElseThrow(() -> new LoanNotFoundException("Loan with ID " + id + " not found!"));

        existingLoan.setStatus(LoanStatus.CLOSED);
        existingLoan.setCloseDate(closeDate);
        existingLoan.setSettlementAmount(settlementAmount);

        return repository.save(existingLoan);
    }

    @Transactional
    // ── Add money to an existing loan mid-cycle, on its own interest clock ────
    public PendingDisbursement addDisbursement(Long loanId, BigDecimal amount, LocalDate date) {
        Loan loan = repository.findByIdForUpdate(loanId)
                .orElseThrow(() -> new LoanNotFoundException("Loan " + loanId + " not found"));

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot add disbursement to a closed loan");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Disbursement amount must be greater than zero");
        }

        List<InterestPayment> payments = interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId);
        LocalDate minAllowedDate = loan.getIssueDate();
        if (payments != null && !payments.isEmpty()) {
            minAllowedDate = payments.get(payments.size() - 1).getPaymentDate();
        }

        if (date.isBefore(minAllowedDate)) {
            String reason = (payments != null && !payments.isEmpty())
                    ? "the last interest payment date (" + minAllowedDate + ")"
                    : "the loan issue date (" + minAllowedDate + ")";
            throw new IllegalArgumentException("Disbursement date (" + date + ") cannot be earlier than " + reason);
        }

        PendingDisbursement d = new PendingDisbursement();
        d.setLoan(loan);
        d.setAmount(amount);
        d.setDisbursedDate(date);
        return pendingDisbursementRepository.save(d);
    }

    @Transactional
    // ── Record an interest payment, folding in any pending disbursements ──────
    public InterestPayment recordInterestPayment(Long loanId, BigDecimal amountPaid,
            LocalDate fromDate, LocalDate toDate, BigDecimal interestRate) {

        Loan loan = repository.findByIdForUpdate(loanId)
                .orElseThrow(() -> new RuntimeException("Loan " + loanId + " not found"));

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new RuntimeException("Cannot pay interest on a closed loan");
        }

        Map<String, Object> mainCalc = calculateInterestData(loan.getLoanAmount(), interestRate, fromDate, toDate);
        BigDecimal totalPrincipal = loan.getLoanAmount();
        BigDecimal totalInterest = (BigDecimal) mainCalc.get("interestAmount");

        List<PendingDisbursement> pending = pendingDisbursementRepository.findByLoanId(loanId);
        for (PendingDisbursement d : pending) {
            Map<String, Object> calc = calculateInterestData(d.getAmount(), interestRate, d.getDisbursedDate(), toDate);
            totalInterest = totalInterest.add((BigDecimal) calc.get("interestAmount"));
            totalPrincipal = totalPrincipal.add(d.getAmount());
        }

        BigDecimal totalWithInterest = totalPrincipal.add(totalInterest);
        BigDecimal newBalance = totalWithInterest.subtract(amountPaid);
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            newBalance = BigDecimal.ZERO.setScale(MONEY_SCALE, RM);
        }

        loan.setLoanAmount(newBalance);
        repository.save(loan);
        pendingDisbursementRepository.deleteAll(pending);

        InterestPayment payment = new InterestPayment();
        payment.setCustomer_name(loan.getName());
        payment.setAddress(loan.getAddress());
        payment.setLoan(loan);
        payment.setAmountPaid(amountPaid);
        payment.setPaymentDate(toDate);
        payment.setBalanceAfter(newBalance);

        return interestPaymentRepository.save(payment);
    }

    public List<PendingDisbursement> getPendingDisbursements(Long loanId) {
        return pendingDisbursementRepository.findByLoanId(loanId);
    }

    @Transactional
    public void deletePendingDisbursement(Long loanId, Long disbursementId) {
        PendingDisbursement pd = pendingDisbursementRepository.findById(disbursementId)
                .orElseThrow(() -> new LoanNotFoundException("Disbursement " + disbursementId + " not found"));
        if (!pd.getLoan().getId().equals(loanId)) {
            throw new IllegalArgumentException("Disbursement does not belong to loan " + loanId);
        }
        pendingDisbursementRepository.delete(pd);
    }

    // ── Preview shown in the modal BEFORE a payment is recorded ───────────────
    public Map<String, Object> previewInterestForLoan(Long loanId, LocalDate fromDate, LocalDate toDate, BigDecimal interestRate) {
        Loan loan = repository.findById(loanId)
                .orElseThrow(() -> new LoanNotFoundException("Loan " + loanId + " not found"));

        if (fromDate == null) {
            List<InterestPayment> payments = interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId);
            fromDate = loan.getIssueDate();
            if (payments != null && !payments.isEmpty()) {
                fromDate = payments.get(payments.size() - 1).getPaymentDate();
            }
        }

        Map<String, Object> mainCalc = calculateInterestData(loan.getLoanAmount(), interestRate, fromDate, toDate);
        BigDecimal totalPrincipal = loan.getLoanAmount();
        BigDecimal totalInterest = (BigDecimal) mainCalc.get("interestAmount");

        for (PendingDisbursement d : pendingDisbursementRepository.findByLoanId(loanId)) {
            Map<String, Object> calc = calculateInterestData(d.getAmount(), interestRate, d.getDisbursedDate(), toDate);
            totalInterest = totalInterest.add((BigDecimal) calc.get("interestAmount"));
            totalPrincipal = totalPrincipal.add(d.getAmount());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("principal", totalPrincipal.setScale(MONEY_SCALE, RM));
        result.put("interestAmount", totalInterest.setScale(MONEY_SCALE, RM));
        result.put("totalAmount", totalPrincipal.add(totalInterest).setScale(MONEY_SCALE, RM));
        return result;
    }

    public Map<String, Object> calculateSettlement(Long loanId, LocalDate closeDate) {
        Loan loan = repository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("loan not found " + loanId));

        List<InterestPayment> payments = interestPaymentRepository.findByLoan_IdOrderByPaymentDateAsc(loanId);
        LocalDate startDate = loan.getIssueDate();
        if (payments != null && !payments.isEmpty()) {
            startDate = payments.get(payments.size() - 1).getPaymentDate();
        }

        Map<String, Object> result = calculateInterestData(loan.getLoanAmount(), MONTHLY_INTEREST_RATE, startDate, closeDate);
        result.put("months", result.get("totalMonths"));
        return result;
    }

    public Map<String, Object> calculateInterestPreviewOnly(BigDecimal principal, LocalDate fromDate, LocalDate toDate, BigDecimal interestRate) {
        return calculateInterestData(principal, interestRate, fromDate, toDate);
    }

    public Map<String, Object> calculateInterestData(BigDecimal principal, BigDecimal monthlyInterestRatePercent,
            LocalDate fromDate, LocalDate toDate) {

        if (principal.compareTo(BigDecimal.ZERO) < 0 || monthlyInterestRatePercent.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Principal and interest rate must be positive");
        }
        if (toDate.isBefore(fromDate)) {
            throw new IllegalArgumentException("To date cannot be before from date");
        }

        BigDecimal monthlyInterestRate = monthlyInterestRatePercent.divide(HUNDRED, CALC_SCALE, RM);

        int d1 = fromDate.getDayOfMonth(), m1 = fromDate.getMonthValue(), y1 = fromDate.getYear();
        int d2 = toDate.getDayOfMonth(), m2 = toDate.getMonthValue(), y2 = toDate.getYear();

        if (d1 == 31) d1 = 30;
        if (d2 == 31) d2 = 30;
        if (d2 < d1) { d2 += 30; m2 -= 1; }
        if (m2 < m1) { m2 += 12; y2 -= 1; }

        long fullYears = y2 - y1;
        long remainderWholeMonths = m2 - m1;
        long remainderDays = d2 - d1;
        long totalMonths = fullYears * 12 + remainderWholeMonths;

        BigDecimal remainderMonths = BigDecimal.valueOf(remainderWholeMonths)
                .add(BigDecimal.valueOf(remainderDays).divide(THIRTY, CALC_SCALE, RM));

        BigDecimal amount = principal;
        BigDecimal yearMultiplier = BigDecimal.ONE.add(monthlyInterestRate.multiply(TWELVE));
        for (int i = 0; i < fullYears; i++) {
            amount = amount.multiply(yearMultiplier);
        }
        BigDecimal remainderMultiplier = BigDecimal.ONE.add(monthlyInterestRate.multiply(remainderMonths));
        amount = amount.multiply(remainderMultiplier).setScale(MONEY_SCALE, RM);

        BigDecimal interestAmount = amount.subtract(principal);
        BigDecimal monthlyInterest = principal.multiply(monthlyInterestRate).setScale(MONEY_SCALE, RM);

        Map<String, Object> result = new HashMap<>();
        result.put("principal", principal);
        result.put("totalMonths", totalMonths);
        result.put("remainderDays", remainderDays);
        result.put("interestAmount", interestAmount);
        result.put("totalAmount", amount);
        result.put("monthlyInterest", monthlyInterest);
        return result;
    }

    public Optional<Loan> findByNameAndFatherNameAndAddress(String name, String fathername, String address) {
        return repository.findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc(name, fathername, address);
    }

    public Optional<Loan> findByNameAndFatherName(String name, String fathername) {
        return repository.findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc(name, fathername);
    }

   
}