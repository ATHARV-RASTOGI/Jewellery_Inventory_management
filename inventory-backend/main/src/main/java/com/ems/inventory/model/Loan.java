package com.ems.inventory.model;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;

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

    // Renamed from collateralKept -> jewelryDescription to match frontend
    private String jewelryDescription;

    private Double loanAmount;

    private String description;

    // New fields to match frontend payload
    private Double weight;

    private String metal;

    private String status;

    @Column(name = "loan_taken")
@JsonDeserialize(using = LocalDateDeserializer.class)
@JsonSerialize(using = LocalDateSerializer.class)
@JsonFormat(pattern = "yyyy-MM-dd")
private LocalDate issueDate;

    @PrePersist
    public void prePersist() {
        if (this.issueDate == null) {
            this.issueDate = LocalDate.now();
        }
    }
}