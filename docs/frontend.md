# Frontend Documentation — Property Rental Management System

> **Audience:** College jury members and team members with no development background.
> **Goal:** Explain every decision, every file, and every concept in the frontend with enough depth to answer any jury question confidently.

---

## Table of Contents

1. [What is a Frontend?](#1-what-is-a-frontend)
2. [What is React?](#2-what-is-react)
3. [What is TypeScript?](#3-what-is-typescript)
4. [Project Folder Structure](#4-project-folder-structure)
5. [What is TanStack Router? File-Based Routing](#5-what-is-tanstack-router)
6. [How Pages Are Protected — The Auth Guard](#6-how-pages-are-protected)
7. [The API Layer — Axios and Interceptors](#7-the-api-layer)
8. [State Management with Zustand](#8-state-management-with-zustand)
9. [Data Fetching with TanStack Query](#9-data-fetching-with-tanstack-query)
10. [Every Page Explained](#10-every-page-explained)
11. [Forms and Validation — react-hook-form + Zod](#11-forms-and-validation)
12. [UI Components — shadcn/ui and Tailwind CSS](#12-ui-components)
13. [Environment Variable (VITE_API_BASE_URL)](#13-environment-variable)
14. [Deployment on Vercel](#14-deployment-on-vercel)

---

## 1. What is a Frontend?

The **frontend** is everything the user sees and interacts with in their web browser. It is the "face" of the application — the buttons, forms, tables, menus, colors, and animations.

Think of a car:
- The **frontend** is the steering wheel, dashboard, seats, and windows — what the driver (user) touches and sees.
- The **backend** is the engine, gearbox, and fuel system — doing the real work, invisible to the driver.

Our frontend is a **Single Page Application (SPA)**. This means the browser loads one HTML page, and all navigation happens inside that page by swapping out components — no full page reloads. The result feels like a native desktop application rather than a traditional website.

The frontend is deployed on **Vercel** and accessible at its production URL. It communicates with the backend API to fetch and modify data.

---

## 2. What is React?

**React** is the most widely used JavaScript library for building user interfaces. It was created by Facebook (Meta) in 2013 and is used by companies like Netflix, Airbnb, Atlassian, and thousands of others.

### Component-Based Thinking

React's core idea is **components** — small, reusable pieces of UI, like building blocks.

Think of a webpage like a Lego model. Instead of sculpting the whole thing from a single block of clay, you build it from individual Lego bricks (components) that each do one thing. A `Button` component, a `Card` component, a `PropertyCard` component — each is defined once and can be used anywhere.

**Example from our code:**

The Dashboard page (`_app.index.tsx`) uses a `StatCard` component:
```typescript
// frontend/src/routes/_app.index.tsx, line 24
function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {sub && <p className="text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}
```

Then it's used four times with different data:
```typescript
<StatCard icon={Building2} label="Properties" value={String(s?.total_properties ?? 0)} />
<StatCard icon={Home} label="Total units" value={String(s?.total_units ?? 0)} />
<StatCard icon={DoorOpen} label="Occupancy" value={`${s?.occupancy_rate ?? 0}%`} />
<StatCard icon={TrendingUp} label="Collected this month" value={formatCurrency(f?.current_month_collected)} />
```

Write once, reuse four times with different props (properties). This is the power of components.

### React Version

Our app uses **React 19** (the latest version, as seen in `package.json` line 50: `"react": "^19.2.0"`).

---

## 3. What is TypeScript?

**JavaScript** is the programming language of the web. Every browser understands it. **TypeScript** is JavaScript with an added layer: **types**.

### Why Types Matter

In JavaScript, you can write:
```javascript
let rent = "five thousand";  // Accidentally a string, not a number
let total = rent * 12;       // NaN (Not a Number) — silent bug!
```

In TypeScript, this would be a compile-time error:
```typescript
let rent: number = "five thousand";  // ❌ Error: Type 'string' is not assignable to type 'number'
```

TypeScript catches these mistakes **before the code runs**, not after users report bugs.

### Types in Our App

Our `types/api.types.ts` file defines TypeScript types for every object in the system:

```typescript
// frontend/src/types/api.types.ts, line 1-7
export type PropertyType = "RESIDENTIAL" | "COMMERCIAL";
export type UnitStatus = "VACANT" | "OCCUPIED" | "MAINTENANCE";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
```

These **union types** mean a `PaymentStatus` can only ever be one of those four strings — nothing else. If a developer writes `status = "LATE"`, TypeScript flags it immediately.

```typescript
// frontend/src/types/api.types.ts, line 42-58
export interface Property {
  id: string;
  owner_id: string;
  name: string;
  city: string;
  property_type: PropertyType;
  total_units: number;
  occupied_units: number;     // ← computed by the backend
  monthly_revenue: number;    // ← computed by the backend
  created_at: string;
  updated_at: string;
}
```

This `Property` interface means any code that works with a property gets **auto-complete** in the editor and an immediate error if it tries to access a field that doesn't exist (e.g., `property.rent` — there's no such field).

---

## 4. Project Folder Structure

```
frontend/src/
├── api/
│   ├── axios.ts           ← The central HTTP client. Handles token injection and auto-refresh.
│   ├── auth.api.ts        ← Functions that call auth endpoints (login, register, me, logout).
│   ├── properties.api.ts  ← Functions that call property/unit endpoints.
│   ├── tenants.api.ts     ← Functions that call tenant endpoints.
│   ├── leases.api.ts      ← Functions that call lease endpoints.
│   ├── payments.api.ts    ← Functions that call payment endpoints.
│   └── dashboard.api.ts   ← Function that calls the dashboard endpoint.
│
├── store/
│   └── authStore.ts       ← Global auth state (access token, owner profile). Persisted to localStorage.
│
├── hooks/
│   ├── useAuth.ts         ← useLogin, useRegister, useLogout mutations.
│   ├── useProperties.ts   ← useProperties, useProperty, useCreateProperty, etc.
│   ├── useTenants.ts      ← useTenants, useCreateTenant, etc.
│   ├── useLeases.ts       ← useLeases, useCreateLease, useTerminateLease, etc.
│   ├── usePayments.ts     ← usePayments, useCreatePayment, etc.
│   ├── useDashboard.ts    ← useDashboard query.
│   └── apiError.ts        ← Helper to extract readable error messages from API errors.
│
├── routes/
│   ├── __root.tsx         ← Root layout wrapping the entire app (HTML shell).
│   ├── login.tsx          ← The login page (/login).
│   ├── register.tsx       ← The registration page (/register).
│   ├── _app.tsx           ← Protected layout — checks auth before rendering children.
│   ├── _app.index.tsx     ← Dashboard page (/).
│   ├── _app.properties.tsx       ← Properties list page (/properties).
│   ├── _app.properties.$id.tsx   ← Single property detail page (/properties/:id).
│   ├── _app.tenants.tsx          ← Tenants list page (/tenants).
│   ├── _app.tenants.$id.tsx      ← Single tenant detail page (/tenants/:id).
│   ├── _app.leases.tsx           ← Leases list page (/leases).
│   ├── _app.leases.$id.tsx       ← Single lease detail page (/leases/:id).
│   └── _app.payments.tsx         ← Payments list page (/payments).
│
├── components/
│   ├── ui/                ← shadcn/ui base components (Button, Card, Dialog, etc.)
│   ├── layout/
│   │   └── AppLayout.tsx  ← Sidebar navigation + main content area.
│   ├── features/
│   │   ├── properties/    ← PropertyCard, PropertyForm components.
│   │   ├── tenants/       ← TenantCard, TenantForm components.
│   │   ├── leases/        ← LeaseCard, LeaseForm, TerminateLeaseDialog components.
│   │   └── payments/      ← PaymentCard, PaymentForm components.
│   ├── PageHeader.tsx     ← Reusable page title + description + action button area.
│   └── EmptyState.tsx     ← Displayed when a list has no items.
│
├── types/
│   └── api.types.ts       ← TypeScript type definitions for all API data shapes.
│
└── utils/
    ├── formatCurrency.ts  ← Formats numbers as Indian Rupees (₹ 1,23,456).
    └── formatDate.ts      ← Formats dates in a human-readable way.
```

---

## 5. What is TanStack Router?

### What is Routing?

In a traditional website, each URL corresponds to a separate HTML file on the server. In a React SPA, there's only one HTML file. **Routing** is the system that decides which components to render based on the current URL.

When the URL changes from `/properties` to `/tenants`, the router swaps out the Properties component for the Tenants component — without ever reloading the page.

### TanStack Router

**TanStack Router** is a modern, type-safe router for React. We chose it because:
- It is **fully type-safe** — TypeScript knows every valid URL, every route parameter, and every search parameter.
- It has **file-based routing** — the file name determines the URL, making the project structure self-documenting.
- It integrates tightly with TanStack Query (our data-fetching library).

### File-Based Routing — How File Names Map to URLs

TanStack Router reads the file names in `src/routes/` and generates the routing table automatically:

| File Name | URL | Notes |
|---|---|---|
| `login.tsx` | `/login` | Public page |
| `register.tsx` | `/register` | Public page |
| `_app.tsx` | (layout wrapper) | The `_app` prefix means "layout", not a URL itself |
| `_app.index.tsx` | `/` | The `index` maps to the root of the layout |
| `_app.properties.tsx` | `/properties` | |
| `_app.properties.$id.tsx` | `/properties/:id` | `$id` means "dynamic parameter" |
| `_app.tenants.tsx` | `/tenants` | |
| `_app.leases.tsx` | `/leases` | |
| `_app.leases.$id.tsx` | `/leases/:id` | |
| `_app.payments.tsx` | `/payments` | |

The `_app` prefix on most files means they are "nested" under the `_app.tsx` layout. All routes starting with `_app.` share the same layout (sidebar + header) and are protected by the auth guard in `_app.tsx`.

### Route Definition

Each route file exports a `Route` constant:
```typescript
// frontend/src/routes/_app.properties.tsx, line 14
export const Route = createFileRoute("/_app/properties")({
  head: () => ({ meta: [{ title: "Properties — RentEase" }] }),
  component: PropertiesPage,
});
```

`createFileRoute` ties this component to the `/_app/properties` URL. The `head()` function sets the browser tab title.

---

## 6. How Pages Are Protected

### The Auth Guard

**File:** `frontend/src/routes/_app.tsx`

This file is the critical security layer of the frontend. All protected pages are nested under `_app`, and before any of them render, this code runs:

```typescript
// frontend/src/routes/_app.tsx, line 6
export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    // Check if an access token exists in Zustand store (persisted in localStorage).
    if (!useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
    // Token expiry and refresh is handled automatically by axios.ts interceptor.
  },
  component: AppLayout,
});
```

`beforeLoad` runs before the component renders. If `isAuthenticated()` returns `false` (no token in localStorage), it immediately redirects to `/login`. The user never sees a flash of protected content.

**This means:** Every route prefixed with `_app.` is automatically protected. You cannot visit `/properties`, `/tenants`, `/leases`, or `/payments` without being logged in. The redirect is instant, handled before any rendering occurs.

The comment in the code is important: "Token expiry / cookie validity is handled by the axios interceptor." This means the auth guard only handles "are you logged in at all?" The question "is your token still valid?" is handled differently — the Axios interceptor automatically refreshes expired tokens behind the scenes (see Section 7).

---

## 7. The API Layer

### What is Axios?

**Axios** is a popular JavaScript library for making HTTP requests from the browser to a server. Think of it as a well-organized postal service — you hand it a letter (a request), tell it the address (the API URL), and it delivers the response back to you.

We chose Axios over the browser's built-in `fetch()` API because Axios:
- Automatically converts JSON to/from JavaScript objects.
- Has a better error handling model.
- Supports **interceptors** — middleware that runs on every request or response.

### 7.1 axios.ts — The Core HTTP Client

**File:** `frontend/src/api/axios.ts`

This is the most technically sophisticated file in the frontend. It does three things:

**1. Create the Axios instance with defaults:**
```typescript
// axios.ts, lines 9-13
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,     // e.g., https://property-rental-api.onrender.com/api/v1
  withCredentials: true,     // CRITICAL: tells browser to send the httpOnly cookie
  headers: { "Content-Type": "application/json" },
});
```

`withCredentials: true` is essential — without it, the browser would not send the `refresh_token` cookie to the backend. This single line enables the automatic token refresh.

**2. Request interceptor — Token injection:**
```typescript
// axios.ts, lines 15-19
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;  // Read from Zustand store
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Every single outgoing request automatically gets the `Authorization: Bearer <token>` header added. The developer using the API functions doesn't have to think about authentication — it's handled here, once.

**3. Response interceptor — Automatic token refresh:**

This is the most important piece. When any API call returns a `401 Unauthorized` (token expired):

```typescript
// axios.ts, lines 31-64
api.interceptors.response.use(
  (response) => response,    // Success: pass through unchanged
  async (error: AxiosError) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      // If already refreshing, queue this request and wait
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);  // Retry with new token
        });
      }

      original._retry = true;   // Prevent infinite retry loops
      isRefreshing = true;

      try {
        // Call refresh endpoint (sends the httpOnly cookie automatically)
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.access_token;
        useAuthStore.getState().setAccessToken(newToken);  // Store new token
        processQueue(null, newToken);  // Resume all queued requests
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);  // Retry the original failed request
      } catch (refreshError) {
        // Refresh also failed (user logged out, cookie expired) → force logout
        processQueue(refreshError);
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

**Why is the "failed queue" needed?**
If the user has 5 tabs open, and all 5 tabs try to make an API call at the exact same moment when the token has just expired, all 5 would try to refresh the token simultaneously. The `isRefreshing` flag and `failedQueue` array ensure only one refresh call is made, and the other 4 requests wait in a queue. When the refresh completes, all 5 requests resume with the new token.

### 7.2 auth.api.ts

**File:** `frontend/src/api/auth.api.ts`

Functions that wrap the auth endpoints:

```typescript
export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  refresh: () => axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
};
```

Note that `refresh` uses the raw `axios` (not our `api` instance) to avoid triggering the interceptor recursively — we don't want the refresh call itself to try to refresh.

### 7.3 Other API Files

Each file in `src/api/` follows the same pattern — thin wrapper functions over Axios calls:

- **properties.api.ts** — `list()`, `getById()`, `create()`, `update()`, `delete()`, `listUnits()`, `createUnit()`, `updateUnit()`, `deleteUnit()`
- **tenants.api.ts** — `list()`, `getById()`, `create()`, `update()`, `delete()`, `uploadDocument()`
- **leases.api.ts** — `list()`, `getById()`, `create()`, `update()`, `terminate()`, `uploadAgreement()`, `getDocumentUrl()`
- **payments.api.ts** — `list()`, `getById()`, `create()`, `update()`, `delete()`
- **dashboard.api.ts** — `getDashboard()`

---

## 8. State Management with Zustand

### What is State?

**State** is any data that can change over time in your application and that you want to keep track of. The user's login status ("are they logged in?"), the access token, the owner's name — these are all state.

React components have their own local state (`useState`), but some state needs to be shared across many components. For example, the sidebar navigation needs to know the owner's name, the properties page needs to verify you're authenticated, and the API layer needs the access token. If this state was stored locally in one component, the others couldn't access it.

**Global state management** solves this by creating a single central store that any component can read from or write to.

### What is Zustand?

**Zustand** (German for "state") is a lightweight state management library. It's simpler than the popular Redux, with less boilerplate. Think of it like a shared whiteboard in an office — anyone can read what's on it, anyone can write to it, and everyone sees changes immediately.

### authStore.ts Explained

**File:** `frontend/src/store/authStore.ts`

```typescript
// authStore.ts, full file
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,         // The JWT access token
      owner: null,               // The logged-in owner's profile

      setAccessToken: (token) => set({ accessToken: token }),   // Called after login
      setOwner: (owner) => set({ owner }),                       // Called after fetching /me
      logout: () => set({ accessToken: null, owner: null }),     // Clears both

      isAuthenticated: () => !!get().accessToken,  // True if token exists
    }),
    {
      name: "rentease-auth",                           // localStorage key name
      storage: createJSONStorage(() => localStorage),  // Use localStorage for persistence
      partialize: (state) => ({                        // Only persist these two fields:
        accessToken: state.accessToken,
        owner: state.owner,
      }),
    },
  ),
);
```

**The `persist` middleware** wraps the store and automatically saves it to `localStorage` under the key `"rentease-auth"`. When the browser tab is closed and reopened, Zustand reads the stored value and restores the token. This is how the user stays logged in across browser sessions.

**`partialize`** ensures that only `accessToken` and `owner` are saved — not the functions (`setAccessToken`, `logout`, etc.), which cannot be serialized to JSON.

**Security consideration:** The access token is in localStorage, which is accessible to JavaScript (unlike the httpOnly cookie). This is an intentional trade-off — the access token expires in 15 minutes, so even if somehow compromised, the window of risk is short. The long-lived refresh token stays in the httpOnly cookie, safe from JavaScript.

---

## 9. Data Fetching with TanStack Query

### The Problem with "Raw" API Calls

Without a data-fetching library, you'd write something like this in every component:

```typescript
// Without TanStack Query (naive approach)
function PropertiesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    propertiesApi.list()
      .then(res => setData(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);
  // ... render
}
```

This has problems:
- Duplicated loading/error/data state in every component.
- Data re-fetched every time you navigate back to the page.
- If two components need the same data, two API calls are made.
- After creating a property, the list doesn't automatically update.

### What is TanStack Query (React Query)?

**TanStack Query** (also known as React Query) solves all these problems with a **cache**. Think of it like a smartphone's app cache:

- When you open Instagram, it shows you cached posts immediately while fetching new ones.
- If you switch to another app and come back in 30 seconds, it uses the cache.
- But if you come back after 5 minutes, it refetches to get fresh data.

TanStack Query provides:
- **`useQuery`** — for reading/fetching data (GET requests)
- **`useMutation`** — for creating/updating/deleting data (POST/PATCH/DELETE requests)
- **Automatic caching** — the same data is not fetched twice unnecessarily
- **Cache invalidation** — after a mutation, the relevant cache entries are cleared and refetched

### useQuery vs. useMutation

| Hook | When to use | Example |
|---|---|---|
| `useQuery` | Fetching data to display | Load the list of properties |
| `useMutation` | Changing data on the server | Create a property, delete a tenant |

`useQuery` returns `{ data, isLoading, isError }`.
`useMutation` returns `{ mutate, isPending, isError }`.

### 9.1 useProperties.ts — Detailed Walkthrough

**File:** `frontend/src/hooks/useProperties.ts`

**Query Keys** — the cache identity system:
```typescript
// useProperties.ts, lines 13-19
export const PROPERTY_KEYS = {
  all: ["properties"] as const,
  list: (params?) => [...PROPERTY_KEYS.all, "list", params] as const,
  detail: (id: string) => [...PROPERTY_KEYS.all, "detail", id] as const,
  units: (id: string, params?) => [...PROPERTY_KEYS.all, "units", id, params] as const,
};
```

Query keys are arrays that uniquely identify cached data. `["properties", "list"]` is the cache key for the properties list. `["properties", "detail", "abc123"]` is the cache key for a specific property.

**useProperties hook:**
```typescript
// useProperties.ts, lines 21-26
export function useProperties(params?: { page?: number; city?: string }) {
  return useQuery({
    queryKey: PROPERTY_KEYS.list(params),     // The cache key
    queryFn: () => propertiesApi.list(params), // The function that fetches data
    select: (res) => res.data,                 // Extract the "data" field from the response
  });
}
```

**useCreateProperty — with cache invalidation:**
```typescript
// useProperties.ts, lines 35-42
export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertiesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all });  // ← Cache invalidation
      toast.success("Property added");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to add property")),
  });
}
```

**`qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all })`** — This tells TanStack Query: "Mark any cache entry whose key starts with `['properties']` as stale." The next time any component that uses `useProperties` renders, it automatically refetches fresh data. The user sees the new property in the list immediately after creating it.

**`onError` with special handling:**
```typescript
// useProperties.ts, line 58-62
onError: (err: any) => {
  if (err?.response?.status === 409)
    toast.error("Cannot delete — one or more units have active leases");
  else toast.error(getApiErrorMessage(err, "Failed to delete property"));
},
```

A 409 Conflict from the backend (when trying to delete a property with active leases) is handled gracefully with a specific, user-friendly message.

### 9.2 useAuth.ts Hooks

**File:** `frontend/src/hooks/useAuth.ts`

**useLogin:**
```typescript
// useAuth.ts, lines 10-22
export function useLogin() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  return useMutation({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: async (res) => {
      setAccessToken(res.data.access_token);   // Store token in Zustand
      const me = await authApi.me();           // Fetch owner profile
      useAuthStore.getState().setOwner(me.data);
      toast.success("Welcome back");
      navigate({ to: "/" });                   // Redirect to dashboard
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Invalid credentials")),
  });
}
```

**useLogout:**
```typescript
// useAuth.ts, lines 37-45
export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: () => authApi.logout(),  // Calls backend to delete the cookie
    onSettled: () => {                   // onSettled = runs whether success or error
      logout();                          // Clear Zustand store + localStorage
      navigate({ to: "/login" });        // Redirect to login
    },
  });
}
```

`onSettled` (instead of `onSuccess`) is used because we want to log out locally even if the backend call fails — the cookie might already be gone.

### 9.3 Cache Invalidation — The Ripple Effect

When a user terminates a lease, multiple pieces of data become stale:
- The lease list (the lease now shows "TERMINATED")
- The unit (now shows "VACANT" instead of "OCCUPIED")
- The dashboard (occupancy rate changes, financials change)
- The property detail (occupied_units count changes)

The `useLeases.ts` hooks invalidate all relevant query keys after a termination:
```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: LEASE_KEYS.all });
  qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all });  // Units update
  qc.invalidateQueries({ queryKey: DASHBOARD_KEYS.all }); // Stats update
}
```

This is the "ripple effect" of TanStack Query — one action triggers a cascade of cache invalidations, keeping the entire UI consistent without the developer manually tracking every place that needs updating.

---

## 10. Every Page Explained

### 10.1 Login Page — `/login`

**File:** `frontend/src/routes/login.tsx`

**What it shows:** A centered card with the RentEase logo, an email field, a password field, and a "Sign in" button. A link to the register page is shown below.

**What it does:**
- Uses `react-hook-form` with `zodResolver` for form validation (see Section 11).
- On submit, calls `useLogin()` from `useAuth.ts`.
- Validation schema (lines 23-26):
  ```typescript
  const schema = z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
  });
  ```
- If login succeeds: stores the token, fetches the owner profile, navigates to `/`.
- Button shows "Signing in…" while the request is in flight (disabled with `isPending` check).

**API calls:** `POST /api/v1/auth/login` → `GET /api/v1/auth/me`

### 10.2 Dashboard Page — `/`

**File:** `frontend/src/routes/_app.index.tsx`

**What it shows:** Four statistic cards at the top (properties, total units, occupancy rate, collected revenue). Two cards below: one for overdue payments, one for leases expiring in the next 30 days.

**What it does:**
- Calls `useDashboard()` which fetches `GET /api/v1/dashboard/`.
- While loading, shows skeleton placeholder shapes (animated grey boxes) instead of empty space — better UX.
- The overdue payments card shows tenant name, unit, and amount in red.
- The expiring leases card is clickable — each item is a link to `/leases/:id`.
- Formats currency as Indian Rupees using `formatCurrency()`.

**API calls:** `GET /api/v1/dashboard/`

### 10.3 Properties Page — `/properties`

**File:** `frontend/src/routes/_app.properties.tsx`

**What it shows:** A grid of property cards (2 columns on tablet, 3 columns on desktop). An "Add property" button in the top right.

**What it does:**
- Calls `useProperties()` which fetches `GET /api/v1/properties/`.
- Shows skeleton cards while loading.
- If no properties exist, shows an `EmptyState` component with an illustration and an "Add property" button.
- Clicking "Add property" opens a `Dialog` (modal popup) containing `PropertyForm`.
- `PropertyForm` uses react-hook-form + Zod for validation.
- On successful creation, the dialog closes, the properties list refetches, and a success toast appears.

**API calls:** `GET /api/v1/properties/`, `POST /api/v1/properties/`

### 10.4 Property Detail Page — `/properties/:id`

**File:** `frontend/src/routes/_app.properties.$id.tsx`

**What it shows:** The property's full details (name, address, type, total/occupied units, monthly revenue). A list of all units in the property with their status (VACANT/OCCUPIED/MAINTENANCE) shown as colored badges. Action buttons for editing and deleting the property.

**What it does:**
- Uses the `$id` route parameter (e.g., `/properties/550e8400...`) to call `useProperty(id)`.
- Lists units from the same response (backend embeds units in the property detail).
- Clicking a unit opens an edit dialog.
- Delete property calls `useDeleteProperty()`. If the backend returns 409 (active leases), shows the specific error.
- An "Add unit" button opens a dialog with `UnitForm`.

**API calls:** `GET /api/v1/properties/:id`, `POST /api/v1/properties/:id/units`, `PATCH /api/v1/units/:id`, `DELETE /api/v1/units/:id`

### 10.5 Tenants Page — `/tenants`

**What it shows:** A searchable list of tenants in card format. Each card shows the tenant's name, phone, email, and current lease status.

**What it does:**
- Calls `useTenants()` with an optional `search` parameter (debounced — waits for the user to stop typing before sending a request).
- "Add tenant" button opens a `TenantForm` dialog.
- Clicking a tenant card navigates to `/tenants/:id`.

**API calls:** `GET /api/v1/tenants/?search=...`, `POST /api/v1/tenants/`

### 10.6 Leases Page — `/leases`

**What it shows:** A list of leases with filter tabs (All / Active / Expiring Soon / Expired). Each lease shows the tenant name, unit, rent amount, dates, and status badge.

**What it does:**
- Calls `useLeases()` with optional `status` and `expiring_in_days` filters.
- "New lease" button opens a form where you select a unit and tenant from dropdowns (populated from the API), then set dates, rent, and deposit.
- Active leases have a "Terminate" button which opens a confirmation dialog with a reason field.

**API calls:** `GET /api/v1/leases/`, `POST /api/v1/leases/`, `PATCH /api/v1/leases/:id/terminate`

### 10.7 Payments Page — `/payments`

**What it shows:** A filterable list of all payments. Filter by status (PENDING/PAID/OVERDUE/PARTIAL), by month, and by lease. Each payment shows the tenant, unit, amount due vs. paid, and status badge.

**What it does:**
- Calls `usePayments()` with filters.
- "Record payment" button opens a form where you select a lease and enter amounts.
- Status is computed automatically by the backend based on amounts.

**API calls:** `GET /api/v1/payments/`, `POST /api/v1/payments/`, `PATCH /api/v1/payments/:id`

---

## 11. Forms and Validation

### The Problem

Forms are deceptively complex. You need to:
- Track every field's current value.
- Validate each field (required? valid email? min length?).
- Show error messages under the right fields.
- Disable the submit button while the request is pending.
- Handle server-side errors.

Doing this manually with `useState` for every field would be hundreds of lines of tedious code.

### react-hook-form

**`react-hook-form`** manages form state with minimal re-renders. It uses **uncontrolled inputs** — instead of syncing every keystroke to React state (which re-renders the component on every keypress), it reads values directly from the DOM when needed, making forms much faster.

### Zod — Schema Validation

**Zod** is a TypeScript-first schema validation library. You define a schema describing valid input, and Zod tells you exactly what's wrong.

**Example from login.tsx:**
```typescript
// frontend/src/routes/login.tsx, lines 23-26
const schema = z.object({
  email: z.string().email("Enter a valid email"),    // Must be a valid email format
  password: z.string().min(1, "Password is required"), // Cannot be empty
});
type FormValues = z.infer<typeof schema>;  // TypeScript type automatically derived!
```

`z.infer<typeof schema>` automatically creates a TypeScript type from the schema — you don't write it twice.

### zodResolver — The Bridge

`@hookform/resolvers/zod` connects react-hook-form with Zod:
```typescript
// login.tsx, line 33
const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema)  // When the form is submitted, validate with Zod
});
```

When the user submits, Zod validates the input. If it fails, `errors.email.message` contains `"Enter a valid email"` and we display it under the email field:
```typescript
{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
```

### Full Form Flow

```
User types → react-hook-form tracks values → User clicks Submit
  → zodResolver runs Zod validation
    → If invalid: errors displayed, form NOT submitted
    → If valid: handleSubmit calls our onSubmit function
      → useMutation sends the API call
        → isPending becomes true → button shows "Signing in…"
        → On success: navigate, toast notification
        → On error: toast error message
```

---

## 12. UI Components

### What is shadcn/ui?

**shadcn/ui** is a collection of ready-made, beautiful, accessible UI components. It is NOT a library you install — instead, you copy the component source code directly into your project. This means you own the code and can customise it without limitations.

The components in `frontend/src/components/ui/` include:
- `Button` — styled button with variants (default, outline, ghost, destructive)
- `Card` / `CardContent` / `CardHeader` / `CardTitle` — container components for boxed content
- `Dialog` — modal popup with overlay
- `Input` — styled text input
- `Label` — accessible form labels
- `Select` — dropdown selector
- `Badge` — small colored pill for status indicators
- `Skeleton` — animated grey placeholder shown while data loads
- `Table` — structured data display
- `Tabs` — tabbed interface

**Why shadcn/ui instead of something like Bootstrap or Material UI?**
- Full ownership of the code — nothing can break when a library updates.
- Designed for Tailwind CSS — consistent styling system.
- Radix UI primitives underneath — fully accessible out of the box (keyboard navigation, screen reader support).

### What is Tailwind CSS?

**Tailwind CSS** is a utility-first CSS framework. Instead of writing a CSS file with class names and styles, you apply tiny utility classes directly in your HTML/JSX:

```typescript
// Instead of writing CSS:
// .stat-card { padding: 20px; display: flex; border-radius: 12px; }

// You write classes inline:
<div className="p-5 flex items-center rounded-xl shadow-sm">
```

Every class does one specific thing:
- `p-5` → padding: 20px
- `flex` → display: flex
- `items-center` → align-items: center
- `rounded-xl` → border-radius: 12px
- `text-sm` → font-size: 14px
- `font-semibold` → font-weight: 600
- `text-destructive` → red color (defined in our theme as the "danger" color)

**Responsive design** with Tailwind prefixes:
```typescript
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
```
- Default (mobile): 1 column
- `sm:grid-cols-2` → 2 columns on screens ≥ 640px wide
- `lg:grid-cols-3` → 3 columns on screens ≥ 1024px wide

This single line makes the properties grid responsive without writing a single line of CSS.

### Radix UI

Underneath shadcn/ui components, **Radix UI** primitives handle accessibility. A `Dialog` component automatically:
- Traps keyboard focus inside the dialog when open.
- Allows `Escape` to close it.
- Announces itself to screen readers.
- Manages `aria-*` attributes correctly.

This means our app is accessible to users with disabilities without extra effort.

### Other Libraries

| Library | Purpose |
|---|---|
| `lucide-react` | Icon library — thin, consistent SVG icons used throughout the app |
| `sonner` | Toast notification system — the pop-up messages ("Property added", "Login failed") |
| `date-fns` | Date formatting and manipulation utilities |
| `recharts` | Chart library (for financial charts if needed) |
| `react-day-picker` | Calendar date picker component for date inputs |

---

## 13. Environment Variable

**File:** `frontend/.env`

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

### What is `VITE_API_BASE_URL`?

This is the URL of the backend API server. The frontend uses it to know where to send API requests.

**In `axios.ts`:**
```typescript
// axios.ts, line 7
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
```

- **Development:** `VITE_API_BASE_URL` is not set → defaults to `localhost:8000` (your local machine).
- **Production:** `VITE_API_BASE_URL` is set to the Render backend URL in Vercel's environment settings.

### Why the `VITE_` prefix?

Vite (our build tool) only exposes environment variables to the browser if they start with `VITE_`. This is a security feature — other variables in the `.env` file (like hypothetical API keys) are NOT sent to the browser.

### Local vs. Production

| Environment | VITE_API_BASE_URL value |
|---|---|
| Local development | `http://localhost:8000/api/v1` (defaults) |
| Production (Vercel) | `https://property-rental-api.onrender.com/api/v1` |

This means the same codebase works in both environments — just the environment variable changes.

---

## 14. Deployment on Vercel

**Vercel** is a cloud hosting platform specializing in frontend applications. It is created by the same team that built Next.js and is the recommended hosting platform for React applications.

### How Deployment Works

1. We push code to the `main` branch on GitHub.
2. Vercel detects the new commit automatically via a webhook.
3. Vercel runs the build command: `vite build` (`package.json` line 7).
4. Vite compiles all TypeScript and TSX files into optimized JavaScript.
5. Vite bundles all JavaScript and CSS into a few small files (a process called "bundling").
6. The output (a `dist/` folder with HTML, CSS, and JS files) is deployed to Vercel's global CDN.
7. The app is live, typically within 30-60 seconds.

### What is a CDN?

A **CDN (Content Delivery Network)** is a network of servers distributed around the world. When a user in Mumbai visits the app, they get the files from a Vercel server in India — not from a server in the USA. This makes the initial page load much faster.

### Build Output

After `vite build`, the frontend is pure static files — no server needed. Just HTML, CSS, and JavaScript. Vercel serves these files directly.

### The API Proxy Configuration

The `frontend/api/[...slug].js` file configures Vercel to proxy API requests during development to avoid CORS issues. In production, the `VITE_API_BASE_URL` points directly to Render, and the proxy is not used.

### Environment Variables on Vercel

`VITE_API_BASE_URL` is configured in Vercel's dashboard under Project → Settings → Environment Variables. It is injected at build time (not runtime) — Vite embeds the value directly into the compiled JavaScript.

### SPA Fallback

For a Single Page Application, ALL URL paths (like `/properties`, `/leases`, `/login`) need to return the same `index.html`. Vercel is configured to serve `index.html` for any path that doesn't correspond to a file, letting TanStack Router handle the routing client-side.

---

*This document covers the complete frontend architecture of the RentEase Property Rental Management System. Every file referenced exists at the path shown. All code snippets are taken directly from the actual source files.*
