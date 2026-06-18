# Frontend — Property Rental Management System

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | latest | Accessible component library |
| TanStack Query | 5.x | Server state, caching, refetch |
| React Router | 6 | SPA routing |
| Axios | 1.x | HTTP client with interceptors |
| React Hook Form | 7.x | Form state + validation |
| Zod | 3.x | Runtime schema validation |
| date-fns | 3.x | Date formatting |
| lucide-react | latest | Icons |
| zustand | 4.x | Auth state (in-memory, no localStorage) |

---

## Environment Variables

```env
# .env.local (dev)
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=RentEase

# .env.production (used at Vercel/Netlify build time — set in platform dashboard, not in this file)
VITE_API_BASE_URL=https://rental-api.onrender.com/api/v1
VITE_APP_NAME=RentEase
```

> **Do not commit `.env.production`** — set `VITE_API_BASE_URL` directly in the Vercel/Netlify environment variables UI. The build process inlines it at build time.

---

## Folder Structure

```
src/
├── api/
│   ├── axios.ts              # Axios instance + interceptors
│   ├── auth.api.ts
│   ├── properties.api.ts
│   ├── tenants.api.ts
│   ├── leases.api.ts
│   ├── payments.api.ts
│   └── dashboard.api.ts
├── components/
│   ├── ui/                   # shadcn base components (auto-generated)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── AppLayout.tsx
│   └── features/
│       ├── properties/
│       │   ├── PropertyCard.tsx
│       │   └── PropertyForm.tsx
│       ├── tenants/
│       │   ├── TenantRow.tsx
│       │   └── TenantForm.tsx
│       ├── leases/
│       │   ├── LeaseCard.tsx
│       │   └── LeaseForm.tsx
│       └── payments/
│           ├── PaymentRow.tsx
│           └── PaymentForm.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProperties.ts
│   ├── useTenants.ts
│   ├── useLeases.ts
│   └── usePayments.ts
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Properties.tsx
│   ├── PropertyDetail.tsx
│   ├── Tenants.tsx
│   ├── TenantDetail.tsx
│   ├── Leases.tsx
│   ├── LeaseDetail.tsx
│   └── Payments.tsx
├── store/
│   └── authStore.ts          # Zustand — in-memory, no localStorage
├── types/
│   ├── api.types.ts          # All TypeScript interfaces (mirrors backend Pydantic schemas)
│   └── common.types.ts
├── utils/
│   ├── formatCurrency.ts
│   ├── formatDate.ts
│   └── cn.ts
└── router/
    ├── index.tsx
    └── ProtectedRoute.tsx
```

---

## TypeScript Types — API Contract

These interfaces exactly mirror the backend Pydantic response schemas. Never assume a field exists — if it is not here, the backend does not send it.

