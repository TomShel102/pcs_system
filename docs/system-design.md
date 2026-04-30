# PCS System Design Baseline

Tai lieu nay la baseline ky thuat cho PCS theo phien ban code hien tai (bao gom smart layout: area/slot).

## 1) Database ERD

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR username
        VARCHAR password_hash
        ENUM role
        BOOLEAN is_deleted
    }

    vehicles {
        UUID id PK
        VARCHAR license_plate UK
        VARCHAR vehicle_type
        BOOLEAN is_deleted
    }

    monthly_tickets {
        UUID id PK
        UUID vehicle_id FK
        VARCHAR customer_name
        DATE expiration_date
        BOOLEAN is_deleted
    }

    pricing_config {
        UUID id PK
        VARCHAR vehicle_type UK
        INT free_minutes
        DECIMAL day_rate
        DECIMAL night_rate
        DECIMAL max_daily_fee
    }

    parking_areas {
        UUID id PK
        VARCHAR code UK
        VARCHAR name
        BOOLEAN is_active
        BOOLEAN is_deleted
    }

    parking_slots {
        UUID id PK
        UUID area_id FK
        VARCHAR slot_code UK
        VARCHAR supported_vehicle_type
        VARCHAR status
        BOOLEAN is_active
        BOOLEAN is_deleted
    }

    parking_sessions {
        UUID id PK
        UUID vehicle_id FK
        UUID guard_in_id FK
        UUID guard_out_id FK
        UUID monthly_ticket_id FK
        UUID slot_id FK
        TIMESTAMPTZ time_in
        TIMESTAMPTZ time_out
        DECIMAL total_fee
        VARCHAR exception_type
        TEXT note
        BOOLEAN is_deleted
    }

    api_idempotency {
        BIGSERIAL id PK
        VARCHAR endpoint
        VARCHAR idempotency_key
        BOOLEAN is_completed
        INT status_code
        JSONB response_payload
        TIMESTAMPTZ created_at
        TIMESTAMPTZ expires_at
    }

    vehicles ||--o{ monthly_tickets : owns
    vehicles ||--o{ parking_sessions : has
    users ||--o{ parking_sessions : guard_in
    users ||--o{ parking_sessions : guard_out
    monthly_tickets ||--o{ parking_sessions : attached_to
    parking_areas ||--o{ parking_slots : contains
    parking_slots ||--o{ parking_sessions : assigned_to
```

### Invariants quan trong

- 1 xe chi co toi da 1 session dang mo (`time_out IS NULL`).
- `parking_slots.status` chi thuoc: `FREE`, `OCCUPIED`, `MAINTENANCE`.
- Check-in chi duoc tao session khi reserve slot thanh cong.
- Check-out phai giai phong slot (`OCCUPIED -> FREE`) trong cung transaction.
- Ghi request nhay cam co idempotency key de replay/anti-duplicate.

---

## 2) Business Flowcharts

### 2.1 Check-in

```mermaid
flowchart TD
    A[Receive check-in request] --> B[Validate fields + normalize plate/type]
    B --> C{Idempotency state}
    C -->|replay| C1[Return stored response]
    C -->|in_progress| C2[Return 409]
    C -->|new| D[Begin transaction]
    D --> E[Find or create vehicle]
    E --> F{Active session exists?}
    F -->|yes| F1[Rollback + 409]
    F -->|no| G[Find valid monthly ticket]
    G --> H[Pick FREE slot by vehicle_type]
    H --> I{Slot found?}
    I -->|no| I1[Rollback + 409 lot full]
    I -->|yes| J[Reserve slot as OCCUPIED]
    J --> K[Insert parking_session with slot_id]
    K --> L[Complete idempotency record]
    L --> M[Commit + return 201]
```

### 2.2 Check-out

```mermaid
flowchart TD
    A[Receive check-out request] --> B[Validate fields]
    B --> C{Idempotency state}
    C -->|replay| C1[Return stored response]
    C -->|in_progress| C2[Return 409]
    C -->|new| D[Begin transaction]
    D --> E[Find active session by plate FOR UPDATE]
    E --> F{Session exists?}
    F -->|no| F1[Rollback + 404]
    F -->|yes| G{Lost ticket?}
    G -->|yes| G1[Apply fixed penalty]
    G -->|no| G2[Load pricing_config + calculateFee]
    G1 --> H[Update session time_out/total_fee]
    G2 --> H
    H --> I[Release slot to FREE]
    I --> J[Complete idempotency record]
    J --> K[Commit + return invoice]
```

### 2.3 Smart Layout / Slot Suggestion

```mermaid
flowchart TD
    A[GET parking-layout] --> B[Join areas + slots + active sessions]
    B --> C[Group by area]
    C --> D[Compute area summary: total/occupied/free]
    D --> E[Return area-slot topology]
```

```mermaid
flowchart TD
    A[GET slot-suggestion?vehicle_type] --> B{vehicle_type provided?}
    B -->|no| B1[Return message: choose vehicle type]
    B -->|yes| C[Find first FREE compatible slot]
    C --> D[Compute area fill-rate alerts]
    D --> E[Return suggestion + alerts]
```

---

## 3) API Contract Snapshot

### Core operation APIs

- `POST /api/check-in`
  - Input: `license_plate`, `vehicle_type`, `guard_in_id`
  - Header: `Idempotency-Key` (optional but recommended)
  - Success: `201`
  - Common errors: `400`, `409`

- `POST /api/check-out`
  - Input: `license_plate`, `guard_out_id`, optional `exception_type=LOST_TICKET`, `note`
  - Header: `Idempotency-Key`
  - Success: `200`
  - Common errors: `400`, `404`, `409`

- `GET /api/dashboard-summary`
  - Success: `200`
  - Output: `vehicles_in_lot`, `check_ins_today`, `check_outs_today`, `revenue_today`, `hourly_revenue`

- `GET /api/active-sessions`
  - Success: `200`
  - Output: active sessions with `license_plate`, `vehicle_type`, `time_in`, `slot_code`

### Smart layout APIs

- `GET /api/parking-layout`
  - Success: `200`
  - Output: danh sach `areas[]`, moi area co `slots[]` + `summary`

- `GET /api/slot-suggestion?vehicle_type=...`
  - Success: `200`
  - Output: `suggestion` (slot de xuat) + `alerts` (khu sap day)

### Supporting APIs

- `POST /api/auth/login`
- `POST /api/monthly-tickets`
- `GET /api/monthly-tickets/:license_plate`
- `GET /health`
- `GET /ready`

### Error matrix (quick)

- `400`: input/contract invalid
- `401/403`: auth/authorization
- `404`: resource/session not found
- `409`: business conflict, in-progress idempotent, lot/slot conflict
- `429`: rate limit
- `500`: unexpected server/database failure

---

## 4) Notes for Team

- `docs/openapi.yaml` hien chua cap nhat day du cac endpoint moi (`/api/parking-layout`, `/api/slot-suggestion`, `/api/active-sessions` co thay doi payload).  
- Nen cap nhat OpenAPI tiep theo tai lieu nay de giu contract-first nhat quan.
