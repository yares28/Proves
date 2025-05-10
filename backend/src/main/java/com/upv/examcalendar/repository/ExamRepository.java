package com.upv.examcalendar.repository;

import com.upv.examcalendar.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    @Query(value = "SELECT table_name FROM public.public_tables", nativeQuery = true)
    List<String> findAllTableNames();
}