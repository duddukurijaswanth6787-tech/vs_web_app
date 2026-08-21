import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  InventoryQueryDto,
  InventoryListResponse,
  StockSummaryResponse,
  MovementQueryDto,
  MovementListResponse,
  InventoryResponse,
  CreateInventoryDto,
  UpdateInventoryDto,
  StockMovementDto,
  AdjustStockDto,
} from './inventory.types';

export const inventoryService = {
  findAll: async (query: InventoryQueryDto = {}): Promise<InventoryListResponse> => {
    const response = await apiClient.get<StandardResponse<InventoryListResponse>>('/inventory', { params: query });
    return response.data.data!;
  },

  getStockSummary: async (): Promise<StockSummaryResponse> => {
    const response = await apiClient.get<StandardResponse<StockSummaryResponse>>('/inventory/summary');
    return response.data.data!;
  },

  findMovements: async (query: MovementQueryDto = {}): Promise<MovementListResponse> => {
    const response = await apiClient.get<StandardResponse<MovementListResponse>>('/inventory/movements', {
      params: query,
    });
    return response.data.data!;
  },

  findById: async (id: string): Promise<InventoryResponse> => {
    const response = await apiClient.get<StandardResponse<InventoryResponse>>(`/inventory/${id}`);
    return response.data.data!;
  },

  findByVariantId: async (variantId: string): Promise<InventoryResponse> => {
    const response = await apiClient.get<StandardResponse<InventoryResponse>>(`/inventory/variant/${variantId}`);
    return response.data.data!;
  },

  create: async (dto: CreateInventoryDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>('/inventory', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateInventoryDto): Promise<InventoryResponse> => {
    const response = await apiClient.patch<StandardResponse<InventoryResponse>>(`/inventory/${id}`, dto);
    return response.data.data!;
  },

  increaseStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/increase`, dto);
    return response.data.data!;
  },

  decreaseStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/decrease`, dto);
    return response.data.data!;
  },

  adjustStock: async (id: string, dto: AdjustStockDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/adjust`, dto);
    return response.data.data!;
  },

  reserveStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/reserve`, dto);
    return response.data.data!;
  },

  releaseStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/release`, dto);
    return response.data.data!;
  },

  returnStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/return`, dto);
    return response.data.data!;
  },

  damageStock: async (id: string, dto: StockMovementDto): Promise<InventoryResponse> => {
    const response = await apiClient.post<StandardResponse<InventoryResponse>>(`/inventory/${id}/damage`, dto);
    return response.data.data!;
  },

  /**
   * Set stock for a variant by variantId, opening an inventory record when the
   * variant has none yet, otherwise raising the existing one. There is no POST
   * /inventory/stock-in endpoint on the API, only /inventory (create) and
   * /inventory/:id/increase, so this resolves which one applies first.
   *
   * "Not found" here is HTTP 422, not 404 — GET /inventory/variant/:variantId
   * throws BusinessException('Inventory not found for variant', 'INVENTORY_001'),
   * and BusinessException is mapped to 422 Unprocessable Entity, not 404.
   */
  stockIn: async (
    variantId: string,
    quantity: number,
    reason?: string,
    thresholds?: { minimumStock?: number; reorderLevel?: number },
    remarks?: string,
  ): Promise<InventoryResponse> => {
    let existing: InventoryResponse | null = null;
    try {
      existing = await inventoryService.findByVariantId(variantId);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 422 && status !== 404) throw err;
    }
    if (!existing?.id) {
      return inventoryService.create({ variantId, availableQuantity: quantity, ...thresholds, reason, remarks });
    }
    if (quantity <= 0) return existing;
    return inventoryService.increaseStock(existing.id, { quantity, reason, remarks });
  },
};
