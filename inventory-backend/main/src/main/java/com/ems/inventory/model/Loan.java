package com.ems.inventory.model;

import java.time.LocalDate;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String address;

    private String mobileNo;

    private String signature;

    // Renamed from collateralKept -> jewelryDescription to match frontend
    private String jewelryDescription;

    private Double amountGiven;

    // New fields to match frontend payload
    private Double weightGrams;

    private String purity;

    private Integer ltvPercentage;

    private Integer tenureMonths;

    @Column(name = "loan_taken")
    private LocalDate loanTaken;

    @PrePersist
    public void prePersist() {
        if (this.loanTaken == null) {
            this.loanTaken = LocalDate.now();
        }
    }
}