import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import {
  ACCURACY_RULE,
  DEFAULT_TEMPLATES,
  PROMPT_TYPES,
  PROMPT_VARIABLES,
  PromptTemplate,
  PromptType,
  UpdatePromptTemplateDto,
  unsupportedVariables,
} from './ai-prompt.types';

/**
 * Prompt templates live in AppSetting rather than their own table: there are
 * eight of them, they are read together and saved one at a time from one
 * screen, and the project already has a settings store. A table plus a
 * repository plus a migration would buy nothing here.
 *
 * ponytail: history is capped at the last 10 versions per type. If anyone ever
 * needs a full audit trail, the audit log already records every change --
 * promote history to its own table then.
 */
const TEMPLATES_KEY = 'ai.prompt.templates';
const HISTORY_KEY = 'ai.prompt.templates.history';
const MAX_HISTORY = 10;

type Stored = Partial<Record<PromptType, PromptTemplate>>;
type History = Partial<Record<PromptType, PromptTemplate[]>>;

@Injectable()
export class AiPromptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async readJson<T>(key: string, fallback: T): Promise<T> {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    if (!row?.value) return fallback;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      // A malformed blob must not take prompt generation down; the built-in
      // templates are a working set.
      return fallback;
    }
  }

  private async writeJson(key: string, value: unknown, description: string) {
    await this.prisma.appSetting.upsert({
      where: { key },
      create: {
        key,
        value: JSON.stringify(value),
        type: 'JSON',
        group: 'ai',
        description,
      },
      update: { value: JSON.stringify(value) },
    });
  }

  /** Saved templates over the built-in defaults, in a stable order. */
  async list(): Promise<PromptTemplate[]> {
    const stored = await this.readJson<Stored>(TEMPLATES_KEY, {});
    return PROMPT_TYPES.map((type) => ({
      ...DEFAULT_TEMPLATES[type],
      ...(stored[type] ?? {}),
      type,
    }));
  }

  async get(type: string): Promise<PromptTemplate> {
    const found = (await this.list()).find((t) => t.type === type);
    if (!found) {
      throw new BusinessException(
        `Unknown prompt type "${type}"`,
        'AI_PROMPT_UNKNOWN_TYPE',
      );
    }
    return found;
  }

  async listWithMeta() {
    return {
      templates: await this.list(),
      variables: [...PROMPT_VARIABLES],
      accuracyRule: ACCURACY_RULE,
    };
  }

  async update(userId: string, type: string, dto: UpdatePromptTemplateDto) {
    const current = await this.get(type);
    const next: PromptTemplate = {
      ...current,
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.template !== undefined ? { template: dto.template } : {}),
      ...(dto.rules !== undefined ? { rules: dto.rules } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    if (!next.name) {
      throw new BusinessException(
        'Template name is required',
        'AI_PROMPT_NAME_REQUIRED',
      );
    }
    if (!next.template.trim()) {
      throw new BusinessException(
        'Template content is required',
        'AI_PROMPT_TEMPLATE_REQUIRED',
      );
    }

    // A broken template must not be able to go live. Editing an inactive one
    // is allowed -- that is how you fix it before switching it back on.
    if (next.status === 'ACTIVE') {
      const unknown = unsupportedVariables(next.template);
      if (unknown.length > 0) {
        throw new BusinessException(
          `Unsupported variable: ${unknown.map((v) => `{{${v}}}`).join(', ')}`,
          'AI_PROMPT_UNSUPPORTED_VARIABLE',
        );
      }
      if (!next.template.includes('{{product_fields}}')) {
        // Without it the prompt carries no product information at all, which
        // is the one thing this feature exists to put in.
        throw new BusinessException(
          'An active template must include {{product_fields}}',
          'AI_PROMPT_MISSING_PRODUCT_FIELDS',
        );
      }
    }

    const stored = await this.readJson<Stored>(TEMPLATES_KEY, {});
    const history = await this.readJson<History>(HISTORY_KEY, {});
    const priorVersions = history[current.type] ?? [];

    await this.writeJson(
      HISTORY_KEY,
      {
        ...history,
        [current.type]: [current, ...priorVersions].slice(0, MAX_HISTORY),
      },
      'Previous versions of AI prompt templates',
    );
    await this.writeJson(
      TEMPLATES_KEY,
      { ...stored, [current.type]: next },
      'AI prompt templates',
    );

    await this.auditService.log({
      action: 'AI_PROMPT_TEMPLATE_UPDATED',
      module: 'ai-prompts',
      resource: 'app_setting',
      resourceId: `${TEMPLATES_KEY}:${current.type}`,
      userId,
      oldValue: current as unknown as Record<string, unknown>,
      newValue: next as unknown as Record<string, unknown>,
    });

    return next;
  }

  /** Prior versions, newest first. */
  async history(type: string): Promise<PromptTemplate[]> {
    await this.get(type); // rejects an unknown type
    const history = await this.readJson<History>(HISTORY_KEY, {});
    return history[type as PromptType] ?? [];
  }

  async reset(userId: string, type: string) {
    const current = await this.get(type);
    const stored = await this.readJson<Stored>(TEMPLATES_KEY, {});
    delete stored[current.type];
    await this.writeJson(TEMPLATES_KEY, stored, 'AI prompt templates');

    await this.auditService.log({
      action: 'AI_PROMPT_TEMPLATE_RESET',
      module: 'ai-prompts',
      resource: 'app_setting',
      resourceId: `${TEMPLATES_KEY}:${current.type}`,
      userId,
      oldValue: current as unknown as Record<string, unknown>,
    });

    return this.get(type);
  }
}
