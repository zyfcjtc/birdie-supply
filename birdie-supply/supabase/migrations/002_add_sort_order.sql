-- Add sort_order column for recommended product ordering
alter table products add column sort_order integer not null default 0;

-- Products with lower sort_order appear first in recommended view
-- Default 0 means unranked (shown last)
