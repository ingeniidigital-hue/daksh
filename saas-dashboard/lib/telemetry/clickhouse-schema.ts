export const CLICKHOUSE_TELEMETRY_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS daksh_telemetry.events (
    event_id UUID DEFAULT generateUUIDv4(),
    title_id LowCardinality(String),
    event_name LowCardinality(String),
    player_id String,
    timestamp DateTime64(3, 'UTC'),
    event_date Date DEFAULT toDate(timestamp),
    properties String, -- JSON stringified scrubbed properties
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY (title_id, toYYYYMM(event_date))
ORDER BY (title_id, event_name, timestamp, event_id)
TTL event_date + INTERVAL 90 DAY;
`;
