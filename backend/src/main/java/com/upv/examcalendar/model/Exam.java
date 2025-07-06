package com.upv.examcalendar.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ETSINF")
public class Exam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "subject")
    private String subject;

    @Column(name = "degree")
    private String degree;

    @Column(name = "year")
    private String year;

    @Column(name = "semester")
    private String semester;

    @Column(name = "exam_date")
    private LocalDateTime date;

    @Column(name = "place")
    private String room;

    @Column(name = "school")
    private String school;

    // Additional fields that might exist in the ETSINF table
    @Column(name = "exam_instance_id")
    private String examInstanceId;

    @Column(name = "exam_time")
    private String examTime;

    @Column(name = "code")
    private String code;

    @Column(name = "acronym")
    private String acronym;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "comment")
    private String comment;
}