update public.cards
set
  set_full_name = '1933 Goudey Baseball',
  set_slug = '1933-goudey-baseball'
where year = 1933 and brand = 'Goudey';

update public.cards
set
  set_full_name = '1948 Leaf Baseball',
  set_slug = '1948-leaf-baseball'
where year = 1948 and brand = 'Leaf';

update public.cards
set
  set_full_name = '1949 Bowman Baseball',
  set_slug = '1949-bowman-baseball'
where year = 1949 and brand = 'Bowman';

update public.cards
set
  set_full_name = '1952 Bowman Baseball',
  set_slug = '1952-bowman-baseball'
where year = 1952 and brand = 'Bowman';

update public.cards
set
  set_full_name = '1954 Bowman Baseball',
  set_slug = '1954-bowman-baseball'
where year = 1954 and brand = 'Bowman';

update public.cards
set
  set_full_name = '1955 Bowman Baseball',
  set_slug = '1955-bowman-baseball'
where year = 1955 and brand = 'Bowman';

update public.cards
set
  set_full_name = '1952 Topps Baseball',
  set_slug = '1952-topps-baseball'
where year = 1952 and brand = 'Topps' and set_name in ('Topps', 'Base Set');

update public.cards
set
  set_full_name = '1954 Topps Baseball',
  set_slug = '1954-topps-baseball'
where year = 1954 and brand = 'Topps' and set_name in ('Topps', 'Base Set');

update public.cards
set
  set_full_name = '1956 Topps Baseball',
  set_slug = '1956-topps-baseball'
where year = 1956 and brand = 'Topps' and set_name in ('Topps', 'Base Set', 'White Back');
