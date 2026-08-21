package com.ems.loan.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.ems.loan.model.LoanStatus;

import lombok.Data;

@Data
public class LoanResponseDTO {

    private Long id;

    private String name;

    private String fatherName;

    private String mobileNo;

    private String address;

    private String metal; 

    private BigDecimal weight;

    private String description;

    private BigDecimal loanAmount;

    private LoanStatus status;

    private LocalDate issueDate;

    private LocalDate closeDate;

    private BigDecimal settlementAmount;
}
