package com.ems.sales.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoice_sequence")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceSequence {

    @Id
    @Column(name = "financial_year", length = 16)
    private String financialYear;          // "2026-27"

    @Column(name = "last_sequence_number", nullable = false)
    private Long lastSequenceNumber;
}
