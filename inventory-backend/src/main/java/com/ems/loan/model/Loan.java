package com.ems.loan.model; // Make sure this matches your actual package name!

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Setter
@Table(name = "loan") // Ensure this matches your database table name
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

    
    @Column(name = "close_date")
    private String closeDate;

    @Column(name = "settlement_amount")
    private Double settlementAmount;

    @PrePersist
    public void prePersist() {
        if (this.issueDate == null) {
            this.issueDate = LocalDate.now();
        }
    }
}