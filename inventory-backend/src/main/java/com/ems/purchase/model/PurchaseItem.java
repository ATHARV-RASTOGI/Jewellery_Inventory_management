package com.ems.purchase.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "purchase_items")
public class PurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_id", nullable = false)
    @JsonIgnore
    private Purchase purchase;

    @Transient
    public Long getPurchaseId() {
        return purchase != null ? purchase.getId() : null;
    }

    @Column(nullable = false)
    private String sku;

    private String productName;

    private String material;

    private String purity;

    private Integer quantity;

    @Column(precision = 10, scale = 3)
    private BigDecimal weight;

    @Column(precision = 12, scale = 2)
    private BigDecimal costPerGram;

    @Column(precision = 12, scale = 2)
    private BigDecimal lineTotal;

    private String hsnCode;
}
