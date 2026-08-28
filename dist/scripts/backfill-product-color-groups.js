"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public';
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
const prisma = new client_1.PrismaClient({ adapter });
async function runBackfill() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log('=====================================================');
    console.log(`Starting Product Color Groups Backfill Script (${isDryRun ? 'DRY-RUN MODE' : 'LIVE PERSIST MODE'})`);
    console.log('=====================================================\n');
    const colorAttribute = await prisma.attribute.findFirst({
        where: {
            OR: [
                { slug: 'color' },
                { name: { equals: 'Color', mode: 'insensitive' } },
                { usesSwatch: true },
            ],
            deletedAt: null,
        },
        include: {
            options: {
                where: { deletedAt: null },
            },
        },
    });
    const availableColorOptions = colorAttribute?.options || [];
    console.log(`Found ${availableColorOptions.length} registered Color Attribute Options in registry.`);
    const productsToBackfill = await prisma.product.findMany({
        where: {
            deletedAt: null,
            colorGroups: {
                none: {},
            },
        },
        include: {
            variants: {
                where: { deletedAt: null },
                include: {
                    attributeValues: {
                        include: {
                            attribute: true,
                            option: true,
                        },
                    },
                },
            },
            media: {
                where: { deletedAt: null, status: 'ACTIVE' },
            },
        },
    });
    console.log(`Found ${productsToBackfill.length} legacy products needing color group backfill.\n`);
    let totalGroupsCreated = 0;
    let totalVariantsLinked = 0;
    let totalMediaLinked = 0;
    for (const product of productsToBackfill) {
        console.log(`-----------------------------------------------------`);
        console.log(`Product [${product.id}] "${product.name}"`);
        const colorMap = new Map();
        const getOrCreateGroup = (rawColorName) => {
            const cleanName = rawColorName.trim();
            const key = cleanName.toLowerCase();
            if (!colorMap.has(key)) {
                const matchedOption = availableColorOptions.find((o) => o.id === rawColorName ||
                    o.value.toLowerCase() === key ||
                    o.label.toLowerCase() === key);
                colorMap.set(key, {
                    rawColorName: matchedOption?.label || matchedOption?.value || cleanName,
                    colorAttributeOptionId: matchedOption?.id || null,
                    variantIds: [],
                    mediaIds: [],
                });
            }
            return colorMap.get(key);
        };
        for (const variant of product.variants) {
            const colorAttrVal = variant.attributeValues.find((av) => (colorAttribute && av.attributeId === colorAttribute.id) ||
                av.attribute.slug.toLowerCase() === 'color' ||
                av.attribute.name.toLowerCase() === 'color');
            const rawColor = colorAttrVal?.option?.value ||
                colorAttrVal?.option?.label ||
                colorAttrVal?.value ||
                (variant.title.includes('/') ? variant.title.split('/')[0].trim() : null);
            const colorKey = rawColor && rawColor.trim() !== '' ? rawColor : 'Standard';
            const group = getOrCreateGroup(colorKey);
            group.variantIds.push(variant.id);
        }
        for (const media of product.media) {
            if (media.color && media.color.trim() !== '') {
                const group = getOrCreateGroup(media.color);
                group.mediaIds.push(media.id);
            }
        }
        const groupItems = Array.from(colorMap.values());
        console.log(`  Discovered ${groupItems.length} color group(s) for this product:`);
        for (const item of groupItems) {
            console.log(`   - Color: "${item.rawColorName}" (Option ID: ${item.colorAttributeOptionId || 'NONE'}) -> ${item.variantIds.length} variant(s), ${item.mediaIds.length} photo(s)`);
            if (!isDryRun) {
                if (item.colorAttributeOptionId) {
                    const colorGroup = await prisma.productColorGroup.upsert({
                        where: {
                            productId_colorAttributeOptionId: {
                                productId: product.id,
                                colorAttributeOptionId: item.colorAttributeOptionId,
                            },
                        },
                        create: {
                            productId: product.id,
                            colorAttributeOptionId: item.colorAttributeOptionId,
                            label: item.rawColorName,
                        },
                        update: {
                            label: item.rawColorName,
                        },
                    });
                    if (item.variantIds.length > 0) {
                        await prisma.productVariant.updateMany({
                            where: { id: { in: item.variantIds } },
                            data: { colorGroupId: colorGroup.id },
                        });
                    }
                    if (item.mediaIds.length > 0) {
                        await prisma.productMedia.updateMany({
                            where: { id: { in: item.mediaIds } },
                            data: { colorGroupId: colorGroup.id },
                        });
                    }
                    totalGroupsCreated++;
                    totalVariantsLinked += item.variantIds.length;
                    totalMediaLinked += item.mediaIds.length;
                }
                else {
                    console.warn(`     [SKIP PERSIST] Option ID is null for raw color "${item.rawColorName}". Register this color in Attribute Registry first.`);
                }
            }
        }
    }
    console.log('\n=====================================================');
    console.log(`SUMMARY RESULT (${isDryRun ? 'DRY-RUN COMPLETE' : 'LIVE PERSIST COMPLETE'})`);
    console.log(`Total Products Evaluated: ${productsToBackfill.length}`);
    console.log(`Total Color Groups ${isDryRun ? 'Identified' : 'Created'}: ${totalGroupsCreated}`);
    console.log(`Total Variants ${isDryRun ? 'Identified' : 'Linked'}: ${totalVariantsLinked}`);
    console.log(`Total Media Photos ${isDryRun ? 'Identified' : 'Linked'}: ${totalMediaLinked}`);
    console.log('=====================================================\n');
}
runBackfill()
    .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill-product-color-groups.js.map