```typescript
// src/types/api.types.ts

export type PropertyType   = 'RESIDENTIAL' | 'COMMERCIAL';
export type UnitType       = '1BHK' | '2BHK' | '3BHK' | 'STUDIO' | 'SHOP' | 'OFFICE';
export type UnitStatus     = 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
export type LeaseStatus    = 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
export type PaymentStatus  = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
export type PaymentMethod  = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
export type IdType         = 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface Owner {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  property_type: PropertyType;
  total_units: number;
  occupied_units: number;
  monthly_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyPayload {
  name: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  property_type: PropertyType;
  total_units: number;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export interface CurrentTenantSummary {
  id: string;
  full_name: string;
  phone: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: number | null;
  area_sqft: number | null;
  unit_type: UnitType;
  monthly_rent: number;
  deposit_amount: number;
  status: UnitStatus;
  amenities: string[];
  current_tenant: CurrentTenantSummary | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUnitPayload {
  unit_number: string;
  floor?: number;
  area_sqft?: number;
  unit_type: UnitType;
  monthly_rent: number;
  deposit_amount: number;
  amenities?: string[];
}

export type UpdateUnitPayload = Partial<CreateUnitPayload>;

export interface Tenant {
  id: string;
  owner_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  id_type: IdType | null;
  id_number: string | null;
  id_document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantPayload {
  full_name: string;
  email?: string;
  phone: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  id_type?: IdType;
  id_number?: string;
  notes?: string;
}

export type UpdateTenantPayload = Partial<CreateTenantPayload>;

export interface PaymentsSummary {
  total_due: number;
  total_paid: number;
  overdue_amount: number;
}

export interface UnitSummary {
  id: string;
  unit_number: string;
  property_name: string;
  property_id: string;
}

export interface TenantSummary {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
}

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  unit: UnitSummary;
  tenant: TenantSummary;
  start_date: string;         // YYYY-MM-DD
  end_date: string;           // YYYY-MM-DD
  monthly_rent: number;
  deposit_paid: number;
  rent_due_day: number;
  status: LeaseStatus;
  agreement_url: string | null;
  notes: string | null;
  payments_summary: PaymentsSummary;
  created_at: string;
  updated_at: string;
}

export interface CreateLeasePayload {
  unit_id: string;
  tenant_id: string;
  start_date: string;         // YYYY-MM-DD
  end_date: string;           // YYYY-MM-DD
  monthly_rent: number;
  deposit_paid: number;
  rent_due_day?: number;
  notes?: string;
}

export interface TerminateLeasePayload {
  reason: string;
  termination_date: string;   // YYYY-MM-DD
}

export interface Payment {
  id: string;
  lease_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;           // YYYY-MM-DD
  paid_date: string | null;
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface CreatePaymentPayload {
  lease_id: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;           // YYYY-MM-DD
  paid_date?: string;
  payment_method?: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

export type UpdatePaymentPayload = Partial<Omit<CreatePaymentPayload, 'lease_id'>>;

export interface DashboardSummary {
  total_properties: number;
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  occupancy_rate: number;     // 0–100
}

export interface DashboardFinancials {
  current_month_expected: number;
  current_month_collected: number;
  overdue_amount: number;
  overdue_count: number;
}

export interface ExpiringLease {
  lease_id: string;
  tenant_name: string;
  unit: string;
  end_date: string;
  days_remaining: number;
}

export interface OverduePayment {
  payment_id: string;
  tenant_name: string;
  unit: string;
  overdue_days: number;
  amount: number;
}

export interface DashboardAlerts {
  leases_expiring_soon: ExpiringLease[];
  overdue_payments: OverduePayment[];
}

export interface Dashboard {
  summary: DashboardSummary;
  financials: DashboardFinancials;
  alerts: DashboardAlerts;
}

export interface ApiError {
  detail: string;
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
}
```

---

## Axios Instance + Token Interceptors

```typescript
// src/api/axios.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,   // sends httpOnly refresh token cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from memory store to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: silent token refresh once, then retry original request
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.access_token;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Auth Store (Zustand)

Access token is stored **in memory only** — no localStorage, no sessionStorage. It is lost on page refresh; the httpOnly cookie silently restores it via the refresh interceptor above.

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { Owner } from '../types/api.types';

interface AuthState {
  accessToken: string | null;
  owner: Owner | null;
  setAccessToken: (token: string) => void;
  setOwner: (owner: Owner) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  owner: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setOwner: (owner) => set({ owner }),
  logout: () => set({ accessToken: null, owner: null }),
  isAuthenticated: () => !!get().accessToken,
}));
```

---

## API Call Functions

### Auth

```typescript
// src/api/auth.api.ts
import api from './axios';
import axios from 'axios';
import { ApiResponse, LoginResponse, Owner } from '../types/api.types';

export const authApi = {
  register: async (payload: { email: string; password: string; full_name: string; phone?: string }): Promise<ApiResponse<Owner>> => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  login: async (payload: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  refresh: async (): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
    return data;
  },
};
```

### Properties & Units

