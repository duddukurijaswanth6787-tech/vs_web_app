export interface SystemInfo {
    os: string;
    arch: string;
    cpu: string;
    memory: string;
    pid: number;
    gitBranch: string;
    gitCommit: string;
}
export declare class StartupInfoService {
    getSystemInfo(): SystemInfo;
    private getOsName;
    private getCpuModel;
    private getMemoryUsage;
    private getGitBranch;
    private getGitCommit;
}
