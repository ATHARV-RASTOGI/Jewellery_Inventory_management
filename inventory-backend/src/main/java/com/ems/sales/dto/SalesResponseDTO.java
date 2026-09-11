package com.ems.sales.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder 
@Data
@AllArgsConstructor 
@NoArgsConstructor 
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
