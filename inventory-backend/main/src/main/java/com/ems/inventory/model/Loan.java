package com.ems.inventory.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "loan")
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

    @Column(name = "loan_taken")
    private LocalDate loanTaken;

    @PrePersist
    public void prePersist() {
        if (this.loanTaken == null) {
            this.loanTaken = LocalDate.now();
        }
    }
}