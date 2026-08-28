import { PrismaService } from "../../database/prisma.service";
export declare class FeatureGateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    isEnabled(key: string): Promise<boolean>;
    assertEnabled(key: string, featureName?: string): Promise<void>;
}
