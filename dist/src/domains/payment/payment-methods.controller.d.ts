import { PrismaService } from "../../database/prisma.service";
export declare class PaymentMethodsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMethods(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        code: string;
        title: string;
        description: string;
        enabled: boolean;
        displayOrder: number;
        icon: string;
        minAmount: number;
        maxAmount: number;
    }[]>>;
}
