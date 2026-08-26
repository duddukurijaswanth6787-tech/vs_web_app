import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import {
  isHexColor,
  THEME_SECTIONS,
  THEME_TOKENS,
  ThemeToken,
} from './theme.types';

/**
 * Per-section storefront colours.
 *
 * Stored as one JSON blob rather than a row per colour: the whole palette is
 * read together on every page render and saved together from one screen, so a
 * row per token would be thirty reads and a partial-save failure mode for no
 * gain.
 */
const THEME_SETTING_KEY = 'storefront.theme.colors';

@Injectable()
export class ThemeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Saved colours, filtered to what is currently valid.
   *
   * Filtered on the way out as well as in: these values are rendered inside a
   * <style> block, and a token that stopped existing, or a row edited straight
   * in the database, must not reach the page.
   */
  async getColors(): Promise<Record<string, string>> {
    const row = await this.prisma.appSetting.findUnique({
      where: { key: THEME_SETTING_KEY },
    });
    if (!row?.value) return {};

    let parsed: unknown;
    try {
      parsed = JSON.parse(row.value);
    } catch {
      // A malformed blob must not take the storefront down; the defaults are
      // a perfectly good palette.
      return {};
    }
    if (!parsed || typeof parsed !== 'object') return {};

    const safe: Record<string, string> = {};
    for (const [token, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (token in THEME_TOKENS && isHexColor(value)) {
        safe[token] = value.trim().toLowerCase();
      }
    }
    return safe;
  }

  /** Saved colours over the built-in defaults, plus what the editor needs. */
  async getTheme() {
    const colors = await this.getColors();
    return {
      colors: { ...THEME_TOKENS, ...colors },
      defaults: { ...THEME_TOKENS },
      sections: THEME_SECTIONS,
    };
  }

  async updateColors(userId: string, incoming: Record<string, string>) {
    const current = await this.getColors();
    const next = { ...current };

    for (const [token, value] of Object.entries(incoming ?? {})) {
      if (!(token in THEME_TOKENS)) {
        throw new BusinessException(
          `Unknown theme section "${token}"`,
          'THEME_UNKNOWN_TOKEN',
        );
      }
      // Empty means "go back to the default", which is how the reset button
      // clears one colour without needing its own endpoint.
      if (value === null || value === undefined || value === '') {
        delete next[token];
        continue;
      }
      if (!isHexColor(value)) {
        // These land inside a <style> block. Anything that is not a hex colour
        // could close the rule and open another, so it is refused rather than
        // escaped -- there is no legitimate non-hex value here.
        throw new BusinessException(
          `"${token}" must be a hex colour like #0284c7`,
          'THEME_INVALID_COLOR',
        );
      }
      next[token] = value.trim().toLowerCase();
    }

    await this.prisma.appSetting.upsert({
      where: { key: THEME_SETTING_KEY },
      create: {
        key: THEME_SETTING_KEY,
        value: JSON.stringify(next),
        type: 'JSON',
        group: 'theme',
        description: 'Per-section storefront colours',
      },
      update: { value: JSON.stringify(next) },
    });

    await this.auditService.log({
      action: 'STOREFRONT_THEME_UPDATED',
      module: 'storefront',
      resource: 'app_setting',
      resourceId: THEME_SETTING_KEY,
      userId,
      oldValue: current,
      newValue: next,
    });

    return this.getTheme();
  }

  async resetAll(userId: string) {
    await this.prisma.appSetting.deleteMany({
      where: { key: THEME_SETTING_KEY },
    });
    await this.auditService.log({
      action: 'STOREFRONT_THEME_RESET',
      module: 'storefront',
      resource: 'app_setting',
      resourceId: THEME_SETTING_KEY,
      userId,
    });
    return this.getTheme();
  }

  /** Narrows an arbitrary string to a known token, for callers with raw input. */
  isToken(value: string): value is ThemeToken {
    return value in THEME_TOKENS;
  }
}
