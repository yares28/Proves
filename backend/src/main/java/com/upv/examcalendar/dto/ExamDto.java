package com.upv.examcalendar.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Data Transfer Object for Exam entity mapped to ETSINF table.
 * Based on Supabase schema and Spring Boot best practices.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamDto {

    @JsonProperty("id")
    private Long id;

    @NotBlank(message = "Subject is required")
    @JsonProperty("subject")
    private String subject;

    @NotBlank(message = "Degree is required")
    @JsonProperty("degree")
    private String degree;

    @NotBlank(message = "Year is required")
    @JsonProperty("year")
    private String year;

    @NotBlank(message = "Semester is required")
    @JsonProperty("semester")
    private String semester;

    @NotNull(message = "Date is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @JsonProperty("date")
    private LocalDateTime date;

    @JsonProperty("room")
    private String room;

    @NotBlank(message = "School is required")
    @JsonProperty("school")
    private String school;

    // Additional fields that might exist in the actual ETSINF table
    @JsonProperty("acronym")
    private String acronym;

    @JsonProperty("code")
    private String code;

    @JsonProperty("exam_instance_id")
    private String examInstanceId;

    @JsonProperty("exam_date")
    private String examDate;

    @JsonProperty("exam_time")
    private String examTime;

    @JsonProperty("duration_minutes")
    private Integer durationMinutes;

    @JsonProperty("place")
    private String place;

    @JsonProperty("comment")
    private String comment;
}