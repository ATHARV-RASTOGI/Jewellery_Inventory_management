package com.ems.Exportdata.dto;

public record ExportCriteria(
        Boolean loans,
        Boolean inventory,
        Boolean sales,
        Boolean summary,
        Boolean gold,
        Boolean silver
) {
    public ExportCriteria {
        loans = loans != null ? loans : true;
        inventory = inventory != null ? inventory : true;
        sales = sales != null ? sales : true;
        summary = summary != null ? summary : true;
        gold = gold != null ? gold : true;
        silver = silver != null ? silver : true;
    }

    public ExportCriteria() {
        this(true, true, true, true, true, true);
    }
}
