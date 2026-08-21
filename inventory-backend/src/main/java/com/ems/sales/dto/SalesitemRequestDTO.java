package com.ems.sales.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class SalesitemRequestDTO {
    private String sku;
    private Integer quantity;
    private BigDecimal pricePerPiece;
    private BigDecimal appliedRatePer10g;
    private BigDecimal makingChargePercent;
    private BigDecimal makingChargeAmount;
}
