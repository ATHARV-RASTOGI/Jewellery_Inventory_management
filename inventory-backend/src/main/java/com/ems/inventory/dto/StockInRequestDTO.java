package com.ems.inventory.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class StockInRequestDTO {
    private String sku;
    private Integer quantityadded;
    private BigDecimal weightAdded;
    private String batchNumber;
}
