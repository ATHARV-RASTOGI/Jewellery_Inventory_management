package com.ems.Exportdata.dto;

public record ExportCriteria(
        boolean loans,
        boolean inventory,
        boolean sales,
        boolean summary,
        boolean gold,
        boolean silver
) {
    public ExportCriteria() {
        this(true, true, true, true, true, true);
    }
}
