package com.ems.sales.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class SalesitemResponseDTO {
    private Long id;
    private Long saleId;
    private String sku;
    private String productName;
    private String material;
    private String purity;
    private BigDecimal weight;
    private Integer quantity;
    private BigDecimal pricePerPiece;
    private BigDecimal appliedRatePer10g;
    private BigDecimal makingChargePercent;
    private BigDecimal makingChargeAmount;
    private BigDecimal lineTotal;
}
