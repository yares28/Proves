package com.upv.examcalendar.dto;

import java.time.LocalDateTime;

/**
 * Spring Data projection interface for lightweight exam queries.
 * Spring Data will automatically implement this interface and only fetch the
 * specified fields.
 */
public interface ExamProjection {
    Long getId();

    String getSubject();

    String getDegree();

    LocalDateTime getDate();

    String getRoom();
}