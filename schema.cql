create keyspace notes
  with replication = { 'class' : 'SimpleStrategy', 'replication_factor' : 2 };

use notes;

create table notes (
  email text,
  id timeuuid,
  body text,
  tag text,
  bucket text,
  primary key (email, id)
)
with clustering order by (id desc);
create index notes_tag_index
  on notes.notes (tag);
create index notes_bucket_index
  on notes.notes (bucket);

create table tags (
  email text,
  id timeuuid,
  tag text,
  count double,
  bucket text,
  primary key (email, id)
)
with clustering order by (id desc);
create index tags_tag_index
  on notes.tags (tag);
create index tags_bucket_index
  on notes.tags (bucket);
