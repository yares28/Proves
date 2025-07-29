# Java Supabase Client Implementation

This document explains how the Java backend mimics the TypeScript Supabase client functionality.

## Overview

The Java backend now includes a `SupabaseClient` that replicates the functionality of the TypeScript client (`lib/supabase/client.ts` and `lib/supabase/server.ts`). This allows the backend to interact with Supabase in a similar way to how the frontend does.

## Key Components

### 1. SupabaseClient (`com.upv.examcalendar.client.SupabaseClient`)

The main client class that mimics the TypeScript client functionality:

- **Authentication Management**: Handles access tokens, refresh tokens, and session management
- **HTTP Operations**: Provides GET, POST, PUT, DELETE methods for Supabase REST API
- **Database Operations**: Query, insert, update, delete operations on Supabase tables
- **Token Refresh**: Automatic token refresh when tokens expire
- **User Management**: Get current user, sign out functionality

### 2. SupabaseConfig (`com.upv.examcalendar.config.SupabaseConfig`)

Configuration class that maps to environment variables used by the TypeScript client:

```properties
# Maps to TypeScript environment variables
supabase.project-url=${NEXT_PUBLIC_SUPABASE_URL}
supabase.anon-key=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
supabase.service-role-key=${SUPABASE_SERVICE_ROLE_KEY}
supabase.jwt.secret=${SUPABASE_JWT_SECRET}
```

### 3. SupabaseClientService (`com.upv.examcalendar.service.SupabaseClientService`)

Service layer that demonstrates usage patterns similar to the TypeScript client:

- Client creation (user vs admin)
- Session management
- Database operations
- Authentication status

### 4. SupabaseClientController (`com.upv.examcalendar.controller.SupabaseClientController`)

REST controller that provides endpoints demonstrating the client functionality:

- `/api/supabase-client/create-user-client` - Creates user client
- `/api/supabase-client/create-admin-client` - Creates admin client
- `/api/supabase-client/set-session` - Sets authentication session
- `/api/supabase-client/current-user` - Gets current user
- `/api/supabase-client/auth-status` - Gets authentication status
- `/api/supabase-client/exams` - Gets exams from Supabase
- `/api/supabase-client/user-calendars/{userId}` - Gets user calendars

## TypeScript vs Java Comparison

### TypeScript Client Usage

```typescript
// Create client
const supabase = createClient()

// Set session
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken
})

// Query data
const { data, error } = await supabase
  .from('ETSINF')
  .select('*')
  .eq('degree', 'Computer Science')

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Java Client Usage

```java
// Create client
SupabaseClient client = supabaseClient.createClient()

// Set session
client.setSession(accessToken, refreshToken)

// Query data
Optional<List<ExamDto>> exams = client.query("ETSINF", filters, List.class)

// Get current user
Optional<JsonNode> user = client.getCurrentUser()
```

## Key Features Implemented

### 1. Authentication Management

- **Token Storage**: Stores access and refresh tokens in memory
- **Token Expiration**: Checks token expiration and refreshes automatically
- **Session Management**: Similar to TypeScript `setSession()` method
- **User Authentication**: Get current user information

### 2. HTTP Operations

- **REST API Integration**: Uses Spring's RestTemplate for HTTP requests
- **Headers Management**: Sets proper Supabase headers (apikey, Authorization)
- **Error Handling**: Comprehensive error handling and logging
- **Response Processing**: Handles JSON responses and converts to Java objects

### 3. Database Operations

- **Query Operations**: `query()` method for SELECT operations
- **Insert Operations**: `insert()` method for INSERT operations
- **Update Operations**: `update()` method for UPDATE operations
- **Delete Operations**: `delete()` method for DELETE operations

### 4. Configuration Management

- **Environment Variables**: Maps to same environment variables as TypeScript client
- **Flexible Configuration**: Supports both user and admin operations
- **Security**: Proper handling of service role keys

## Usage Examples

### Basic Client Creation

```java
@Service
public class MyService {
    private final SupabaseClient supabaseClient;
    
    public void createUserClient() {
        SupabaseClient client = supabaseClient.createClient();
        // Use client for user operations
    }
    
    public void createAdminClient() {
        SupabaseClient client = supabaseClient.createAdminClient();
        // Use client for admin operations
    }
}
```

### Authentication

```java
// Set session
supabaseClient.setSession(accessToken, refreshToken);

// Check authentication
boolean isAuthenticated = supabaseClient.isAuthenticated();

// Get current user
Optional<JsonNode> user = supabaseClient.getCurrentUser();

// Sign out
boolean success = supabaseClient.signOut();
```

### Database Operations

```java
// Query exams
Map<String, Object> filters = new HashMap<>();
filters.put("select", "*");
filters.put("degree", "eq.Computer Science");
Optional<List<ExamDto>> exams = supabaseClient.query("ETSINF", filters, List.class);

// Insert exam
ExamDto exam = new ExamDto();
Optional<ExamDto> createdExam = supabaseClient.insert("ETSINF", exam, ExamDto.class);

// Update exam
Optional<ExamDto> updatedExam = supabaseClient.update("ETSINF", exam, "123", ExamDto.class);

// Delete exam
Optional<Void> result = supabaseClient.delete("ETSINF", "123", Void.class);
```

### User Calendars (Matching TypeScript Database Types)

```java
// Get user calendars
Optional<List<JsonNode>> calendars = supabaseClient.query("user_calendars", filters, List.class);

// Create user calendar
Map<String, Object> calendarData = new HashMap<>();
calendarData.put("user_id", userId);
calendarData.put("name", "My Calendar");
calendarData.put("filters", filters);
Optional<JsonNode> createdCalendar = supabaseClient.insert("user_calendars", calendarData, JsonNode.class);
```

## Security Considerations

1. **Token Management**: Tokens are stored in memory and cleared on sign out
2. **Service Role**: Admin operations use service role key for bypassing RLS
3. **Authentication**: JWT validation through existing `SupabaseJwtUtil`
4. **CORS**: Proper CORS configuration for frontend integration

## Integration with Existing Backend

The Java SupabaseClient integrates seamlessly with the existing backend:

- **Existing Security**: Uses existing JWT authentication and security filters
- **Existing Models**: Works with existing `ExamDto` and other DTOs
- **Existing Controllers**: Can be used alongside existing REST controllers
- **Existing Configuration**: Uses existing application properties

## Benefits

1. **Consistency**: Same patterns as TypeScript client
2. **Flexibility**: Can perform both user and admin operations
3. **Integration**: Works with existing Spring Boot security
4. **Performance**: Leverages Spring's RestTemplate and caching
5. **Maintainability**: Clear separation of concerns and proper error handling

## Testing

The implementation includes comprehensive logging and error handling:

- Debug logs for all operations
- Error logs for failed operations
- Success logs for completed operations
- Token refresh logging
- Authentication status logging

This Java implementation provides a complete Supabase client experience that mirrors the TypeScript client functionality while integrating properly with the Spring Boot backend architecture.