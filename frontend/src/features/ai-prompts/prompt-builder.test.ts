import {
  attributeVariableKey,
  collectFields,
  hasValue,
  missingRecommended,
  REFERENCE_IMAGE_INSTRUCTION,
  renderFieldBlock,
  renderPrompt,
} from './prompt-builder';

/**
 * The rule this feature exists to enforce: a field with no value never reaches
 * the prompt. An empty `Fabric:` line invites the model to fill it in, and an
 * invented fabric on a product page is a return or a complaint.
 */

const ACCURACY = 'Do not invent, assume, or fabricate missing product information.';

const TEMPLATE =
  'Generate a description.\n\nPRODUCT INFORMATION:\n{{product_fields}}\n\nRULES:\n{{rules}}';

const RULES = '- Use elegant language.';

const build = (values: Record<string, unknown>) => [
  { label: 'Product Name', key: 'product_name', value: values.name },
  { label: 'Category', key: 'category', value: values.category },
  { label: 'Fabric', key: 'fabric', value: values.fabric },
  { label: 'Color', key: 'color', value: values.color },
  { label: 'Pattern', key: 'pattern', value: values.pattern },
  { label: 'Occasion', key: 'occasion', value: values.occasion },
];

const promptFor = (values: Record<string, unknown>, extra: string[] = []) =>
  renderPrompt({
    template: TEMPLATE,
    rules: RULES,
    fields: collectFields(build(values)),
    accuracyRule: ACCURACY,
    extraInstructions: extra,
  });

describe('hasValue', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace only', '   '],
    ['tab and newline', '\t\n'],
    ['empty array', []],
    ['array of blanks', ['', '  ']],
    ['empty object', {}],
    ['object of blanks', { a: '', b: null }],
    ['NaN', Number.NaN],
    ['false', false],
  ])('treats %s as empty', (_label, value) => {
    expect(hasValue(value)).toBe(false);
  });

  it.each([
    ['text', 'Rayon'],
    ['zero', 0],
    ['a populated array', ['Festive']],
    ['a nested value', { a: '', b: 'Pink' }],
  ])('treats %s as present', (_label, value) => {
    expect(hasValue(value)).toBe(true);
  });
});

describe('the prompt only ever contains fields that have values', () => {
  // TEST 1
  it('generates from a product name alone', () => {
    const prompt = promptFor({ name: 'Designer Kurti' });

    expect(prompt).toContain('Product Name: Designer Kurti');
    expect(prompt).toContain(ACCURACY);
  });

  // TEST 2
  it('includes only the fields that were filled in', () => {
    const prompt = promptFor({ name: 'Designer Kurti', category: 'Kurtis' });

    expect(prompt).toContain('Product Name: Designer Kurti');
    expect(prompt).toContain('Category: Kurtis');
    expect(prompt).not.toMatch(/^Fabric:/m);
    expect(prompt).not.toMatch(/^Pattern:/m);
  });

  // TEST 3 + TEST 4 -- the case from the brief
  it('omits empty fabric and colour entirely', () => {
    const prompt = promptFor({
      name: 'Floral Printed Anarkali Dress',
      category: 'Anarkali Dresses',
      fabric: '',
      color: '',
      pattern: 'Floral',
      occasion: '',
    });

    expect(prompt).toContain('Product Name: Floral Printed Anarkali Dress');
    expect(prompt).toContain('Category: Anarkali Dresses');
    expect(prompt).toContain('Pattern: Floral');
    // Not merely absent as a line -- the word must not appear as a label at all.
    expect(prompt).not.toContain('Fabric:');
    expect(prompt).not.toContain('Color:');
    expect(prompt).not.toContain('Occasion:');
  });

  // TEST 5
  it('includes every field when they are all filled in', () => {
    const prompt = promptFor({
      name: 'Floral Printed Anarkali Dress',
      category: 'Anarkali Dresses',
      fabric: 'Rayon',
      color: 'Pink',
      pattern: 'Floral',
      occasion: 'Festive',
    });

    for (const line of [
      'Product Name: Floral Printed Anarkali Dress',
      'Category: Anarkali Dresses',
      'Fabric: Rayon',
      'Color: Pink',
      'Pattern: Floral',
      'Occasion: Festive',
    ]) {
      expect(prompt).toContain(line);
    }
  });

  // TEST 6
  it('treats a whitespace-only field as empty', () => {
    const prompt = promptFor({ name: 'Designer Kurti', fabric: '   ' });
    expect(prompt).not.toContain('Fabric:');
  });

  it('never leaves an unresolved variable in the text', () => {
    const prompt = renderPrompt({
      template: 'Name: {{product_name}}\nFabric: {{fabric}}\n{{product_fields}}',
      rules: RULES,
      fields: collectFields(build({ name: 'Kurti' })),
      accuracyRule: ACCURACY,
    });

    // A leftover {{fabric}} would be pasted into ChatGPT verbatim.
    expect(prompt).not.toMatch(/\{\{|\}\}/);
  });

  it('renders an array field as a readable list', () => {
    expect(
      renderFieldBlock(
        collectFields([
          { label: 'Tags', key: 'tags', value: ['festive', '', 'party'] },
        ]),
      ),
    ).toBe('Tags: festive, party');
  });
});

