import { ownerApi } from '@/stores/ownerAuthStore'
import type { ApiResponse } from '@/types/common'
import type { Dashboard } from '@/types/owner'

export const dashboardApi = {
  get: async () => {
    const { data } = await ownerApi.get<ApiResponse<Dashboard>>('/dashboard/')
    return data
  },
}
