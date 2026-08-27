"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupRendererService = void 0;
const common_1 = require("@nestjs/common");
let StartupRendererService = class StartupRendererService {
    W = 70;
    render(data) {
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
    header() {
        return [
            '',
            this.headerBorder(),
            this.centerLine('VASANTHI DESIGNERS BACKEND'),
            this.centerLine('Enterprise Commerce Platform'),
            this.dblBorder(),
        ].join('\n');
    }
    appSection(d) {
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
    serverSection(d) {
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
    databaseSection(h) {
        return [
            '',
            this.sectionHeader('DATABASE'),
            this.row('PostgreSQL', h.postgres),
            this.row('Prisma', h.prisma),
            this.row('Migration', h.migration),
            this.separator(),
        ].join('\n');
    }
    infrastructureSection(h) {
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
    aiSection(agents) {
        const lines = ['', this.sectionHeader('AI SERVICES')];
        for (const agent of agents) {
            lines.push(this.row(agent.name, agent.status));
        }
        lines.push(this.row('Total Agents', String(agents.length)));
        lines.push(this.separator());
        return lines.join('\n');
    }
    modulesSection(modules) {
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
    systemSection(s) {
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
    endpointsSection(d) {
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
    footer() {
        return [
            '',
            this.dblBorder(),
            this.centerLine('Backend Started Successfully'),
            this.centerLine('Ready to accept requests...'),
            this.dblBorder(),
            '',
        ].join('\n');
    }
    sectionHeader(title) {
        return `  \x1b[1m${title}\x1b[0m\n  ${'─'.repeat(this.W - 4)}`;
    }
    row(label, value) {
        return `  ${label.padEnd(30)}${value}`;
    }
    separator() {
        return `  ${'─'.repeat(this.W - 4)}`;
    }
    headerBorder() {
        return `╔${'═'.repeat(this.W - 2)}╗`;
    }
    dblBorder() {
        return `╚${'═'.repeat(this.W - 2)}╝`;
    }
    centerLine(text) {
        const inner = this.W - 4;
        const left = Math.floor((inner - text.length) / 2);
        const right = inner - text.length - left;
        return `║${' '.repeat(left)}${text}${' '.repeat(right)}║`;
    }
    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
};
exports.StartupRendererService = StartupRendererService;
exports.StartupRendererService = StartupRendererService = __decorate([
    (0, common_1.Injectable)()
], StartupRendererService);
//# sourceMappingURL=startup-renderer.service.js.map