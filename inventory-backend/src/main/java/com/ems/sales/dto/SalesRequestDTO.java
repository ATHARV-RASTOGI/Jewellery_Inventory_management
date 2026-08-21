package com.ems.sales.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class SalesRequestDTO {
    private String customerName;
    private String customerAddress;

    @JsonAlias({"customerPhone", "customerPhoneNo"})
    private String customerPhoneNo;

    private List<SalesitemRequestDTO> items;
}
