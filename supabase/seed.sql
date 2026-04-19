insert into public.cards (
  year,
  brand,
  set_name,
  set_slug,
  card_number,
  player_name,
  player_slug,
  team,
  rookie_card,
  image_front_url,
  source,
  slug
)
values
  (1933, 'Goudey', 'Goudey', '1933-goudey', '53', 'Babe Ruth', 'babe-ruth', 'New York Yankees', false, null, 'seed', '1933-goudey-babe-ruth-53'),
  (1948, 'Leaf', 'Leaf', '1948-leaf', '76', 'Ted Williams', 'ted-williams', 'Boston Red Sox', false, '/cards/ted-williams.svg', 'seed', '1948-leaf-ted-williams-76'),
  (1954, 'Topps', 'Topps', '1954-topps', '1', 'Ted Williams', 'ted-williams', 'Boston Red Sox', false, '/cards/ted-williams.svg', 'seed', '1954-topps-ted-williams-1'),
  (1954, 'Topps', 'Topps', '1954-topps', '250', 'Jackie Robinson', 'jackie-robinson', 'Brooklyn Dodgers', false, '/cards/jackie-robinson.svg', 'seed', '1954-topps-jackie-robinson-250'),
  (1954, 'Topps', 'Topps', '1954-topps', '128', 'Ernie Banks', 'ernie-banks', 'Chicago Cubs', true, '/cards/ernie-banks.svg', 'seed', '1954-topps-ernie-banks-128'),
  (1989, 'Upper Deck', 'Upper Deck', '1989-upper-deck', '1', 'Ken Griffey Jr.', 'ken-griffey-jr', 'Seattle Mariners', true, null, 'seed', '1989-upper-deck-ken-griffey-jr-1'),
  (1993, 'SP', 'SP', '1993-sp', '279', 'Derek Jeter', 'derek-jeter', 'New York Yankees', true, null, 'seed', '1993-sp-derek-jeter-279'),
  (2011, 'Topps Update', 'Topps Update', '2011-topps-update', 'US175', 'Mike Trout', 'mike-trout', 'Los Angeles Angels', true, null, 'seed', '2011-topps-update-mike-trout-us175'),
  (2018, 'Topps Update', 'Topps Update', '2018-topps-update', 'US250', 'Shohei Ohtani', 'shohei-ohtani', 'Los Angeles Angels', true, null, 'seed', '2018-topps-update-shohei-ohtani-us250'),
  (2024, 'Bowman Chrome', 'Bowman Chrome', '2024-bowman-chrome', 'BCP-80', 'Paul Skenes', 'paul-skenes', 'Pittsburgh Pirates', true, '/cards/paul-skenes.svg', 'seed', '2024-bowman-chrome-paul-skenes-bcp-80')
on conflict (slug) do nothing;
