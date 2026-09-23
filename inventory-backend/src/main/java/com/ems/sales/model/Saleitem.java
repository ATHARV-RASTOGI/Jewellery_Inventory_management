package com.ems.sales.model;
import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
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
@Table(name = "sale_item", indexes = {
    @Index(name = "ix_sale_item_sale_id", columnList = "sale_id")
})
public class Saleitem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    @JsonIgnore  
    private Sales sale;


    @Transient
    public Long  getSaleId() {
        return sale != null ? sale.getId() : null;
    }

    private String sku;
    private String productName;
    private String material;

    
    private String purity;

    
    /**
     * Weight of a single unit/piece in grams.
     * Line metal valuation = ratePerGram * purityMultiplier * weight * quantity.
     */
    @Column(precision = 10, scale = 3)
    private BigDecimal weight;
    private Integer quantity;

    @Column(precision = 12, scale = 2)
    private BigDecimal pricePerPiece;

    @Column(precision = 12, scale = 2)
    private BigDecimal appliedRatePer10g;

    @Column(precision = 5, scale = 2)
    private BigDecimal makingChargePercent;

    @Column(precision = 12, scale = 2)
    private BigDecimal makingChargeAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal lineTotal;

    private String hsnCode;
}   