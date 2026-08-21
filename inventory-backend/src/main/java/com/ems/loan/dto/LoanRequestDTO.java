package com.ems.loan.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class LoanRequestDTO {

    private String name;

    private String fatherName;

    @JsonAlias({"mobileNo", "phoneNumber"})
    private String mobileNo;

    private String address;
     
    private String metal;

    private BigDecimal weight;

    private String description;

    private BigDecimal loanAmount;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate issueDate;
}
