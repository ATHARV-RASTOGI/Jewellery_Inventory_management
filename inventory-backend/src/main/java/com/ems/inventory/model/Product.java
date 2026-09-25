package com.ems.inventory.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "product", indexes = {
    @Index(name = "ix_product_sku", columnList = "sku", unique = true)
})
public class Product {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 64)
    private String sku;

    private String mainCategory;
    private String subCategory;
    private String material;

    @Column(name = "total_weight", precision = 10, scale = 3)
    private BigDecimal totalweight;

    private String purity;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

   
    @Version
    private Long version;

    public BigDecimal getBaseWeight() {
        return totalweight;
    }

    public void setBaseWeight(BigDecimal baseWeight) {
        this.totalweight = baseWeight;
    }

    public static class ProductBuilder {
        public ProductBuilder baseWeight(BigDecimal baseWeight) {
            this.totalweight = baseWeight;
            return this;
        }
    }
}
