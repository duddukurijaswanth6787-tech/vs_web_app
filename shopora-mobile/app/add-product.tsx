import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Package,
  IndianRupee,
  Palette,
  Ruler,
  Tag,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react-native';
import {
  catalogService,
  attributeService,
  inventoryService,
  buildVariantAttributes,
  getApiErrorMessage,
  isAuthenticated,
  type BrandOption,
  type CategoryOption,
  type ColorGroupDraft,
  type CreatedVariant,
  type AttributeDefinition,
} from '../services/api';
import { setLastCreatedProduct } from '../services/product-draft';

/**
 * Mobile mirror of the admin ProductBuilder
 * (frontend/src/features/catalog/products/components/ProductBuilder.tsx).
 *
 * Same five steps, same endpoints, in the same order:
 *   1. POST /products
 *   2. POST /products/:id/categories        (when a category was chosen)
 *   3. POST /storage/upload + POST /media   (per staged photo)
 *   4. POST /variants                       (per colour x size — assigns the barcode)
 *   5. POST /inventory                      (opening stock per variant)
 * then hands off to the label screen to print what step 4 generated.
 */

const COLOR_PRESETS = [
  { name: 'Maroon', hex: '#800020' },
  { name: 'Emerald Green', hex: '#0E6251' },
  { name: 'Royal Blue', hex: '#1B4F72' },
  { name: 'Pastel Pink', hex: '#FADBD8' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Black', hex: '#1C2833' },
  { name: 'Crimson Red', hex: '#900C3F' },
  { name: 'Mustard Yellow', hex: '#D4AC0D' },
];

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const STEPS = [
  { key: 'basic', label: 'Basic', Icon: Package },
  { key: 'pricing', label: 'Pricing', Icon: IndianRupee },
  { key: 'colors', label: 'Colours', Icon: Palette },
  { key: 'sizes', label: 'Sizes', Icon: Ruler },
  { key: 'seo', label: 'Review', Icon: Tag },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

export default function AddProductScreen() {
  const router = useRouter();

  const [step, setStep] = useState<StepKey>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  // ── Step 1: basic ──────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('READYMADE');
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');

  // ── Step 2: pricing ────────────────────────────────────────────────────────
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('5');
  const [taxInclusive, setTaxInclusive] = useState(true);

  // ── Step 3/4: colours and their per-size stock ─────────────────────────────
  const [colorGroups, setColorGroups] = useState<ColorGroupDraft[]>([]);
  const [activeColorId, setActiveColorId] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#800020');

  // ── Step 5: seo / publish ──────────────────────────────────────────────────
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(false);

  // ── Reference data ─────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [refsError, setRefsError] = useState('');

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login?redirect=/add-product');
      return;
    }
    let cancelled = false;

    (async () => {
      setLoadingRefs(true);
      setRefsError('');
      try {
        const [brandRows, categoryRows, attributeRows] = await Promise.all([
          catalogService.listBrands(),
          catalogService.listCategories(),
          attributeService.list().catch(() => [] as AttributeDefinition[]),
        ]);
        if (cancelled) return;
        setBrands(brandRows);
        setCategories(categoryRows);
        setAttributes(attributeRows);
        // A product cannot be created without a real brand id, so preselect one.
        if (brandRows.length > 0) {
          setBrandId(brandRows[0].id);
          setBrandName(brandRows[0].name);
        }
      } catch (err) {
        if (!cancelled) setRefsError(getApiErrorMessage(err, 'Could not load brands and categories'));
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ── Colour helpers ─────────────────────────────────────────────────────────

  const addColorGroup = (presetName?: string, presetHex?: string) => {
    const cName = (presetName || newColorName).trim() || `Colour ${colorGroups.length + 1}`;
    if (colorGroups.some((g) => g.name.toLowerCase() === cName.toLowerCase())) {
      Alert.alert('Duplicate colour', `"${cName}" has already been added.`);
      return;
    }
    const group: ColorGroupDraft = {
      id: `col-${Date.now()}`,
      name: cName,
      hex: presetHex || newColorHex,
      images: [],
      sizes: STANDARD_SIZES.map((size) => ({ size, stock: 0, available: false })),
    };
    setColorGroups((prev) => [...prev, group]);
    setActiveColorId(group.id);
    setNewColorName('');
  };

  const removeColorGroup = (id: string) => {
    setColorGroups((prev) => prev.filter((g) => g.id !== id));
    if (activeColorId === id) setActiveColorId('');
  };

  const pickImages = async (groupId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach product images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const uris = result.assets.map((a) => a.uri);
    setColorGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, images: [...g.images, ...uris] } : g)),
    );
  };

  const takePhoto = async (groupId: string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to photograph the product.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, images: [...g.images, result.assets[0].uri] } : g,
      ),
    );
  };

  const removeImage = (groupId: string, uri: string) => {
    setColorGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, images: g.images.filter((i) => i !== uri) } : g)),
    );
  };

  const toggleSize = (groupId: string, size: string) => {
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              sizes: g.sizes.map((s) =>
                s.size === size
                  ? { ...s, available: !s.available, stock: !s.available && s.stock === 0 ? 10 : s.stock }
                  : s,
              ),
            }
          : g,
      ),
    );
  };

  const setSizeStock = (groupId: string, size: string, raw: string) => {
    const parsed = Math.max(0, parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0);
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, sizes: g.sizes.map((s) => (s.size === size ? { ...s, stock: parsed } : s)) }
          : g,
      ),
    );
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const plannedVariants = useMemo(
    () =>
      colorGroups.flatMap((g) =>
        g.sizes.filter((s) => s.available).map((s) => ({ color: g.name, size: s.size, stock: s.stock })),
      ),
    [colorGroups],
  );

  const totalImages = useMemo(
    () => colorGroups.reduce((sum, g) => sum + g.images.length, 0),
    [colorGroups],
  );

  const activeGroup = colorGroups.find((g) => g.id === activeColorId) ?? colorGroups[0];

  const validate = (): string => {
    if (name.trim().length < 3) return 'Product name must be at least 3 characters.';
    if (!brandId) return 'Select a brand — the API requires a valid brand.';
    if (!basePrice || Number(basePrice) <= 0) return 'Enter an MRP / base price greater than 0.';
    if (salePrice && Number(salePrice) > Number(basePrice)) {
      return 'Sale price cannot be higher than the base price.';
    }
    if (plannedVariants.length === 0) {
      return 'Add at least one colour and tick at least one size — barcodes are issued per variant.';
    }
    return '';
  };

  // ── Submit: the admin sequence, end to end ─────────────────────────────────

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      Alert.alert('Check the form', validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // 1. POST /products
      setProgress('Creating product…');
      const created = await catalogService.createProduct({
        name: name.trim(),
        brandId,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        type,
        gender: 'WOMEN',
        ageGroup: 'ADULTS',
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        taxPercentage: taxPercentage ? Number(taxPercentage) : undefined,
        taxInclusive,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        status: 'ACTIVE',
        isPublished,
        isNewArrival,
      });

      const productId: string = created?.id;
      if (!productId) throw new Error('The API did not return a product id.');

      // 2. POST /products/:id/categories
      if (categoryId) {
        setProgress('Assigning category…');
        await catalogService.assignCategory(productId, categoryId).catch(() => null);
      }

      // 3. POST /storage/upload -> POST /media, flattened across colour groups
      let displayOrder = 0;
      let primarySet = false;
      for (const group of colorGroups) {
        for (const localUri of group.images) {
          setProgress(`Uploading image ${displayOrder + 1} of ${totalImages}…`);
          const fileName = `${group.name.replace(/\s+/g, '-').toLowerCase()}-${displayOrder}.jpg`;
          const url = await catalogService.uploadImage(localUri, fileName);
          if (!url) continue;
          await catalogService.addMedia({
            productId,
            url,
            isPrimary: !primarySet,
            displayOrder: displayOrder++,
            color: group.name,
          });
          primarySet = true;
        }
      }

      // 4 + 5. POST /variants then POST /inventory, per colour x size
      const createdVariants: CreatedVariant[] = [];
      let variantIndex = 0;
      for (const group of colorGroups) {
        for (const sizeRow of group.sizes) {
          if (!sizeRow.available) continue;
          variantIndex += 1;
          setProgress(
            `Creating variant ${variantIndex} of ${plannedVariants.length} — ${group.name} / ${sizeRow.size}`,
          );

          const variant = await catalogService.createVariant({
            productId,
            title: `${group.name} / ${sizeRow.size}`,
            displayOrder: variantIndex - 1,
            isDefault: variantIndex === 1,
            costPrice: costPrice ? Number(costPrice) : undefined,
            attributeValues: buildVariantAttributes(attributes, group.name, sizeRow.size),
          });

          if (!variant?.id) continue;

          if (sizeRow.stock > 0) {
            setProgress(`Adding stock for ${group.name} / ${sizeRow.size}…`);
            await inventoryService
              .stockIn(variant.id, sizeRow.stock, 'Opening stock from POS mobile')
              .catch(() => null);
          }

          createdVariants.push({
            variantId: variant.id,
            sku: variant.sku,
            barcode: variant.barcode,
            title: variant.title ?? `${group.name} / ${sizeRow.size}`,
            color: group.name,
            size: sizeRow.size,
            stock: sizeRow.stock,
            price: salePrice ? Number(salePrice) : Number(basePrice),
          });
        }
      }

      if (createdVariants.length === 0) {
        throw new Error('The product was created but no variants were issued, so there is nothing to label.');
      }

      // 6. Hand the issued barcodes to the label screen.
      setLastCreatedProduct({
        productId,
        name: name.trim(),
        brandName,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : undefined,
        variants: createdVariants,
      });

      setProgress('');
      router.push('/label-preview');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not create the product');
      setError(message);
      Alert.alert('Creation failed', message);
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  // ── Navigation between steps ───────────────────────────────────────────────

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(pickerQuery.toLowerCase()),
  );
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(pickerQuery.toLowerCase()),
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Step rail — the admin builder's five tabs */}
      <View style={styles.stepRail}>
        {STEPS.map((s, idx) => {
          const active = s.key === step;
          const done = idx < stepIndex;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.stepChip, active && styles.stepChipActive]}
              onPress={() => setStep(s.key)}
            >
              <s.Icon size={14} color={active ? '#ffffff' : done ? '#800020' : '#9ca3af'} />
              <Text
                style={[
                  styles.stepChipText,
                  active && styles.stepChipTextActive,
                  done && !active && styles.stepChipTextDone,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {refsError !== '' && (
        <View style={styles.warnBar}>
          <AlertCircle size={14} color="#b45309" style={{ marginRight: 6 }} />
          <Text style={styles.warnText}>{refsError}</Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1: BASIC ── */}
        {step === 'basic' && (
          <View>
            <Text style={styles.sectionTitle}>Product details</Text>

            <Text style={styles.label}>Product name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Banarasi Silk Kurta Set"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Brand *</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => {
                setPickerQuery('');
                setShowBrandModal(true);
              }}
            >
              {loadingRefs ? (
                <ActivityIndicator size="small" color="#800020" />
              ) : (
                <Text style={[styles.selectText, !brandName && styles.selectPlaceholder]}>
                  {brandName || 'Select a brand'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => {
                setPickerQuery('');
                setShowCategoryModal(true);
              }}
            >
              <Text style={[styles.selectText, !categoryName && styles.selectPlaceholder]}>
                {categoryName || 'Select a category (optional)'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Product type</Text>
            <View style={styles.pillRow}>
              {['READYMADE', 'UNSTITCHED', 'ACCESSORY'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pill, type === t && styles.pillActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.pillText, type === t && styles.pillTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Short description</Text>
            <TextInput
              style={styles.input}
              value={shortDescription}
              onChangeText={setShortDescription}
              placeholder="One line shown on the product card"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Full description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Fabric, work, care instructions…"
              placeholderTextColor="#9ca3af"
              multiline
            />
          </View>
        )}

        {/* ── STEP 2: PRICING ── */}
        {step === 'pricing' && (
          <View>
            <Text style={styles.sectionTitle}>Pricing</Text>

            <Text style={styles.label}>MRP / base price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={basePrice}
              onChangeText={setBasePrice}
              placeholder="1499"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Sale price (₹)</Text>
            <TextInput
              style={styles.input}
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="Leave blank if not on offer"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Cost price (₹)</Text>
            <TextInput
              style={styles.input}
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="Internal purchase cost"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Tax %</Text>
            <TextInput
              style={styles.input}
              value={taxPercentage}
              onChangeText={setTaxPercentage}
              placeholder="5"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Price includes tax</Text>
              <Switch
                value={taxInclusive}
                onValueChange={setTaxInclusive}
                trackColor={{ true: '#800020', false: '#d1d5db' }}
              />
            </View>

            {basePrice !== '' && salePrice !== '' && Number(salePrice) < Number(basePrice) && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Customer saves ₹{Number(basePrice) - Number(salePrice)} (
                  {Math.round(((Number(basePrice) - Number(salePrice)) / Number(basePrice)) * 100)}% off)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── STEP 3: COLOURS ── */}
        {step === 'colors' && (
          <View>
            <Text style={styles.sectionTitle}>Colours &amp; photos</Text>

            <View style={styles.presetWrap}>
              {COLOR_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={styles.presetChip}
                  onPress={() => addColorGroup(p.name, p.hex)}
                >
                  <View style={[styles.swatch, { backgroundColor: p.hex }]} />
                  <Text style={styles.presetText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                value={newColorName}
                onChangeText={setNewColorName}
                placeholder="Custom colour name"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={styles.addBtn} onPress={() => addColorGroup()}>
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {colorGroups.length === 0 && (
              <Text style={styles.emptyHint}>
                Add at least one colour. Each colour × size becomes a variant with its own barcode.
              </Text>
            )}

            {colorGroups.length > 0 && (
              <>
                <View style={styles.colorTabRow}>
                  {colorGroups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.colorTab, activeGroup?.id === g.id && styles.colorTabActive]}
                      onPress={() => setActiveColorId(g.id)}
                    >
                      <View style={[styles.swatch, { backgroundColor: g.hex }]} />
                      <Text style={styles.colorTabText}>{g.name}</Text>
                      <TouchableOpacity onPress={() => removeColorGroup(g.id)} hitSlop={8}>
                        <Trash2 size={13} color="#b91c1c" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>

                {activeGroup && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{activeGroup.name} — photos</Text>
                    <View style={styles.inlineRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => takePhoto(activeGroup.id)}
                      >
                        <ImageIcon size={15} color="#800020" style={{ marginRight: 6 }} />
                        <Text style={styles.secondaryBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => pickImages(activeGroup.id)}
                      >
                        <Plus size={15} color="#800020" style={{ marginRight: 6 }} />
                        <Text style={styles.secondaryBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                      {activeGroup.images.map((uri) => (
                        <View key={uri} style={styles.thumbWrap}>
                          <Image source={{ uri }} style={styles.thumb} />
                          <TouchableOpacity
                            style={styles.thumbRemove}
                            onPress={() => removeImage(activeGroup.id, uri)}
                          >
                            <X size={12} color="#ffffff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {activeGroup.images.length === 0 && (
                        <Text style={styles.emptyHint}>No photos yet for this colour.</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── STEP 4: SIZES ── */}
        {step === 'sizes' && (
          <View>
            <Text style={styles.sectionTitle}>Sizes &amp; opening stock</Text>
            {colorGroups.length === 0 ? (
              <Text style={styles.emptyHint}>Add a colour first — sizes hang off each colour.</Text>
            ) : (
              colorGroups.map((group) => (
                <View key={group.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.swatch, { backgroundColor: group.hex }]} />
                    <Text style={styles.cardTitle}>{group.name}</Text>
                  </View>
                  {group.sizes.map((row) => (
                    <View key={row.size} style={styles.sizeRow}>
                      <TouchableOpacity
                        style={[styles.sizeToggle, row.available && styles.sizeToggleActive]}
                        onPress={() => toggleSize(group.id, row.size)}
                      >
                        {row.available && <Check size={13} color="#ffffff" />}
                        <Text
                          style={[styles.sizeToggleText, row.available && styles.sizeToggleTextActive]}
                        >
                          {row.size}
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.stockInput, !row.available && styles.stockInputDisabled]}
                        value={String(row.stock)}
                        onChangeText={(t) => setSizeStock(group.id, row.size, t)}
                        keyboardType="numeric"
                        editable={row.available}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                      />
                      <Text style={styles.sizeHint}>units</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* ── STEP 5: REVIEW ── */}
        {step === 'seo' && (
          <View>
            <Text style={styles.sectionTitle}>SEO &amp; review</Text>

            <Text style={styles.label}>SEO title</Text>
            <TextInput
              style={styles.input}
              value={seoTitle}
              onChangeText={setSeoTitle}
              placeholder={name || 'Shown in search results'}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>SEO description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={seoDescription}
              onChangeText={setSeoDescription}
              placeholder="Short summary for search engines"
              placeholderTextColor="#9ca3af"
              multiline
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Publish immediately</Text>
              <Switch
                value={isPublished}
                onValueChange={setIsPublished}
                trackColor={{ true: '#800020', false: '#d1d5db' }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mark as new arrival</Text>
              <Switch
                value={isNewArrival}
                onValueChange={setIsNewArrival}
                trackColor={{ true: '#800020', false: '#d1d5db' }}
              />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>What will be created</Text>
              <SummaryRow label="Product" value={name || '—'} />
              <SummaryRow label="Brand" value={brandName || '—'} />
              <SummaryRow label="Category" value={categoryName || 'Not assigned'} />
              <SummaryRow label="Price" value={basePrice ? `₹${basePrice}` : '—'} />
              <SummaryRow label="Photos to upload" value={String(totalImages)} />
              <SummaryRow
                label="Variants (barcodes)"
                value={String(plannedVariants.length)}
                emphasis
              />
              <SummaryRow
                label="Total opening stock"
                value={String(plannedVariants.reduce((sum, v) => sum + v.stock, 0))}
              />
            </View>

            {error !== '' && (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#b91c1c" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 10 }} />
                  <Text style={styles.primaryBtnText}>{progress || 'Working…'}</Text>
                </>
              ) : (
                <>
                  <Check size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>CREATE &amp; GENERATE BARCODES</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Step navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, stepIndex === 0 && styles.navBtnDisabled]}
          onPress={goBack}
          disabled={stepIndex === 0}
        >
          <ArrowLeft size={16} color={stepIndex === 0 ? '#9ca3af' : '#374151'} />
          <Text style={[styles.navBtnText, stepIndex === 0 && styles.navBtnTextDisabled]}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.footerCount}>
          {plannedVariants.length} variant{plannedVariants.length === 1 ? '' : 's'}
        </Text>

        <TouchableOpacity
          style={[styles.navBtn, stepIndex === STEPS.length - 1 && styles.navBtnDisabled]}
          onPress={goNext}
          disabled={stepIndex === STEPS.length - 1}
        >
          <Text
            style={[
              styles.navBtnText,
              stepIndex === STEPS.length - 1 && styles.navBtnTextDisabled,
            ]}
          >
            Next
          </Text>
          <ArrowRight size={16} color={stepIndex === STEPS.length - 1 ? '#9ca3af' : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* Brand picker */}
      <PickerModal
        visible={showBrandModal}
        title="Select brand"
        query={pickerQuery}
        onQueryChange={setPickerQuery}
        rows={filteredBrands}
        selectedId={brandId}
        emptyText="No brands found. Create one in the admin panel first."
        onSelect={(row) => {
          setBrandId(row.id);
          setBrandName(row.name);
          setShowBrandModal(false);
        }}
        onClose={() => setShowBrandModal(false)}
      />

      {/* Category picker */}
      <PickerModal
        visible={showCategoryModal}
        title="Select category"
        query={pickerQuery}
        onQueryChange={setPickerQuery}
        rows={filteredCategories}
        selectedId={categoryId}
        emptyText="No categories found."
        onSelect={(row) => {
          setCategoryId(row.id);
          setCategoryName(row.name);
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasis && styles.summaryValueEmphasis]}>{value}</Text>
    </View>
  );
}

function PickerModal({
  visible,
  title,
  query,
  onQueryChange,
  rows,
  selectedId,
  emptyText,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  query: string;
  onQueryChange: (q: string) => void;
  rows: { id: string; name: string }[];
  selectedId: string;
  emptyText: string;
  onSelect: (row: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={onQueryChange}
              placeholder="Search…"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {rows.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={[styles.pickerItem, selectedId === row.id && styles.pickerItemActive]}
                onPress={() => onSelect(row)}
              >
                <Text style={styles.pickerItemText}>{row.name}</Text>
                {selectedId === row.id && <Check size={18} color="#800020" />}
              </TouchableOpacity>
            ))}
            {rows.length === 0 && <Text style={styles.emptyHint}>{emptyText}</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },

  stepRail: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 6,
  },
  stepChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    gap: 4,
  },
  stepChipActive: { backgroundColor: '#800020' },
  stepChipText: { fontSize: 10, fontWeight: '700', color: '#9ca3af' },
  stepChipTextActive: { color: '#ffffff' },
  stepChipTextDone: { color: '#800020' },

  warnBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  warnText: { flex: 1, fontSize: 11, color: '#b45309' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { height: 96, textAlignVertical: 'top' },
  select: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectText: { fontSize: 15, color: '#111827' },
  selectPlaceholder: { color: '#9ca3af' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  pillActive: { backgroundColor: '#800020', borderColor: '#800020' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  pillTextActive: { color: '#ffffff' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },

  infoBox: {
    marginTop: 18,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
  },
  infoText: { color: '#15803d', fontSize: 13, fontWeight: '600' },

  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  presetText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#e5e7eb' },

  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#800020',
    alignItems: 'center',
    justifyContent: 'center',
  },

  colorTabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  colorTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  colorTabActive: { borderColor: '#800020', backgroundColor: '#fdf2f4' },
  colorTabText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbdde4',
    backgroundColor: '#fdf2f4',
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700', color: '#800020' },

  thumbWrap: { marginRight: 10, position: 'relative' },
  thumb: { width: 76, height: 96, borderRadius: 10, backgroundColor: '#f1f5f9' },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  sizeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 74,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  sizeToggleActive: { backgroundColor: '#800020', borderColor: '#800020' },
  sizeToggleText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  sizeToggleTextActive: { color: '#ffffff' },
  stockInput: {
    width: 84,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  stockInputDisabled: { backgroundColor: '#f8fafc', color: '#9ca3af' },
  sizeHint: { fontSize: 11, color: '#9ca3af' },

  summaryCard: {
    marginTop: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1f2937', flexShrink: 1, textAlign: 'right' },
  summaryValueEmphasis: { color: '#800020', fontWeight: '800' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: { flex: 1, color: '#b91c1c', fontSize: 12 },

  primaryBtn: {
    marginTop: 20,
    backgroundColor: '#800020',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.75 },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 0.4 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8 },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  navBtnTextDisabled: { color: '#9ca3af' },
  footerCount: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },

  emptyHint: { fontSize: 12, color: '#9ca3af', marginTop: 14, lineHeight: 18 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerItemActive: { backgroundColor: '#fdf2f4' },
  pickerItemText: { fontSize: 14, color: '#374151' },
});
