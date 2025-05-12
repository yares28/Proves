# Performance Optimizations for Exam Calendar

This document outlines the performance optimizations implemented to make the exam calendar data fetching faster.

## Database Indexes

The following indexes were created on the `ETSINF` table to optimize query performance:

```sql
-- Basic indexes for common filter columns
CREATE INDEX idx_etsinf_school ON "ETSINF" (school);
CREATE INDEX idx_etsinf_degree ON "ETSINF" (degree);
CREATE INDEX idx_etsinf_year ON "ETSINF" (year);
CREATE INDEX idx_etsinf_semester ON "ETSINF" (semester);
CREATE INDEX idx_etsinf_exam_date ON "ETSINF" (exam_date);

-- Composite indexes for combined filters
CREATE INDEX idx_etsinf_school_degree ON "ETSINF" (school, degree);
CREATE INDEX idx_etsinf_school_degree_year ON "ETSINF" (school, degree, year);
CREATE INDEX idx_etsinf_date_time ON "ETSINF" (exam_date, exam_time);

-- Full text search index for subject searching
CREATE INDEX idx_etsinf_subject_gin ON "ETSINF" USING gin(to_tsvector('english', subject));
```

## Code Optimizations

### 1. Query Optimizations

- **Selective Column Selection**: Only retrieving the specific columns needed instead of using `SELECT *`
- **Filter Order**: Arranged filters from most selective to least selective to maximize index usage
- **Numeric Conversions**: Properly converting string year values to integers for correct comparisons
- **ILIKE with Indexes**: Using `ilike` with pattern matching to leverage the GIN index for subject searches

### 2. Caching Improvements

- **Multi-Level Cache**: Implemented caching for all data types (schools, degrees, semesters, years, subjects, and exams)
- **Different TTLs**: Set different time-to-live values for different data types (shorter for exams, longer for metadata)
- **Cache Key Generation**: Created robust cache key generation based on filter combinations
- **Automatic Cache Expiry**: Added automatic cache cleaning for expired entries

### 3. Performance Monitoring

- **Query Timing**: Added performance timing for all database operations
- **Result Counting**: Logging the number of results and query execution time
- **Cache Hit Logging**: Tracking when cache is used vs. when database queries are made

## Results

These optimizations should result in:

1. **Faster Initial Load**: The first load of any filter combination will be faster due to better database query structure
2. **Near-Instant Repeated Queries**: Subsequent identical queries will use the cache
3. **Reduced Database Load**: Fewer and more efficient database queries
4. **Better User Experience**: More responsive UI especially when applying filters
5. **Scalability**: Better handling of larger datasets as the application grows

## Monitoring Query Performance

You can monitor the performance of your queries with:

```sql
-- Check which indexes exist on the ETSINF table
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'ETSINF';

-- Check index usage statistics
SELECT
    relname as table_name,
    indexrelname as index_name,
    idx_scan as index_scans_count,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM
    pg_stat_user_indexes
JOIN
    pg_index USING (indexrelid)
WHERE
    relname = 'ETSINF'
ORDER BY
    idx_scan DESC;
``` 