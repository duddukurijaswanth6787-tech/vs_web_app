import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';
import {
  SkuGenerator,
  BarcodeGenerator,
} from '@shared/commerce/commerce.utils';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { ProductVariantsRepository } from './product-variants.repository';
import { ProductsRepository } from '@domains/products/products.repository';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantQueryDto,
  VariantResponse,
  AssignAttributeValuesDto,
} from './product-variants.types';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly variantsRepository: ProductVariantsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly auditService: AuditService,
    private readonly loggerService: LoggerService,
  ) {}

  private toResponse(v: any): VariantResponse {
    return {
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      barcode: v.barcode,
      title: v.title,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
      salePriceOverride: v.salePriceOverride
        ? Number(v.salePriceOverride)
        : undefined,
      costPrice: v.costPrice ? Number(v.costPrice) : undefined,
      weight: v.weight ? Number(v.weight) : undefined,
      length: v.length ? Number(v.length) : undefined,
      width: v.width ? Number(v.width) : undefined,
      height: v.height ? Number(v.height) : undefined,
      displayOrder: v.displayOrder,
      status: v.status,
      isDefault: v.isDefault,
      isActive: v.isActive,
      attributeValues: v.attributeValues?.map((av: any) => ({
        attributeId: av.attributeId,
        attributeName: av.attribute?.name ?? av.attributeId,
        attributeType: av.attribute?.type ?? 'TEXT',
        attributeOptionId: av.attributeOptionId ?? undefined,
        optionLabel: av.option?.label ?? undefined,
        value: av.value ?? undefined,
      })),
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }

  async findAll(query: VariantQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.variantsRepository.findAll({
      productId: query.productId,
      status: query.status,
      isActive: query.isActive,
      isDefault: query.isDefault,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: result.data.map((v) => this.toResponse(v)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    return this.toResponse(variant);
  }

  private async generateUniqueSku(): Promise<string> {
    let sku = SkuGenerator.generate();
    while (await this.variantsRepository.findBySku(sku))
      sku = SkuGenerator.generate();
    return sku;
  }

  private async ensureUniqueSku(requested: string): Promise<string> {
    const base = requested.trim().toUpperCase().replace(/\s+/g, '-');
    let sku = base;
    let counter = 1;
    while (await this.variantsRepository.findBySku(sku)) {
      sku = `${base}-${counter}`;
      counter++;
    }
    return sku;
  }

  private async ensureUniqueBarcode(requested: string): Promise<string> {
    const base = requested.trim();
    let barcode = base;
    let counter = 1;
    while (await this.variantsRepository.findByBarcode(barcode)) {
      barcode = `${base}-${counter}`;
      counter++;
    }
    return barcode;
  }

  private async generateUniqueBarcode(): Promise<string> {
    let barcode = BarcodeGenerator.generate();
    while (await this.variantsRepository.findByBarcode(barcode))
      barcode = BarcodeGenerator.generate();
    return barcode;
  }

  async create(dto: CreateVariantDto, userId: string) {
    const product = await this.productsRepository.findById(dto.productId);
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'PRODUCT_001');

    if (dto.colorGroupId && dto.attributeValues?.length) {
      const existingVariantsInGroup = await this.prisma.productVariant.findMany(
        {
          where: {
            colorGroupId: dto.colorGroupId,
            deletedAt: null,
          },
          include: {
            attributeValues: true,
          },
        },
      );

      const newSizeOptionIds = dto.attributeValues
        .filter((av) => av.attributeOptionId)
        .map((av) => av.attributeOptionId!);

      for (const existing of existingVariantsInGroup) {
        const existingOptionIds = existing.attributeValues
          .filter((av) => av.attributeOptionId)
          .map((av) => av.attributeOptionId!);

        const hasDuplicateSize = newSizeOptionIds.some((optId) =>
          existingOptionIds.includes(optId),
        );
        if (hasDuplicateSize) {
          throw new BusinessException(
            'A variant with this size option already exists in this color group.',
            'DUPLICATE_VARIANT_SIZE',
          );
        }
      }
    }

    const sku = dto.sku
      ? await this.ensureUniqueSku(dto.sku)
      : await this.generateUniqueSku();
    const barcode = dto.barcode
      ? await this.ensureUniqueBarcode(dto.barcode)
      : await this.generateUniqueBarcode();
    const title = dto.title ?? sku;

    if (dto.isDefault) {
      await this.variantsRepository.clearDefaultForProduct(dto.productId);
    }

    const variant = await this.variantsRepository.create({
      product: { connect: { id: dto.productId } },
      ...(dto.colorGroupId
        ? { colorGroup: { connect: { id: dto.colorGroupId } } }
        : {}),
      sku,
      barcode,
      title,
      priceOverride: dto.priceOverride,
      salePriceOverride: dto.salePriceOverride,
      costPrice: dto.costPrice,
      weight: dto.weight,
      length: dto.length,
      width: dto.width,
      height: dto.height,
      displayOrder: dto.displayOrder ?? 0,
      isDefault: dto.isDefault ?? false,
      createdBy: userId,
    });

    if (dto.attributeValues?.length) {
      await this.variantsRepository.assignAttributeValues(
        variant.id,
        dto.attributeValues,
      );
    }

    await this.auditService.log({
      action: 'VARIANT_CREATED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: variant.id,
      userId,
      newValue: { productId: dto.productId, sku },
    });
    this.loggerService.log(
      { action: 'variant_created', variantId: variant.id },
      'ProductVariantsService',
    );
    return this.findById(variant.id);
  }

  async update(id: string, dto: UpdateVariantDto, userId: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');

    if (dto.isDefault && !variant.isDefault) {
      await this.variantsRepository.clearDefaultForProduct(variant.productId);
    }

    await this.variantsRepository.update(id, { ...dto, updatedBy: userId });
    await this.auditService.log({
      action: 'VARIANT_UPDATED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: id,
      userId,
      newValue: { ...dto },
    });
    return this.findById(id);
  }

  async delete(id: string, userId: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    await this.variantsRepository.softDelete(id);
    await this.auditService.log({
      action: 'VARIANT_DELETED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: id,
      userId,
    });
  }

  async restore(id: string, userId: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    if (!variant.deletedAt)
      throw new BusinessException('Variant is not deleted', 'VARIANT_002');
    await this.variantsRepository.restore(id);
    await this.auditService.log({
      action: 'VARIANT_RESTORED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: id,
      userId,
    });
    return this.findById(id);
  }

  async activate(id: string, userId: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    await this.variantsRepository.update(id, {
      isActive: true,
      status: 'ACTIVE',
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'VARIANT_ACTIVATED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: id,
      userId,
    });
    return this.findById(id);
  }

  async deactivate(id: string, userId: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    await this.variantsRepository.update(id, {
      isActive: false,
      status: 'INACTIVE',
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'VARIANT_DEACTIVATED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: id,
      userId,
    });
    return this.findById(id);
  }

  async setDefault(id: string, userId: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    await this.variantsRepository.clearDefaultForProduct(variant.productId);
    await this.variantsRepository.update(id, {
      isDefault: true,
      updatedBy: userId,
    });
    await this.auditService.log({
      action: 'VARIANT_DEFAULT_CHANGED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: id,
      userId,
    });
    return this.findById(id);
  }

  async assignAttributeValues(
    id: string,
    dto: AssignAttributeValuesDto,
    userId: string,
  ) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    await this.variantsRepository.assignAttributeValues(
      id,
      dto.attributeValues,
    );
    await this.auditService.log({
      action: 'ATTRIBUTE_VALUE_ASSIGNED',
      module: 'product-variants',
      resource: 'variant',
      resourceId: id,
      userId,
      newValue: { attributeValues: dto.attributeValues },
    });
    return this.findById(id);
  }

  async removeAttributeValue(id: string, attributeId: string) {
    const variant = await this.variantsRepository.findById(id);
    if (!variant || variant.deletedAt)
      throw new BusinessException('Variant not found', 'VARIANT_001');
    await this.variantsRepository.removeAttributeValue(id, attributeId);
    return this.findById(id);
  }
}
