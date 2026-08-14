# Evidence Photo Upload — Mobile API Guide (v1)

How the m-app uploads milestone evidence photos and submits them. Two steps
per photo-carrying milestone:

```
1. POST  …/milestones/{milestoneKey}/evidence     → upload one photo (multipart), get back its URL
2. PATCH …/milestones/{milestoneKey}              → submit the milestone with the URL(s)
```

The photo is uploaded **unwatermarked**. The backend burns the Dash watermark
(milestone name, order ref, timestamp, plate, address, driver, GPS) onto the
image asynchronously after submit — the URL never changes, so the app does not
need to re-fetch or care about this.

---

## Common

### Base URLs

| Env | Base URL |
| --- | --- |
| Staging | `https://stg-api.dashelectric.co` |
| Production | `https://api.dashelectric.co` |

### Auth

Both endpoints require the rider's JWT with identity type `DRIVER`:

```
Authorization: Bearer <driver JWT>
```

### Response envelope

Success:

```json
{ "status": "Success", "data": { } }
```

Error (any non-2xx — the global filter flattens everything to this shape):

```json
{ "status": "Failed", "error": "<human-readable message>" }
```

> Note: distinguish errors by **HTTP status code** first, message string
> second. Machine-readable error codes (`STOP_NOT_FOUND` etc.) exist
> server-side but are not currently exposed on the wire.

---

## Step 1 — Upload a photo

One call per photo. Call it again for each photo of a multi-photo field.

```
POST /v1/routes/{routeID}/stops/{stopID}/milestones/{milestoneKey}/evidence
```

### Headers

| Header | Value |
| --- | --- |
| `Authorization` | `Bearer <driver JWT>` |
| `Content-Type` | `multipart/form-data; boundary=…` (set automatically by your HTTP client) |

### Path params

| Param | Type | Notes |
| --- | --- | --- |
| `routeID` | UUID | From the route list/detail |
| `stopID` | UUID | From route detail `stops[].id` |
| `milestoneKey` | string | From route detail `workflow.milestones[].key`, e.g. `arrivalEvidence` |

### Body — `multipart/form-data`

| Part | Type | Rules |
| --- | --- | --- |
| `fieldKey` | text field | Required. Must be an `IMAGE` field of this milestone (from the workflow snapshot in route detail) |
| `file` | file part | Required. The photo bytes. JPEG/PNG/WebP, **max 5 MB** — compress before upload |

The file part's own `Content-Type` (set by your client from the file) must be
`image/jpeg`, `image/png`, or `image/webp`.

Example (curl equivalent):

```
curl -X POST \
  -H "Authorization: Bearer <jwt>" \
  -F "fieldKey=outletFrontPhoto" \
  -F "file=@photo.jpg;type=image/jpeg" \
  "https://stg-api.dashelectric.co/v1/routes/{routeID}/stops/{stopID}/milestones/arrivalEvidence/evidence"
```

### Response — 201 Created

```json
{
    "status": "Success",
    "data": {
        "url": "https://storage.googleapis.com/<bucket>/routes/a3b1c5d7-.../stops/c5d3e7f9-.../arrivalEvidence/outletFrontPhoto_1754899200000.jpg",
        "contentType": "image/jpeg"
    }
}
```

| Field | Meaning |
| --- | --- |
| `url` | The permanent URL of the photo. **Keep this** — it is the value you send in submit-milestone (step 2). The upload has already succeeded when you receive it |
| `contentType` | Stored content type (jpg alias normalized to `image/jpeg`) |

### Errors

| HTTP | `error` message | When |
| --- | --- | --- |
| 400 | `Request harus multipart/form-data dengan field foto `file`` | Body isn't multipart |
| 400 | `Form field `fieldKey` wajib diisi` | Missing `fieldKey` part |
| 400 | `Form field foto `file` wajib diisi` | Missing `file` part |
| 401 | `Unauthorized` | Missing/invalid/expired JWT, or token is not `DRIVER` type |
| 404 | `Stop tidak ditemukan` | Unknown route/stop, **or the route belongs to another rider** (never a 403) |
| 404 | `Stop ini tidak punya workflow` | Stop has no workflow — the app runs its static form, there is nothing to upload against |
| 404 | `Milestone {key} tidak ada di workflow ini` | Bad `milestoneKey` |
| 404 | `Field {key} tidak ada di milestone ini` | Bad `fieldKey` |
| 409 | `Stop sudah selesai, evidence tidak bisa ditambah` | Stop already COMPLETED/FAILED/SKIPPED |
| 409 | `Milestone sudah dikirim dan tidak bisa diubah` | Milestone already submitted |
| 409 | `Field {key} bukan field foto` | `fieldKey` is a TEXT/NUMBER field |
| 413 | `Foto maksimal 5MB` | File exceeds the 5 MB cap |
| 415 | `Format {mime} tidak didukung, gunakan JPEG/PNG/WebP` | Not a JPEG/PNG/WebP |

Notes:

- **Pre-uploading is allowed.** The sequential-milestone rule is enforced only
  at submit, not here — on good signal the app may upload photos for any
  still-pending milestone of an open stop.
