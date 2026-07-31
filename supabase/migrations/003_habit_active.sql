-- habit active flag (soft-deactivate instead of deleting, keeps history/traceability)
alter table public.habits add column active boolean not null default true;
