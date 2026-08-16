package com.ems.loan.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "loan") // Ensure this matches your database table name
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String fatherName;

    private String address;

    @Size(min = 10, max = 10, message = "Mobile number must be 10 digits")
    private String mobileNo;

    // Renamed from collateralKept -> jewelryDescription to match frontend
    private String jewelryDescription;

    @Column(precision = 15, scale = 2)
    private BigDecimal loanAmount;

    private String description;

    // New fields to match frontend payload
    private BigDecimal weight;

    private String metal;

    @Enumerated(EnumType.STRING)
    private LoanStatus status;

    @Column(name = "loan_taken")
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate issueDate;

    @Column(name = "close_date")
    private LocalDate closeDate;

    @Column(name = "settlement_amount", precision = 15, scale = 2)
    private BigDecimal settlementAmount;

    @PrePersist
    public void prePersist() {
        if (this.issueDate == null) {
            this.issueDate = LocalDate.now();
        }
    }

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<InterestPayment> interestPayments = new ArrayList<>();

    @Version
    private Long version;

}