- Every upload creates a **fresh, unique** object (timestamped name). Retaking
  a photo = upload again and use the new `url`; the old object is harmless.
- Upload failed mid-request (timeout, connection drop)? Just retry the same
  call — no cleanup needed.

---

## Step 2 — Submit the milestone

Existing endpoint, unchanged. Send each `url` (from step 1) as the value of
its image field.

```
PATCH /v1/routes/{routeID}/stops/{stopID}/milestones/{milestoneKey}
```

### Headers

| Header | Value |
| --- | --- |
| `Authorization` | `Bearer <driver JWT>` |
| `Content-Type` | `application/json` |

### Request body

`values` is keyed by field key. Image field values are the `url` strings —
an **array** for multi-photo fields (`imageCount: N` or `multiple: true`),
matching the field config in the workflow snapshot.

```json
{
    "values": {
        "outletFrontPhoto": [
            "https://storage.googleapis.com/<bucket>/routes/.../outletFrontPhoto_1754899200000.jpg",
            "https://storage.googleapis.com/<bucket>/routes/.../outletFrontPhoto_1754899201234.jpg",
            "https://storage.googleapis.com/<bucket>/routes/.../outletFrontPhoto_1754899202345.jpg"
        ],
        "receiverName": "Ibu Sari"
    }
}
```

A fieldless milestone submits `{ "values": {} }`.

### Response — 200 OK

```json
{
    "status": "Success",
    "data": {
        "submissionID": "9e8d7c6b-5a4f-4e3d-2c1b-0a9f8e7d6c5b",
        "routeId": "a3b1c5d7-0e2f-4a6b-8c9d-1e2f3a4b5c6d",
        "stopId": "c5d3e7f9-2a4b-4c8d-0e1f-3a4b5c6d7e8f",
        "workflow": {
            "workflowID": "f1e2d3c4-b5a6-4978-8a9b-0c1d2e3f4a5b",
            "clientID": 12,
            "name": "FORE outlet delivery",
            "stopType": "DROP_OFF",
            "resolvedAt": "2026-08-06T00:00:00.000Z",
            "milestones": [
                {
                    "key": "arrivalEvidence",
                    "name": "Arrival evidence",
                    "sequence": 1,
                    "status": "COMPLETED",
                    "submittedAt": "2026-08-11T03:04:10.000Z",
                    "submittedBy": "456",
                    "fields": [
                        {
                            "key": "outletFrontPhoto",
                            "label": "Outlet front photo",
                            "type": "IMAGE",
                            "sequence": 1,
                            "required": true,
                            "config": { "imageCount": 3 },
                            "value": ["https://storage.googleapis.com/..."]
                        }
                    ]
                },
                {
                    "key": "handover",
                    "name": "Handover",
                    "sequence": 2,
                    "status": "PENDING",
                    "submittedAt": null,
                    "submittedBy": null,
                    "fields": []
                }
            ]
        },
        "stopStatus": "PENDING",
        "stopClosed": false
    }
}
```

| Field | Meaning |
| --- | --- |
| `workflow` | The updated snapshot — same shape as route detail; render from this |
| `stopStatus` | Submitting the **last** pending milestone flips this to `COMPLETED` |
| `stopClosed` | `true` on the call that closed the stop — there is no separate "resolve stop" call |

### Errors

| HTTP | `error` message | When |
| --- | --- | --- |
| 401 | `Unauthorized` | Bad/missing token |
| 404 | `Stop tidak ditemukan` / milestone messages | Same as step 1 |
| 409 | `Rute belum dimulai` | Route not started yet |
| 409 | `Stop sudah selesai, evidence tidak bisa ditambah` | Stop already terminal |
| 409 | `Milestone sudah dikirim dan tidak bisa diubah` | Duplicate submit — including a **timeout replay**: treat this as success and re-fetch route detail |
| 409 | `Milestone harus dikirim berurutan, berikutnya: {key}` | Out of order — submit the named milestone first |
| 422 | `Evidence tidak valid` | One or more field values failed validation (see below) |

422 causes (server validates all fields in one pass; fix and resend the whole
milestone):

- required field missing / empty
- image value not an array of URLs
- wrong photo count for `imageCount: N` fields (exactly N required)
- fewer than 1 photo for `multiple: true` fields
- image URL not `https://` on the trusted media host — **always send the
  untouched `url` from step 1; never rewrite or proxy it**
- text/number type or min/max/maxLength violations

---

## Flow summary (3-photo field + text field)

```
for each photo (3x):
    POST …/milestones/arrivalEvidence/evidence     multipart: fieldKey + file   → url
PATCH …/milestones/arrivalEvidence                 { values: { outletFrontPhoto: [3 urls], receiverName } }
```

- Photos may be uploaded for any pending milestone at any time after the stop
  is open; the sequence rule only gates the PATCH.
- If the PATCH times out, retry it: an identical replay returns 409
  `MILESTONE_ALREADY_SUBMITTED`, which the app should treat as success (then
  re-fetch route detail).
- If an upload times out, retry the upload — a URL is only returned once the
  photo is durably stored, so a URL you hold always points at a real image.
