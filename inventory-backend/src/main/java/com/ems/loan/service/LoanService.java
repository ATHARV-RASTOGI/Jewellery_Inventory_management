package com.ems.loan.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.Exception.Custom_Exception.LoanNotFoundException;
import com.ems.loan.dto.LoanRequestDTO;
import com.ems.loan.dto.LoanResponseDTO;
import com.ems.loan.model.Loan;
import com.ems.loan.model.LoanStatus;
import com.ems.loan.repository.LoanRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoanService {

    private final LoanRepository repository;
    private final ModelMapper modelMapper;

    @Cacheable(value = "loans", key = "'all_loans'")
    public List<LoanResponseDTO> getAll() {
        return repository.findAll().stream()
                .map(a -> modelMapper.map(a, LoanResponseDTO.class))
                .toList();
    }

    @CacheEvict(value = "loans" , allEntries = true)
    @Transactional
    public LoanResponseDTO saveLoan(LoanRequestDTO loanData) {
        Loan loan = modelMapper.map(loanData, Loan.class);
        if (loan.getStatus() == null) {
            loan.setStatus(LoanStatus.ACTIVE);
        }
        Loan saved = repository.save(loan);
        return modelMapper.map(saved, LoanResponseDTO.class);
    }

    @Cacheable(value = "loans" , key = "'total_loan_amount'")
    public BigDecimal getTotalLoanAmount() {
        return repository.getTotalLoanAmount();
    }

    
    @Cacheable(value = "loans" , key = "'active_loans_count'")
    public long countActiveLoans() {
        return repository.countActiveLoans();
    }

    @CacheEvict(value = "loans" , allEntries = true)
    @Transactional
    public LoanResponseDTO closeLoan(Long id, LocalDate closeDate, BigDecimal settlementAmount) {
        Loan existingLoan = repository.findById(id)
                .orElseThrow(() -> new LoanNotFoundException("Loan with ID " + id + " not found!"));

        existingLoan.setStatus(LoanStatus.CLOSED);
        existingLoan.setCloseDate(closeDate);
        existingLoan.setSettlementAmount(settlementAmount);

        return modelMapper.map(repository.save(existingLoan), LoanResponseDTO.class);
    }

    @Cacheable(value = "loans" , key = "{#name, #fathername, #address}")
    public Optional<LoanResponseDTO> findByNameAndFatherNameAndAddress(String name, String fathername, String address) {
        return repository
                .findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseAndAddressIgnoreCaseOrderByIdDesc(name, fathername, address)
                .map(m -> modelMapper.map(m, LoanResponseDTO.class));
    }

    @Cacheable(value = "loans" , key = "{#name, #fathername}")
    public Optional<LoanResponseDTO> findByNameAndFatherName(String name, String fathername) {
        return repository
                .findFirstByNameIgnoreCaseAndFatherNameIgnoreCaseOrderByIdDesc(name, fathername)
                .map(m -> modelMapper.map(m, LoanResponseDTO.class));
    }
}