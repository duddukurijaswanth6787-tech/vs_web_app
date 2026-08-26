import { AiPromptService } from './ai-prompt.service';
import { DEFAULT_TEMPLATES, unsupportedVariables } from './ai-prompt.types';

/**
 * Templates are pasted into ChatGPT by hand, so a broken one is not caught by
 * anything downstream -- a stray `{{fabrik}}` or a template with no product
 * information in it just produces bad copy for a real product page.
 */
describe('AiPromptService', () => {
  const build = (stored: Record<string, unknown> = {}, history: Record<string, unknown> = {}) => {
    const rows: Record<string, { value: string }> = {};
    if (Object.keys(stored).length) {
      rows['ai.prompt.templates'] = { value: JSON.stringify(stored) };
    }
    if (Object.keys(history).length) {
      rows['ai.prompt.templates.history'] = { value: JSON.stringify(history) };
    }
    const prisma = {
      appSetting: {
        findUnique: jest.fn(({ where }: { where: { key: string } }) =>
          Promise.resolve(rows[where.key] ?? null),
        ),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    return {
      service: new AiPromptService(prisma as never, { log: jest.fn() } as never),
      prisma,
    };
  };

  const saved = (prisma: { appSetting: { upsert: jest.Mock } }, key: string) => {
    const call = prisma.appSetting.upsert.mock.calls.find((c) => c[0].where.key === key);
    return call ? JSON.parse(call[0].create.value) : null;
  };

  it('serves the built-in templates when nothing is saved', async () => {
    const { service } = build();
    const list = await service.list();

    expect(list).toHaveLength(8);
    expect(list.every((t) => t.template.includes('{{product_fields}}'))).toBe(true);
    expect(list.every((t) => t.status === 'ACTIVE')).toBe(true);
  });

  it('every built-in template uses only supported variables', () => {
    for (const template of Object.values(DEFAULT_TEMPLATES)) {
      expect(unsupportedVariables(template.template)).toEqual([]);
    }
  });

  it('refuses to activate a template with an unknown variable', async () => {
    const { service, prisma } = build();

    await expect(
      service.update('admin-1', 'PRODUCT_DESCRIPTION', {
        template: 'Describe {{product_fields}} in {{fabrik}}',
        status: 'ACTIVE',
      }),
    ).rejects.toThrow(/Unsupported variable: \{\{fabrik\}\}/);
    expect(prisma.appSetting.upsert).not.toHaveBeenCalled();
  });

  it('refuses to activate a template carrying no product information', async () => {
    const { service } = build();

    await expect(
      service.update('admin-1', 'PRODUCT_DESCRIPTION', {
        template: 'Write something nice.',
        status: 'ACTIVE',
      }),
    ).rejects.toThrow(/must include \{\{product_fields\}\}/);
  });

  it('allows saving a broken template while it is inactive', async () => {
    // That is how you fix one before switching it back on.
    const { service } = build();

    await expect(
      service.update('admin-1', 'PRODUCT_DESCRIPTION', {
        template: 'Half-written {{fabrik}}',
        status: 'INACTIVE',
      }),
    ).resolves.toMatchObject({ status: 'INACTIVE' });
  });

  it('bumps the version and records who changed it', async () => {
    const { service, prisma } = build();

    const next = await service.update('admin-1', 'PRODUCT_DESCRIPTION', {
      template: 'New copy {{product_fields}}',
    });

    expect(next.version).toBe(2);
    expect(next.updatedBy).toBe('admin-1');
    expect(next.updatedAt).not.toBe('');
    expect(saved(prisma, 'ai.prompt.templates').PRODUCT_DESCRIPTION.template).toContain('New copy');
  });

  it('keeps the previous version instead of destroying it', async () => {
    const { service, prisma } = build();

    await service.update('admin-1', 'PRODUCT_DESCRIPTION', {
      template: 'New copy {{product_fields}}',
    });

    const history = saved(prisma, 'ai.prompt.templates.history');
    expect(history.PRODUCT_DESCRIPTION).toHaveLength(1);
    expect(history.PRODUCT_DESCRIPTION[0].template).toBe(
      DEFAULT_TEMPLATES.PRODUCT_DESCRIPTION.template,
    );
  });

  it('caps history so one blob cannot grow forever', async () => {
    const existing = Array.from({ length: 10 }, (_, i) => ({
      ...DEFAULT_TEMPLATES.PRODUCT_DESCRIPTION,
      version: i + 1,
    }));
    const { service, prisma } = build({}, { PRODUCT_DESCRIPTION: existing });

    await service.update('admin-1', 'PRODUCT_DESCRIPTION', {
      template: 'Newer {{product_fields}}',
    });

    expect(saved(prisma, 'ai.prompt.templates.history').PRODUCT_DESCRIPTION).toHaveLength(10);
  });

  it('rejects an unknown prompt type', async () => {
    const { service } = build();
    await expect(service.get('NOT_A_TYPE')).rejects.toThrow(/Unknown prompt type/);
  });

  it('rejects an empty template', async () => {
    const { service } = build();
    await expect(
      service.update('admin-1', 'PRODUCT_DESCRIPTION', { template: '   ' }),
    ).rejects.toThrow(/Template content is required/);
  });

  it('falls back to the defaults when the stored blob is malformed', async () => {
    const prisma = {
      appSetting: {
        findUnique: jest.fn().mockResolvedValue({ value: '{ not json' }),
        upsert: jest.fn(),
      },
    };
    const service = new AiPromptService(prisma as never, { log: jest.fn() } as never);

    await expect(service.list()).resolves.toHaveLength(8);
  });
});
