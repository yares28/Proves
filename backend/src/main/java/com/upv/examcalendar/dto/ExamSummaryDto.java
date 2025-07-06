package com.upv.examcalendar.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lightweight DTO for exam list views.
 * Contains only essential fields to reduce memory usage and improve query
 * performance.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExamSummaryDto {
    private Long id;
    private String subject;
    private String degree;
    private LocalDateTime date;
    private String room;

    /**
     * Constructor for JPA projections
     */
    public ExamSummaryDto(Long id, String subject, String degree, LocalDateTime date) {
        this.id = id;
        this.subject = subject;
        this.degree = degree;
        this.date = date;
    }
}