ETSINF
No description available


Language: Javascript
Columns

Name	Format	Type	Description
exam_instance_id	
bigint

number	
exam_date	
date

string	
exam_time	
time without time zone

string	
duration_minutes	
integer

number	
code	
integer

number	
subject	
text

string	
acronym	
character varying

string	
degree	
text

string	
year	
smallint

number	
semester	
character

string	
place	
text

string	
comment	
text

string	
school	
text

string	
Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select('*')
Read specific columns

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select('some_column,other_column')
Read referenced tables

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select('*')
  .range(0, 9)
Filtering
Documentation
Supabase provides a wide range of filters

With filtering

let { data: ETSINF, error } = await supabase
  .from('ETSINF')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])

  // Logical operators
  .not('column', 'like', 'Negate filter')
  .or('some_column.eq.Some value, other_column.eq.Other value')
Insert rows
Documentation
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('ETSINF')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('ETSINF')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('ETSINF')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
Documentation
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Update matching rows

const { data, error } = await supabase
  .from('ETSINF')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
Documentation
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Delete matching rows

const { error } = await supabase
  .from('ETSINF')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Documentation
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Subscribe to all events

const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts

const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates

const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes

const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'ETSINF' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows

const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'ETSINF', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()


  INDEXES:

  | indexname                     | indexdef                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| etsinf_pkey                   | CREATE UNIQUE INDEX etsinf_pkey ON public."ETSINF" USING btree (exam_instance_id)                             |
| idx_etsinf_school             | CREATE INDEX idx_etsinf_school ON public."ETSINF" USING btree (school)                                        |
| idx_etsinf_degree             | CREATE INDEX idx_etsinf_degree ON public."ETSINF" USING btree (degree)                                        |
| idx_etsinf_year               | CREATE INDEX idx_etsinf_year ON public."ETSINF" USING btree (year)                                            |
| idx_etsinf_semester           | CREATE INDEX idx_etsinf_semester ON public."ETSINF" USING btree (semester)                                    |
| idx_etsinf_exam_date          | CREATE INDEX idx_etsinf_exam_date ON public."ETSINF" USING btree (exam_date)                                  |
| idx_etsinf_school_degree      | CREATE INDEX idx_etsinf_school_degree ON public."ETSINF" USING btree (school, degree)                         |
| idx_etsinf_school_degree_year | CREATE INDEX idx_etsinf_school_degree_year ON public."ETSINF" USING btree (school, degree, year)              |
| idx_etsinf_date_time          | CREATE INDEX idx_etsinf_date_time ON public."ETSINF" USING btree (exam_date, exam_time)                       |
| idx_etsinf_subject_gin        | CREATE INDEX idx_etsinf_subject_gin ON public."ETSINF" USING gin (to_tsvector('english'::regconfig, subject)) |



TABLE 2:

user_calendars
No description available


Language: Javascript
Columns

Name	Format	Type	Description
id	
uuid

string	
user_id	
uuid

string	
name	
text

string	
filters	
jsonb

json	
created_at	
timestamp with time zone

string	
Read rows
Documentation
To read rows in this table, use the select method.

Read all rows

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select('*')
Read specific columns

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select('some_column,other_column')
Read referenced tables

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select(`
    some_column,
    other_table (
      foreign_key
    )
  `)
With pagination

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select('*')
  .range(0, 9)
Filtering
Documentation
Supabase provides a wide range of filters

With filtering

let { data: user_calendars, error } = await supabase
  .from('user_calendars')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])

  // Logical operators
  .not('column', 'like', 'Negate filter')
  .or('some_column.eq.Some value, other_column.eq.Other value')
Insert rows
Documentation
insert lets you insert into your tables. You can also insert in bulk and do UPSERT.

insert will also return the replaced values for UPSERT.

Insert a row

const { data, error } = await supabase
  .from('user_calendars')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
Insert many rows

const { data, error } = await supabase
  .from('user_calendars')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
Upsert matching rows

const { data, error } = await supabase
  .from('user_calendars')
  .upsert({ some_column: 'someValue' })
  .select()
Update rows
Documentation
update lets you update rows. update will match all rows by default. You can update specific rows using horizontal filters, e.g. eq, lt, and is.

update will also return the replaced values for UPDATE.

Update matching rows

const { data, error } = await supabase
  .from('user_calendars')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
Delete rows
Documentation
delete lets you delete rows. delete will match all rows by default, so remember to specify your filters!

Delete matching rows

const { error } = await supabase
  .from('user_calendars')
  .delete()
  .eq('some_column', 'someValue')
Subscribe to changes
Documentation
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.

Subscribe to all events

const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to inserts

const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to updates

const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to deletes

const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: 'user_calendars' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
Subscribe to specific rows

const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'user_calendars', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()




  RLS policies:

  [
  {
    "schemaname": "public",
    "tablename": "ETSINF",
    "policyname": "Allow anonymus read access",
    "permissive": "PERMISSIVE",
    "roles": "{anon}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Delete own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Insert own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Select own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "user_calendars",
    "policyname": "Update own calendars",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": "(auth.uid() = user_id)"
  },

]