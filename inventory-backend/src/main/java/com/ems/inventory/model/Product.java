package com.ems.inventory.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table(name = "product")

public class Product {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String sku;

    private String mainCategory;
    private String subCategory;
    private String material;

    @Column(precision = 10, scale = 3)
    private BigDecimal baseWeight;

    private String purity;

    private Integer stockQuantity;

   
    @Version
    private Long version;
}
