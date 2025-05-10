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

    @Column(name = "date")
    private LocalDateTime date;

    @Column(name = "room")
    private String room;

    @Column(name = "school")
    private String school;
}