# API Reference

All MFP internal API endpoints used by this CLI, grouped by domain.

## Base URL

`https://www.myfitnesspal.com`

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/session` | Session info (next-auth) |
| GET | `/api/auth/csrf` | CSRF token |
| POST | `/api/auth/callback/credentials` | Login with email/password |

## Users & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/users` | Full user profile |
| PATCH | `/api/services/users` | Update user profile |
| GET | `/api/services/diary/profile` | Detailed diary profile (birthdate, sex, meal names, privacy) |

## Food Diary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/diary/read_diary?date=YYYY-MM-DD` | Read diary entries for a date |
| GET | `/api/services/diary/read_day?date=YYYY-MM-DD` | Day metadata/status |
| GET | `/api/services/diary/{entryId}` | Get single diary entry |
| POST | `/api/services/diary` | Create food diary entry |
| PATCH | `/api/services/diary/{entryId}` | Update diary entry |
| DELETE | `/api/services/diary/{entryId}` | Delete diary entry |
| POST | `/api/services/diary/day` | Complete diary day |
| POST | `/api/services/diary/copy_meal` | Copy meal between dates |
| POST | `/api/services/diary/report` | Generate diary report |

## Diary Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/diary/read_notes?date=YYYY-MM-DD&note_type=food` | Read diary notes |
| POST | `/api/services/diary/notes/food` | Add food note |

## Water

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/diary/read_water?date=YYYY-MM-DD` | Read water intake |
| POST | `/api/services/diary/water` | Log water intake |

## Nutrient Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/diary/nutrient_goals?date=YYYY-MM-DD` | Diary-specific nutrient goals |
| GET | `/api/services/nutrient-goals` | All nutrient goal periods |
| POST | `/api/services/nutrient-goals` | Create/update nutrient goals |

## Food Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/_next/data/{buildId}/food/calorie-chart-nutrition-facts.json?params=[query,page]` | Search foods (Next.js data route) |

**Note:** This endpoint requires a valid `buildId` which changes on each MFP deployment. The CLI auto-fetches and caches it.

## Food Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/foods/{foodId}` | Get food details by ID |
| GET | `/api/services/users/foods/mine` | List user's custom foods |
| POST | `/api/services/foods` | Create custom food |
| PATCH | `/api/services/foods/{foodId}` | Update custom food |
| DELETE | `/api/services/foods/{foodId}` | Delete custom food |
| GET | `/api/services/top_foods?from=YYYY-MM-DD&to=YYYY-MM-DD&lists[]=recent` | Top/recent/frequent foods |

## Saved Meals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/users/meals/mine` | List saved meals |
| DELETE | `/api/services/users/meals/delete/{mealId}` | Delete saved meal |

## Exercise

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/exercises/search?search={term}` | Search exercises |
| GET | `/api/services/exercises/lookup` | List all exercises alphabetically |
| GET | `/api/services/exercises/lookup/{id}` | Get exercise details |
| GET | `/api/services/exercises/lookup_private` | List custom/private exercises |
| GET | `/api/services/exercises/calories_burned/{id}` | Calories burned calculation |
| POST | `/api/services/diary` | Log exercise (type: exercise_entry) **[not working - see body formats]** |
| PUT | `/api/services/exercises/{id}` | Update exercise entry |
| DELETE | `/api/services/exercises/{id}` | Delete exercise entry |

## Measurements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user-measurements/measurements` | All measurements |
| GET | `/api/user-measurements/measurements/{id}` | Single measurement (wrapped in `{item: ...}`) |
| PUT | `/api/user-measurements/measurements` | Create/update measurement |
| DELETE | `/api/user-measurements/measurements/{id}` | Delete measurement |
| GET | `/api/user-measurements/measurements/types` | Measurement types |
| POST | `/api/user-measurements/measurements/types` | Create measurement type |
| DELETE | `/api/user-measurements/measurements/types/{id}` | Delete measurement type |

## Account & Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/account/diary_settings` | Diary settings |
| POST | `/api/services/account/diary_settings` | Update diary settings |
| POST | `/api/services/data-exports` | Request data export |

## Reports & Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services/live-digest?from-date=YYYY-MM-DD&to-date=YYYY-MM-DD` | Weekly digest/summary |
| GET | `/api/services/reports/results/{type}/{name}/{length}` | Reports |

## Request Body Formats

### POST /api/services/diary (create food entry)

```json
{
  "items": [{
    "type": "food_entry",
    "date": "YYYY-MM-DD",
    "food": { "id": "<foodId>", "version": "<foodId>" },
    "servings": 1,
    "meal_position": 0,
    "serving_size": {
      "nutrition_multiplier": 1,
      "unit": "cup",
      "value": 1
    }
  }]
}
```

`meal_position`: 0=breakfast, 1=lunch, 2=dinner, 3=snack.

### POST /api/services/diary (create exercise entry)

**Status: Not working.** The endpoint accepts `type: "exercise_entry"` but the exact body format for the `quantity` (duration in minutes) field could not be determined. The backend validates with "Quantity ^Please enter a valid number of minutes" regardless of format. Exercise search, lookup, update (PUT), and delete all work.

### PATCH /api/services/diary/{entryId} (update diary entry)

```json
{ "servings": 2 }
```

or

```json
{ "meal_name": "Dinner" }
```

### PUT /api/services/diary/{entryId} (full update)

```json
{ "item": { /* full entry object */ } }
```

### POST /api/services/diary/water

```json
{ "date": "YYYY-MM-DD", "units": "cups", "value": 8 }
```

The `units` field can be `"cups"` or `"milliliters"`. The web frontend uses `"milliliters"`.

### PUT /api/user-measurements/measurements

```json
{
  "items": [{
    "type": "Weight",
    "value": 106.3,
    "unit": "kg",
    "date": "YYYY-MM-DD"
  }]
}
```

### POST /api/services/nutrient-goals

Requires `x-csrf-token` header (fetch from `GET /api/auth/csrf`).

```json
{
  "item": {
    "valid_from": "YYYY-MM-DD",
    "daily_goals": [
      {
        "day_of_week": "monday",
        "group_id": 0,
        "energy": { "value": "2040", "unit": "calories" },
        "carbohydrates": 255,
        "protein": 102,
        "fat": 68,
        "saturated_fat": 23,
        "sodium": 2300,
        "sugar": 77,
        "fiber": 38,
        "cholesterol": 300,
        "potassium": 3500,
        "assign_exercise_energy": "nutrient_goal"
      }
    ],
    "default_goal": { ... }
  }
}
```

Note: `energy.value` must be a **string**, not a number. `daily_goals` must include all 7 days (monday-sunday). The CSRF token cookie must also be included.

## Response patterns

Most `/api/services/*` endpoints return data directly as JSON. Some wrap in `{item: ...}` or `{items: [...]}`.

The food search endpoint (`/_next/data/`) returns Next.js dehydrated state with food data nested in `pageProps.dehydratedState.queries[N].state.data.items`.

## Error responses

- **401/403** - Session expired, re-authenticate
- **404** - Resource not found or API changed
- **307 redirect to /account/logout** - Session invalid (food search)
- **400 with `error_details.item_error`** - Validation error with field-specific messages (^ separates field name from error)
- **422 "json request body malformed"** - Request body doesn't match expected Java deserialization schema
