import { Injectable } from '@nestjs/common';
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
  aiAgents: { name: string; status: string }[];
  system: SystemInfo;
  modules: string[];
}

@Injectable()
export class StartupRendererService {
  private readonly W = 70;

  render(data: DashboardData): string {
    const sections = [
      this.header(),
      this.appSection(data),
      this.serverSection(data),
      this.databaseSection(data.health),
      this.infrastructureSection(data.health),
      this.aiSection(data.aiAgents),
      this.modulesSection(data.modules),
      this.systemSection(data.system),
      this.endpointsSection(data),
      this.footer(),
    ];
    return sections.join('\n');
  }

  private header(): string {
    return [
      '',
      this.headerBorder(),
      this.centerLine('VASANTHI DESIGNERS BACKEND'),
      this.centerLine('Enterprise Commerce Platform'),
      this.dblBorder(),
    ].join('\n');
  }

  private appSection(d: DashboardData): string {
    return [
      '',
      this.sectionHeader('APPLICATION'),
      this.row('Status', 'Running'),
      this.row('Environment', this.capitalize(d.env)),
      this.row('Version', d.version),
      this.row('Node', d.nodeVersion),
      this.row('NestJS', d.nestVersion),
      this.row('PID', String(d.pid)),
      this.row('Startup Time', d.startupTime),
      this.separator(),
    ].join('\n');
  }

  private serverSection(d: DashboardData): string {
    return [
      '',
      this.sectionHeader('SERVER'),
      this.row('Host', d.hostname),
      this.row('Port', String(d.port)),
      this.row('API Base', `/${d.apiPrefix}`),
      this.row('Swagger', d.swaggerEnabled ? 'Enabled' : 'Disabled'),
      this.row('Health', d.healthEnabled ? 'Enabled' : 'Disabled'),
      this.separator(),
    ].join('\n');
  }

  private databaseSection(h: SystemHealth): string {
    return [
      '',
      this.sectionHeader('DATABASE'),
      this.row('PostgreSQL', h.postgres),
      this.row('Prisma', h.prisma),
      this.row('Migration', h.migration),
      this.separator(),
    ].join('\n');
  }

  private infrastructureSection(h: SystemHealth): string {
    return [
      '',
      this.sectionHeader('INFRASTRUCTURE'),
      this.row('Redis', h.redis),
      this.row('Queue', h.queue),
      this.row('Storage', h.storage),
      this.row('Scheduler', h.scheduler),
      this.row('Socket', h.socket),
      this.separator(),
    ].join('\n');
  }

  private aiSection(agents: { name: string; status: string }[]): string {
    const lines = ['', this.sectionHeader('AI SERVICES')];
    for (const agent of agents) {
      lines.push(this.row(agent.name, agent.status));
    }
    lines.push(this.row('Total Agents', String(agents.length)));
    lines.push(this.separator());
    return lines.join('\n');
  }

  private modulesSection(modules: string[]): string {
    const lines = ['', this.sectionHeader('BUSINESS MODULES')];
    const cols = 3;
    const colW = 22;
    for (let i = 0; i < modules.length; i += cols) {
      const row = modules
        .slice(i, i + cols)
        .map((m) => m.padEnd(colW))
        .join('');
      lines.push(`  ${row}`);
    }
    lines.push(this.separator());
    return lines.join('\n');
  }

  private systemSection(s: SystemInfo): string {
    return [
      '',
      this.sectionHeader('SYSTEM'),
      this.row('OS', s.os),
      this.row('Architecture', s.arch),
      this.row('CPU', s.cpu),
      this.row('Memory', s.memory),
      this.row('Git Branch', s.gitBranch),
      this.row('Commit', s.gitCommit),
      this.separator(),
    ].join('\n');
  }

  private endpointsSection(d: DashboardData): string {
    const base = `http://${d.hostname}:${d.port}`;
    const lines = ['', this.sectionHeader('ENDPOINTS')];
    lines.push(this.row('API', `${base}/${d.apiPrefix}`));
    if (d.swaggerEnabled) {
      lines.push(this.row('Swagger', `${base}/api/docs`));
    }
    if (d.healthEnabled) {
      lines.push(this.row('Health', `${base}/health`));
    }
    lines.push(this.separator());
    return lines.join('\n');
  }

  private footer(): string {
    return [
      '',
      this.dblBorder(),
      this.centerLine('Backend Started Successfully'),
      this.centerLine('Ready to accept requests...'),
      this.dblBorder(),
      '',
    ].join('\n');
  }

  private sectionHeader(title: string): string {
    return `  \x1b[1m${title}\x1b[0m\n  ${'─'.repeat(this.W - 4)}`;
  }

  private row(label: string, value: string): string {
    return `  ${label.padEnd(30)}${value}`;
  }

  private separator(): string {
    return `  ${'─'.repeat(this.W - 4)}`;
  }

  private headerBorder(): string {
    return `╔${'═'.repeat(this.W - 2)}╗`;
  }

  private dblBorder(): string {
    return `╚${'═'.repeat(this.W - 2)}╝`;
  }

  private centerLine(text: string): string {
    const inner = this.W - 4;
    const left = Math.floor((inner - text.length) / 2);
    const right = inner - text.length - left;
    return `║${' '.repeat(left)}${text}${' '.repeat(right)}║`;
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
