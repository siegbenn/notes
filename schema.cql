create table notes (
  email text,
  id timeuuid,
  body text,
  tag text,
  primary key (email, id)
)
with clustering order by (id desc);
create index notes_tag_index
  on notes.notes (tag);

create table tags (
  email text,
  id timeuuid,
  tag text,
  count double,
  primary key (email, id)
)
with clustering order by (id desc);
create index tags_tag_index
  on notes.tags (tag);
  
