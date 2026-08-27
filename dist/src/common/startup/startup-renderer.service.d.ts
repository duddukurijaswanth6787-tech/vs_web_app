import { SystemHealth } from './startup-health.service';
import { SystemInfo } from './startup-info.service';
export interface DashboardData {
    env: string;
    version: string;
    nodeVersion: string;
    nestVersion: string;
    pid: number;
    startupTime: string;
    hostname: string;
    port: number;
    apiPrefix: string;
    swaggerEnabled: boolean;
    healthEnabled: boolean;
    health: SystemHealth;
    aiAgents: {
        name: string;
        status: string;
    }[];
    system: SystemInfo;
    modules: string[];
}
export declare class StartupRendererService {
    private readonly W;
    render(data: DashboardData): string;
    private header;
    private appSection;
    private serverSection;
    private databaseSection;
    private infrastructureSection;
    private aiSection;
    private modulesSection;
    private systemSection;
    private endpointsSection;
    private footer;
    private sectionHeader;
    private row;
    private separator;
    private headerBorder;
    private dblBorder;
    private centerLine;
    private capitalize;
}
