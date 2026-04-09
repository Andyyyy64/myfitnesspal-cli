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
| POST | `/api/services/exercises` | Log exercise |
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

## Response patterns

Most `/api/services/*` endpoints return data directly as JSON. Some wrap in `{item: ...}` or `{items: [...]}`.

The food search endpoint (`/_next/data/`) returns Next.js dehydrated state with food data nested in `pageProps.dehydratedState.queries[N].state.data.items`.

## Error responses

- **401/403** - Session expired, re-authenticate
- **404** - Resource not found or API changed
- **307 redirect to /account/logout** - Session invalid (food search)