```typescript
// src/api/properties.api.ts
import api from './axios';
import { ApiResponse, PaginatedResponse, Property, Unit,
         CreatePropertyPayload, UpdatePropertyPayload,
         CreateUnitPayload, UpdateUnitPayload } from '../types/api.types';

export const propertiesApi = {
  list: async (params?: { page?: number; limit?: number; city?: string }): Promise<ApiResponse<PaginatedResponse<Property>>> => {
    const { data } = await api.get('/properties', { params }); return data;
  },
  create: async (payload: CreatePropertyPayload): Promise<ApiResponse<Property>> => {
    const { data } = await api.post('/properties', payload); return data;
  },
  getById: async (propertyId: string): Promise<ApiResponse<Property & { units: Unit[] }>> => {
    const { data } = await api.get(`/properties/${propertyId}`); return data;
  },
  update: async (propertyId: string, payload: UpdatePropertyPayload): Promise<ApiResponse<Property>> => {
    const { data } = await api.patch(`/properties/${propertyId}`, payload); return data;
  },
  delete: async (propertyId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/properties/${propertyId}`); return data;
  },
  listUnits: async (propertyId: string, params?: { status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' }): Promise<ApiResponse<Unit[]>> => {
    const { data } = await api.get(`/properties/${propertyId}/units`, { params }); return data;
  },
  createUnit: async (propertyId: string, payload: CreateUnitPayload): Promise<ApiResponse<Unit>> => {
    const { data } = await api.post(`/properties/${propertyId}/units`, payload); return data;
  },
  getUnit: async (unitId: string): Promise<ApiResponse<Unit>> => {
    const { data } = await api.get(`/units/${unitId}`); return data;
  },
  updateUnit: async (unitId: string, payload: UpdateUnitPayload): Promise<ApiResponse<Unit>> => {
    const { data } = await api.patch(`/units/${unitId}`, payload); return data;
  },
  deleteUnit: async (unitId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/units/${unitId}`); return data;
  },
};
```

### Tenants

```typescript
// src/api/tenants.api.ts
import api from './axios';
import { ApiResponse, PaginatedResponse, Tenant, CreateTenantPayload, UpdateTenantPayload } from '../types/api.types';

export const tenantsApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Tenant>>> => {
    const { data } = await api.get('/tenants', { params }); return data;
  },
  create: async (payload: CreateTenantPayload): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.post('/tenants', payload); return data;
  },
  getById: async (tenantId: string): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.get(`/tenants/${tenantId}`); return data;
  },
  update: async (tenantId: string, payload: UpdateTenantPayload): Promise<ApiResponse<Tenant>> => {
    const { data } = await api.patch(`/tenants/${tenantId}`, payload); return data;
  },
  delete: async (tenantId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/tenants/${tenantId}`); return data;
  },
  uploadDocument: async (tenantId: string, file: File): Promise<ApiResponse<{ document_url: string; presigned_url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/tenants/${tenantId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },
};
```

### Leases

```typescript
// src/api/leases.api.ts
import api from './axios';
import { ApiResponse, PaginatedResponse, Lease, CreateLeasePayload, TerminateLeasePayload } from '../types/api.types';

export const leasesApi = {
  list: async (params?: { status?: 'ACTIVE' | 'EXPIRED' | 'TERMINATED'; expiring_in_days?: number; unit_id?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Lease>>> => {
    const { data } = await api.get('/leases', { params }); return data;
  },
  create: async (payload: CreateLeasePayload): Promise<ApiResponse<Lease>> => {
    const { data } = await api.post('/leases', payload); return data;
  },
  getById: async (leaseId: string): Promise<ApiResponse<Lease>> => {
    const { data } = await api.get(`/leases/${leaseId}`); return data;
  },
  update: async (leaseId: string, payload: Partial<Pick<CreateLeasePayload, 'notes' | 'end_date'>>): Promise<ApiResponse<Lease>> => {
    const { data } = await api.patch(`/leases/${leaseId}`, payload); return data;
  },
  terminate: async (leaseId: string, payload: TerminateLeasePayload): Promise<ApiResponse<Lease>> => {
    const { data } = await api.patch(`/leases/${leaseId}/terminate`, payload); return data;
  },
  uploadAgreement: async (leaseId: string, file: File): Promise<ApiResponse<{ document_url: string; presigned_url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/leases/${leaseId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },
  getDocumentUrl: async (leaseId: string): Promise<ApiResponse<{ presigned_url: string }>> => {
    const { data } = await api.get(`/leases/${leaseId}/documents`); return data;
  },
};
```

### Payments

```typescript
// src/api/payments.api.ts
import api from './axios';
import { ApiResponse, PaginatedResponse, Payment, CreatePaymentPayload, UpdatePaymentPayload } from '../types/api.types';

export const paymentsApi = {
  list: async (params?: { status?: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'; lease_id?: string; month?: string; page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Payment>>> => {
    const { data } = await api.get('/payments', { params }); return data;
  },
  create: async (payload: CreatePaymentPayload): Promise<ApiResponse<Payment>> => {
    const { data } = await api.post('/payments', payload); return data;
  },
  getById: async (paymentId: string): Promise<ApiResponse<Payment>> => {
    const { data } = await api.get(`/payments/${paymentId}`); return data;
  },
  update: async (paymentId: string, payload: UpdatePaymentPayload): Promise<ApiResponse<Payment>> => {
    const { data } = await api.patch(`/payments/${paymentId}`, payload); return data;
  },
  delete: async (paymentId: string): Promise<ApiResponse<null>> => {
    const { data } = await api.delete(`/payments/${paymentId}`); return data;
  },
};
```

### Dashboard

```typescript
// src/api/dashboard.api.ts
import api from './axios';
import { ApiResponse, Dashboard } from '../types/api.types';

export const dashboardApi = {
  get: async (): Promise<ApiResponse<Dashboard>> => {
    const { data } = await api.get('/dashboard'); return data;
  },
};
```

---

## TanStack Query Hooks

```typescript
// src/hooks/useProperties.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../api/properties.api';
import { CreatePropertyPayload, UpdatePropertyPayload } from '../types/api.types';
import { toast } from 'sonner';

export const PROPERTY_KEYS = {
  all:    ['properties'] as const,
  list:   (params?: object) => [...PROPERTY_KEYS.all, 'list', params] as const,
  detail: (id: string)     => [...PROPERTY_KEYS.all, 'detail', id]   as const,
};

export function useProperties(params?: { page?: number; city?: string }) {
  return useQuery({
    queryKey: PROPERTY_KEYS.list(params),
    queryFn: () => propertiesApi.list(params),
    select: res => res.data,
  });
}

export function useProperty(propertyId: string) {
  return useQuery({
    queryKey: PROPERTY_KEYS.detail(propertyId),
    queryFn: () => propertiesApi.getById(propertyId),
    select: res => res.data,
    enabled: !!propertyId,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) => propertiesApi.create(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all }); toast.success('Property added'); },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to add property'),
  });
}

export function useUpdateProperty(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePropertyPayload) => propertiesApi.update(propertyId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.detail(propertyId) });
      qc.invalidateQueries({ queryKey: PROPERTY_KEYS.list() });
      toast.success('Property updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail ?? 'Failed to update property'),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => propertiesApi.delete(propertyId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PROPERTY_KEYS.all }); toast.success('Property deleted'); },
    onError: (err: any) => {
      if (err.response?.status === 409) toast.error('Cannot delete — one or more units have active leases');
      else toast.error(err.response?.data?.detail ?? 'Failed to delete property');
    },
  });
}

