select 'devices' as metric, count(*)::text as value from onprem_devices
union all
select 'records', count(*)::text from module_records where deleted = false
union all
select 'conflicts_open', count(*)::text from sync_conflicts where status = 'open'
union all
select 'security_events', count(*)::text from security_events;

select module_key, record_key, version, updated_by, updated_at
from module_records
order by updated_at desc
limit 10;

select category, severity, message, actor_email, created_at
from security_events
order by created_at desc
limit 10;