// TEST 7
describe('reference images', () => {
  it('adds the reference instruction when asked', () => {
    const prompt = promptFor({ name: 'Kurti' }, [REFERENCE_IMAGE_INSTRUCTION]);
    expect(prompt).toContain('primary visual reference');
  });

  it('leaves it out otherwise', () => {
    expect(promptFor({ name: 'Kurti' })).not.toContain('primary visual reference');
  });
});

// TEST 8 -- rules come from the template, so editing them changes the output
describe('rules', () => {
  it('uses whatever rules it is given', () => {
    const prompt = renderPrompt({
      template: TEMPLATE,
      rules: '- Keep it under 50 words.',
      fields: collectFields(build({ name: 'Kurti' })),
      accuracyRule: ACCURACY,
    });

    expect(prompt).toContain('- Keep it under 50 words.');
    expect(prompt).not.toContain('- Use elegant language.');
  });

  it('appends the accuracy rule even to a template that omits it', () => {
    // The template is editable; this rule is not optional.
    const prompt = renderPrompt({
      template: 'Just do it. {{product_fields}}',
      rules: '',
      fields: collectFields(build({ name: 'Kurti' })),
      accuracyRule: ACCURACY,
    });

    expect(prompt).toContain(ACCURACY);
  });
});

describe('missingRecommended', () => {
  it('names the labels worth filling in', () => {
    const missing = missingRecommended(
      build({ name: 'Kurti', category: 'Kurtis', pattern: 'Floral' }),
      ['fabric', 'color', 'occasion'],
    );

    expect(missing).toEqual(['Fabric', 'Color', 'Occasion']);
  });

  it('says nothing when everything recommended is present', () => {
    const missing = missingRecommended(
      build({ fabric: 'Rayon', color: 'Pink', occasion: 'Festive' }),
      ['fabric', 'color', 'occasion'],
    );

    expect(missing).toEqual([]);
  });
});

/**
 * The catalog seeds two attribute families for the same concepts: the
 * variant/filter set (fabric, sleeve-type, neck-type) and the customer
 * specification set (spec-fabric, spec-sleeve, spec-neck). A template author
 * should not have to know which one a shop happens to use, and a product with
 * both filled in must not print the same label twice.
 */
describe('real catalog attribute slugs', () => {
  it.each([
    ['fabric', 'Fabric', 'fabric'],
    ['spec-fabric', 'Fabric', 'fabric'],
    ['pattern', 'Pattern', 'pattern'],
    ['spec-pattern', 'Pattern', 'pattern'],
    ['fit', 'Fit', 'fit'],
    ['spec-fit', 'Fit', 'fit'],
    ['sleeve-type', 'Sleeve Type', 'sleeve'],
    ['spec-sleeve', 'Sleeve', 'sleeve'],
    ['neck-type', 'Neck Type', 'neck'],
    ['spec-neck', 'Neck', 'neck'],
    ['occasion', 'Occasion', 'occasion'],
    ['spec-occasion', 'Occasion', 'occasion'],
    ['wash-care', 'Wash Care', 'wash_care'],
    ['attr-season', 'Season', 'attr_season'],
  ])('maps %s to {{%s}}', (slug, name, expected) => {
    expect(attributeVariableKey(slug, name)).toBe(expected);
  });

  it('never produces a hyphen, which {{...}} cannot contain', () => {
    for (const slug of ['sleeve-type', 'neck-type', 'wash-care', 'spec-fabric']) {
      expect(attributeVariableKey(slug, slug)).not.toContain('-');
    }
  });

  it('resolves {{sleeve}} from the real sleeve-type slug', () => {
    const prompt = renderPrompt({
      template: 'Sleeve is {{sleeve}}. {{product_fields}}',
      rules: '',
      fields: collectFields([
        {
          label: 'Sleeve Type',
          key: attributeVariableKey('sleeve-type', 'Sleeve Type'),
          value: 'Full Sleeve',
        },
      ]),
      accuracyRule: ACCURACY,
    });

    expect(prompt).toContain('Sleeve is Full Sleeve.');
  });

  it('prints one Fabric line when both attribute families are filled in', () => {
    const fields = collectFields([
      { label: 'Fabric', key: attributeVariableKey('fabric', 'Fabric'), value: 'Rayon' },
      { label: 'Fabric', key: attributeVariableKey('spec-fabric', 'Fabric'), value: 'Cotton' },
    ]);

    expect(fields).toHaveLength(1);
    expect(renderFieldBlock(fields)).toBe('Fabric: Rayon');
  });

  it('falls back to the second family when the first is empty', () => {
    const fields = collectFields([
      { label: 'Fabric', key: 'fabric', value: '   ' },
      { label: 'Fabric', key: 'fabric', value: 'Cotton' },
    ]);

    expect(renderFieldBlock(fields)).toBe('Fabric: Cotton');
  });

  it('collapses the duplicate Occasion the form carries twice', () => {
    // The builder keeps its own `occasion` state and the catalog also seeds an
    // Occasion attribute.
    const fields = collectFields([
      { label: 'Occasion', key: 'occasion', value: 'Festive' },
      { label: 'Occasion', key: 'occasion', value: 'Party' },
    ]);

    expect(fields).toHaveLength(1);
  });
});
