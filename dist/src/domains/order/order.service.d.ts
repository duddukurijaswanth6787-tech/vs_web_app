import { OrderRepository } from './order.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderQueryDto, OrderResponse } from './order.types';
export declare class OrderService {
    private readonly orderRepository;
    private readonly workflow;
    constructor(orderRepository: OrderRepository, workflow: OrderWorkflowService);
    private toResponse;
    findAll(query: OrderQueryDto, includeAdminFields?: boolean): Promise<{
        data: OrderResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string, includeAdminFields?: boolean): Promise<OrderResponse>;
    findByOrderNumber(orderNumber: string): Promise<OrderResponse>;
    findByCustomerId(customerId: string, query: OrderQueryDto): Promise<{
        data: OrderResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    updateStatus(id: string, status: string, userId: string, message?: string): Promise<OrderResponse>;
}
