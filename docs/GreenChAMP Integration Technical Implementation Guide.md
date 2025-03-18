# **GreenChAMP Integration Technical Implementation Guide**

This guide provides a detailed, step-by-step approach to integrating the **GreenChAMP (Green DOT Chained Activity Modelling Process)** into the Planning Manager web application. Each section below covers a key technical aspect, with instructions, code examples, and best practices for a seamless integration.

## **1\. Database Schema & Storage (PostgreSQL \+ PostGIS)**

**Multi-Tenant Data Architecture:** Design the database to support multiple agencies (tenants) such that each tenant's data is isolated. The simplest approach is to use **shared tables with a tenant identifier** on each record​. For example, include a column like `org_id` (or `tenant_id`) in every table to tag which organization the data belongs to. Enable PostgreSQL **Row-Level Security (RLS)** policies so that users can only access rows with their `org_id`. A sample RLS policy condition might ensure `tenant_id = auth.jwt().org_id` for all queries, effectively **filtering data per tenant at the database level**. This approach is easier to scale to many tenants while keeping data separated logically.

**Schema with PostGIS for Spatial Data:** Include PostGIS extension to handle geographic data. Define tables for each major component of the travel model, ensuring they can store spatial information (e.g., zone polygons, network links). Key tables and their purposes:

* **`organizations`** – (if not using Supabase auth for orgs) list of tenant agencies with `id` (UUID) and name.  
* **`scenarios`** – stores modeling scenarios. Fields: `id` (UUID), `org_id` (tenant), scenario name, description, creation date, etc. Use this to group inputs/outputs for a model run.  
* **`zones`** – defines travel analysis zones (TAZs) or districts. Fields: `id` (PK), `org_id`, socio-economic attributes (population, employment, etc.), and a `geom` geometry (Polygon or MultiPolygon) for the zone area. This allows spatial queries like finding which zone a coordinate falls in.  
* **`trip_generation`** – trip production/attraction inputs per zone. Fields: `scenario_id` (FK to scenarios), `zone_id` (FK to zones), trip purpose (e.g. work, school, total), and number of trips produced *and/or* attracted. This table holds the results of the Trip Generation step for each scenario.  
* **`trip_distribution`** – origin-destination trip matrix results. Fields: `scenario_id`, `origin_zone`, `dest_zone` (FKs to zones), possibly trip purpose, and `trip_count`. This represents how many trips go from each origin to each destination (output of the Distribution step).  
* **`mode_choice`** – mode split results. Fields: `scenario_id`, `origin_zone`, `dest_zone`, `mode` (e.g. auto, transit, bike, walk), and `trip_count`. This can store the breakdown of trips by travel mode between each zone pair (output of Mode Choice step). Alternatively, mode choice results can be integrated into the trip\_distribution table by adding a mode dimension; use a separate table for clarity.  
* **`network_links`** – transportation network links (edges). Fields: `id` (PK), `org_id`, link attributes (road name or transit line, capacity, speed, etc.), and `geom` geometry (LineString or MultiLineString) representing the link's shape. This stores the physical network used for assignment.  
* **`assignment_results`** – network assignment outcomes per link. Fields: `scenario_id`, `link_id` (FK to network\_links), assigned volume (traffic flow), congested travel time, level-of-service or congestion index, etc. This captures results of the Network Assignment step for each scenario.  
* *(Additional tables):* You might include `nodes` (network nodes with point geometry) if needed for network topology, or a `scenario_parameters` table for various input assumptions (transit fare, telecommuting rate, etc.) per scenario. These are optional depending on how inputs are structured.

All tables that are scenario-specific should reference `scenario_id`, which in turn links to an `org_id` through the scenarios table (or each table can directly carry `org_id` if more convenient). This ensures every data point is tied to a tenant for security. For spatial columns like `zones.geom` or `network_links.geom`, create a **GiST spatial index** to accelerate spatial queries. For example, after creating the table, run:

```sql
CREATE INDEX idx_zones_geom ON zones USING GIST (geom);
CREATE INDEX idx_links_geom ON network_links USING GIST (geom);
```

This allows efficient operations like bounding-box searches or spatial joins on these tables. 