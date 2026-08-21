package com.ems.sales.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class SalesResponseDTO {
    private Long id;
    private String customerName;
    private String customerPhoneNo;
    private String customerAddress;
    private BigDecimal subtotal;
    private BigDecimal gstAmount;
    private BigDecimal grandTotal;
    private LocalDate saleDate;
    private Integer itemCount;
    private List<SalesitemResponseDTO> items;
}