// Follow the same pattern for useTenants.ts, useLeases.ts, usePayments.ts
```

---

## Router Setup

```typescript
// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Properties from '../pages/Properties';
import PropertyDetail from '../pages/PropertyDetail';
import Tenants from '../pages/Tenants';
import TenantDetail from '../pages/TenantDetail';
import Leases from '../pages/Leases';
import LeaseDetail from '../pages/LeaseDetail';
import Payments from '../pages/Payments';

export const router = createBrowserRouter([
  { path: '/login',    element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/',                element: <Dashboard /> },
        { path: '/properties',      element: <Properties /> },
        { path: '/properties/:id',  element: <PropertyDetail /> },
        { path: '/tenants',         element: <Tenants /> },
        { path: '/tenants/:id',     element: <TenantDetail /> },
        { path: '/leases',          element: <Leases /> },
        { path: '/leases/:id',      element: <LeaseDetail /> },
        { path: '/payments',        element: <Payments /> },
      ],
    }],
  },
]);
```

```typescript
// src/router/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
```

---

## Deployment Configuration Files

These files sit at the **root of the `frontend/` folder** (or repo root if it's a monorepo).

### For Vercel — `vercel.json`

Vercel automatically handles SPA routing for Vite projects, but adding this file makes it explicit and also sets security headers:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "DENY" },
        { "key": "Referrer-Policy",        "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### For Netlify — `netlify.toml`

Netlify does NOT automatically handle SPA routing — this file is required:

```toml
[build]
  command     = "npm run build"
  publish     = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options        = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy        = "strict-origin-when-cross-origin"
```

### `vite.config.ts` — no changes needed

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

---

## Key Commands

```bash
# Install
npm install

# Dev server (connects to localhost:8000 backend)
npm run dev

# Type check
npx tsc --noEmit

# Build for production (VITE_API_BASE_URL injected from env)
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint
```

---

## Integration Checklist

- [ ] `VITE_API_BASE_URL` is set in the Vercel/Netlify dashboard environment variables (not committed to repo)
- [ ] Local `.env.local` points to `http://localhost:8000/api/v1`
- [ ] Backend CORS `allow_origins` includes both the local Vite URL and the production Vercel/Netlify URL
- [ ] `vercel.json` or `netlify.toml` is present — without it, page refresh on any route returns a 404
- [ ] All date fields sent as `YYYY-MM-DD` strings (not JS Date objects)
- [ ] All money fields sent as numbers (`12000` not `"12000"`)
- [ ] `withCredentials: true` on the Axios instance (required for httpOnly cookie-based refresh)
- [ ] File uploads use `multipart/form-data` header (set per-request via formData, not globally)
- [ ] Query invalidation keys match exactly across hooks — mismatched keys cause stale data
- [ ] Auth store is in-memory only (no localStorage calls) — refresh interceptor handles page reloads
