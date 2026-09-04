import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Printer,
  Share2,
  CheckCircle2,
  Package,
  Receipt,
  FileText,
  Tag,
  Info,
  ExternalLink,
  Sliders,
  Sparkles,
  Bluetooth,
} from 'lucide-react-native';
import {
  bluetoothPrinterService,
  PrinterShippingLabelData,
  PrinterReceiptData,
  PrinterLabelData,
} from '../services/bluetooth-printer';

type DemoCategory = 'SHIPPING' | 'BARCODE' | 'POS_RECEIPT' | 'GST_INVOICE';
type BarcodeLabelSize = 'SMALL' | 'MEDIUM' | 'LARGE';
type ReceiptPaperWidth = 80 | 58;

interface ShippingDemoItem {
  id: string;
  name: string;
  data: PrinterShippingLabelData;
}

interface BarcodeDemoItem {
  id: string;
  productName: string;
  variant: string;
  sku: string;
  barcode: string;
  price: number;
  mrp: number;
}

interface ReceiptDemoItem {
  id: string;
  name: string;
  data: PrinterReceiptData;
}

// Realistic demo datasets
const SHIPPING_DEMOS: ShippingDemoItem[] = [
  {
    id: 'ship-1',
    name: 'Delhivery Surface (Bangalore - Prepaid)',
    data: {
      courier: 'DELHIVERY SURFACE',
      waybill: 'DEL749281034',
      orderNumber: 'ORD-ONL-20260904-0012',
      paymentType: 'PREPAID',
      consigneeName: 'Priya Sharma',
      consigneePhone: '+91 98451 23098',
      consigneeAddress: 'Flat 402, Green Palms, 12th Main Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      routingHub: 'BLR/IND/560038',
      weightGrams: 650,
      sellerName: "Vasanthi's Signature",
      sellerAddress: 'Plot 42, Jubilee Hills Rd No 36, Hyderabad, TS - 500033',
      sellerGst: '36AABCU9603R1ZM',
      itemsSummary: 'Emerald Silk Lehenga Set (Size: M)',
    },
  },
  {
    id: 'ship-2',
    name: 'Delhivery Express (Hyderabad - COD ₹3,499)',
    data: {
      courier: 'DELHIVERY EXPRESS',
      waybill: 'DEL829104829',
      orderNumber: 'ORD-ONL-20260904-0015',
      paymentType: 'COD',
      codAmount: 3499,
      consigneeName: 'Ananya Reddy',
      consigneePhone: '+91 97012 34567',
      consigneeAddress: 'Villa 18, Road No 10, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      routingHub: 'HYD/BNJ/500034',
      weightGrams: 500,
      sellerName: "Vasanthi's Signature",
      sellerAddress: 'Plot 42, Jubilee Hills Rd No 36, Hyderabad, TS - 500033',
      sellerGst: '36AABCU9603R1ZM',
      itemsSummary: 'Banarasi Handloom Silk Saree (Red-Gold)',
    },
  },
];

const BARCODE_DEMOS: BarcodeDemoItem[] = [
  {
    id: 'bc-1',
    productName: 'Banarasi Kanjeevaram Saree',
    variant: 'Size: Free | Color: Crimson Red',
    sku: 'SAREE-BAN-CR',
    barcode: '890276721684',
    price: 5499,
    mrp: 7999,
  },
  {
    id: 'bc-2',
    productName: 'Embroidered Anarkali Suit',
    variant: 'Size: L | Color: Royal Blue',
    sku: 'ANAR-BLU-L',
    barcode: '890839201948',
    price: 3299,
    mrp: 4999,
  },
  {
    id: 'bc-3',
    productName: 'Designer Georgette Dupatta',
    variant: 'Size: Standard | Color: Coral Pink',
    sku: 'DUP-PNK-01',
    barcode: '890192847102',
    price: 1499,
    mrp: 2199,
  },
];

const RECEIPT_DEMOS: ReceiptDemoItem[] = [
  {
    id: 'rec-1',
    name: 'Standard POS Sale (80mm / 3-Item Slip)',
    data: {
      storeName: "VASANTHI'S SIGNATURE",
      storeTagline: "Women's Ethnic Wear & Designer Couture",
      address: 'Plot 42, Jubilee Hills Rd No 36, Hyd - 500033\nGSTIN: 36AABCU9603R1ZM',
      phone: '+91 98765 43210',
      orderNumber: 'ORD-POS-20260904-0002',
      dateStr: '04-Sep-2026 18:45 PM',
      cashierName: 'POS Counter 01 (Store Cashier)',
      customerName: 'Sravani Varma',
      customerPhone: '9848012345',
      items: [
        { title: 'Banarasi Silk Saree', quantity: 1, unitPrice: 5499 },
        { title: 'Designer Anarkali Set (M)', quantity: 1, unitPrice: 3299 },
        { title: 'Silk Dupatta - Gold', quantity: 1, unitPrice: 999 },
      ],
      subtotal: 9797,
      discountTotal: 500,
      taxTotal: 442.71,
      grandTotal: 9739.71,
      paymentMethod: 'UPI / PhonePe',
      paperWidthMm: 80,
    },
  },
  {
    id: 'rec-2',
    name: 'Express 58mm Mini Slip (Single Item)',
    data: {
      storeName: "VASANTHI'S SIGNATURE",
      storeTagline: 'Boutique Store',
      address: 'Jubilee Hills, Hyderabad\nGSTIN: 36AABCU9603R1ZM',
      phone: '+91 98765 43210',
      orderNumber: 'ORD-POS-20260904-0009',
      dateStr: '04-Sep-2026 19:10 PM',
      cashierName: 'Staff 02',
      customerName: 'Walk-in Guest',
      items: [
        { title: 'Georgette Kurti (L)', quantity: 1, unitPrice: 2499 },
      ],
      subtotal: 2499,
      taxTotal: 119,
      grandTotal: 2499,
      paymentMethod: 'CASH',
      paperWidthMm: 58,
    },
  },
];

export default function PrinterDemoScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<DemoCategory>('SHIPPING');
  const [selectedShippingIdx, setSelectedShippingIdx] = useState(0);
  const [selectedBarcodeIdx, setSelectedBarcodeIdx] = useState(0);
  const [barcodeSize, setBarcodeSize] = useState<BarcodeLabelSize>('SMALL');
  const [selectedReceiptIdx, setSelectedReceiptIdx] = useState(0);
  const [receiptWidth, setReceiptWidth] = useState<ReceiptPaperWidth>(80);

  const [isPrinting, setIsPrinting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const isBtConnected = bluetoothPrinterService.isConnected();
  const connectedPrinterName = bluetoothPrinterService.connectedDeviceName();

  const handlePrintViaBluetooth = async () => {
    if (!isBtConnected) {
      Alert.alert(
        'Printer Not Connected',
        'Connect a Bluetooth thermal printer in Printer Settings first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => router.push('/printer-settings') },
        ],
      );
      return;
    }

    setIsPrinting(true);
    setStatusMsg('');

    try {
      if (activeTab === 'SHIPPING') {
        const item = SHIPPING_DEMOS[selectedShippingIdx];
        await bluetoothPrinterService.printShippingLabel(item.data);
        setStatusMsg('✅ 4x6 Shipping Label printed successfully!');
      } else if (activeTab === 'BARCODE') {
        const item = BARCODE_DEMOS[selectedBarcodeIdx];
        const sizeMap: Record<BarcodeLabelSize, { widthMm: number; heightMm: number }> = {
          SMALL: { widthMm: 50, heightMm: 25 },
          MEDIUM: { widthMm: 75, heightMm: 40 },
          LARGE: { widthMm: 100, heightMm: 50 },
        };
        await bluetoothPrinterService.printLabel({
          productName: item.productName,
          variantTitle: item.variant,
          sku: item.sku,
          barcode: item.barcode,
          price: item.price,
          storeName: "VASANTHI'S",
          quantity: 1,
          ...sizeMap[barcodeSize],
        });
        setStatusMsg(`✅ ${barcodeSize} Barcode Label printed successfully!`);
      } else if (activeTab === 'POS_RECEIPT') {
        const item = RECEIPT_DEMOS[selectedReceiptIdx];
        await bluetoothPrinterService.printReceipt({
          ...item.data,
          paperWidthMm: receiptWidth,
        });
        setStatusMsg(`✅ ${receiptWidth}mm POS Thermal Receipt printed successfully!`);
      } else if (activeTab === 'GST_INVOICE') {
        // A4 invoices are full-page documents meant for system print / laser printer
        await handleShareOrSystemPrint();
      }
    } catch (err: any) {
      Alert.alert('Print Error', err?.message || 'Failed to dispatch print command to device.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareOrSystemPrint = async () => {
    try {
      if (activeTab === 'SHIPPING') {
        const item = SHIPPING_DEMOS[selectedShippingIdx];
        const d = item.data;
        const text = `========================================
DELHIVERY SHIPPING LABEL (4x6 INCH / 100x150MM)
========================================
COURIER: ${d.courier}
PAYMENT: ${d.paymentType} ${d.codAmount ? `(Collect ₹${d.codAmount})` : '(Prepaid)'}
AWB: ${d.waybill}
ORDER: ${d.orderNumber}
WEIGHT: ${d.weightGrams}g

SHIP TO:
${d.consigneeName} (Ph: ${d.consigneePhone})
${d.consigneeAddress}
${d.city}, ${d.state} - PIN: ${d.pincode}
ROUTING HUB: ${d.routingHub}

SHIPPER & RETURN ADDRESS:
${d.sellerName}
${d.sellerAddress}
GSTIN: ${d.sellerGst}
========================================`;
        await Share.share({ title: `Shipping Label - ${d.waybill}`, message: text });
      } else if (activeTab === 'BARCODE') {
        const item = BARCODE_DEMOS[selectedBarcodeIdx];
        const text = `=============================
VASANTHI'S SIGNATURE
${item.productName}
${item.variant}
SKU: ${item.sku}
BARCODE: ${item.barcode}
MRP: Rs.${item.mrp} | OFFER: Rs.${item.price}
=============================`;
        await Share.share({ title: `Barcode Sticker - ${item.sku}`, message: text });
      } else if (activeTab === 'POS_RECEIPT') {
        const item = RECEIPT_DEMOS[selectedReceiptIdx];
        const d = item.data;
        let text = `========================================
${d.storeName}
${d.storeTagline}
${d.address}
Ph: ${d.phone}
----------------------------------------
Invoice: ${d.orderNumber}
Date: ${d.dateStr}
Cashier: ${d.cashierName}
Customer: ${d.customerName} (${d.customerPhone})
----------------------------------------
`;
        for (const it of d.items) {
          text += `${it.title} x${it.quantity} - Rs.${it.unitPrice * it.quantity}\n`;
        }
        text += `----------------------------------------
Subtotal: Rs.${d.subtotal}
GST (5%): Rs.${d.taxTotal}
TOTAL: Rs.${d.grandTotal}
Payment: ${d.paymentMethod}
========================================
Thank You For Shopping With Us!`;
        await Share.share({ title: `POS Receipt - ${d.orderNumber}`, message: text });
      } else if (activeTab === 'GST_INVOICE') {
        const text = `========================================================
TAX INVOICE (RULE 46 OF CGST RULES, 2017)
VASANTHI'S SIGNATURE BOUTIQUE & DESIGNER FASHION
Plot 42, Road No 36, Jubilee Hills, Hyderabad - 500033
GSTIN: 36AABCU9603R1ZM | State: 36-Telangana
--------------------------------------------------------
Invoice No: INV-20260904-0012
Date of Issue: 04-Sep-2026
Order Ref: ORD-ONL-20260904-0012

Billed & Shipped To:
Priya Sharma (Ph: +91 98451 23098)
Flat 402, Green Palms, 12th Main Road, Indiranagar, Bengaluru, KA - 560038
State Code: 29-Karnataka (IGST Applicable)

ITEMS:
1. Emerald Silk Lehenga Set | HSN: 6204 | Qty: 1 | Taxable: Rs.4,380.00 | IGST (5%): Rs.219.00 | Total: Rs.4,599.00
--------------------------------------------------------
Grand Total (in words): Rupees Four Thousand Five Hundred Ninety-Nine Only
Authorized Signatory: For Vasanthi's Signature
========================================================`;
        await Share.share({ title: 'A4 GST Tax Invoice', message: text });
      }
    } catch (e: any) {
      console.log('Share dismissed or failed', e);
    }
  };

  const curShipping = SHIPPING_DEMOS[selectedShippingIdx];
  const curBarcode = BARCODE_DEMOS[selectedBarcodeIdx];
  const curReceipt = RECEIPT_DEMOS[selectedReceiptIdx];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Printer Demo & Test Lab</Text>
          <Text style={styles.headerSub}>Test physical thermal, label & POS printers</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/printer-settings')}
        >
          <Bluetooth size={16} color="#ffffff" />
          <Text style={styles.settingsBtnText}>Pair</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status Banner */}
      <TouchableOpacity
        style={[styles.statusBar, isBtConnected ? styles.statusBarConnected : styles.statusBarDisconnected]}
        onPress={() => router.push('/printer-settings')}
        activeOpacity={0.85}
      >
        <View style={styles.statusDotRow}>
          <View style={[styles.statusDot, { backgroundColor: isBtConnected ? '#16a34a' : '#f59e0b' }]} />
          <Text style={styles.statusTitle}>
            {isBtConnected
              ? `Bluetooth Connected: ${connectedPrinterName || 'Thermal Printer'}`
              : 'No Bluetooth Printer Connected (Tap to Pair)'}
          </Text>
        </View>
        <Text style={styles.statusAction}>Configure &rarr;</Text>
      </TouchableOpacity>

      {/* 4 Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'SHIPPING' && styles.tabItemActive]}
            onPress={() => { setActiveTab('SHIPPING'); setStatusMsg(''); }}
          >
            <Package size={16} color={activeTab === 'SHIPPING' ? '#0284c7' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'SHIPPING' && styles.tabTextActive]}>
              1. 4x6 Shipping Label
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'BARCODE' && styles.tabItemActive]}
            onPress={() => { setActiveTab('BARCODE'); setStatusMsg(''); }}
          >
            <Tag size={16} color={activeTab === 'BARCODE' ? '#0284c7' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'BARCODE' && styles.tabTextActive]}>
              2. Barcode Stickers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'POS_RECEIPT' && styles.tabItemActive]}
            onPress={() => { setActiveTab('POS_RECEIPT'); setStatusMsg(''); }}
          >
            <Receipt size={16} color={activeTab === 'POS_RECEIPT' ? '#0284c7' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'POS_RECEIPT' && styles.tabTextActive]}>
              3. POS Billing Slip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'GST_INVOICE' && styles.tabItemActive]}
            onPress={() => { setActiveTab('GST_INVOICE'); setStatusMsg(''); }}
          >
            <FileText size={16} color={activeTab === 'GST_INVOICE' ? '#0284c7' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'GST_INVOICE' && styles.tabTextActive]}>
              4. A4 GST Invoice
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {statusMsg !== '' && (
          <View style={styles.successBox}>
            <CheckCircle2 size={16} color="#15803d" style={{ marginRight: 6 }} />
            <Text style={styles.successBoxText}>{statusMsg}</Text>
          </View>
        )}

        {/* TAB 1: SHIPPING LABELS (4x6 INCH / 100x150MM) */}
        {activeTab === 'SHIPPING' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Delhivery 4x6 Courier Shipping Label</Text>
                <Text style={styles.sectionSub}>Standard Size: 4 x 6 inches (100 x 150 mm) &bull; Direct Thermal</Text>
              </View>
              <View style={styles.badgeBlue}>
                <Text style={styles.badgeBlueText}>4 x 6 in</Text>
              </View>
            </View>

            {/* Sample Selector */}
            <Text style={styles.pickerLabel}>SELECT SAMPLE ORDER:</Text>
            <View style={styles.sampleChipsRow}>
              {SHIPPING_DEMOS.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sampleChip, selectedShippingIdx === idx && styles.sampleChipActive]}
                  onPress={() => setSelectedShippingIdx(idx)}
                >
                  <Text style={[styles.sampleChipText, selectedShippingIdx === idx && styles.sampleChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Visual Paper Preview */}
            <Text style={styles.previewHeader}>PHYSICAL LABEL PREVIEW:</Text>
            <View style={styles.shippingPaperPreview}>
              <View style={styles.shippingHeaderRow}>
                <View>
                  <Text style={styles.courierTitle}>{curShipping.data.courier}</Text>
                  <Text style={styles.shippingAwb}>AWB: {curShipping.data.waybill}</Text>
                </View>
                <View style={styles.payTypeTag}>
                  <Text style={styles.payTypeTagText}>
                    {curShipping.data.paymentType}{' '}
                    {curShipping.data.codAmount ? `₹${curShipping.data.codAmount}` : ''}
                  </Text>
                </View>
              </View>

              {/* Barcode Simulated Strip */}
              <View style={styles.barcodeStrip}>
                <View style={styles.simulatedBarcodeLines}>
                  {Array.from({ length: 42 }).map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1,
                        height: 38,
                        backgroundColor: '#000000',
                        marginHorizontal: 1,
                      }}
                    />
                  ))}
                </View>
                <Text style={styles.barcodeText}>{curShipping.data.waybill}</Text>
              </View>

              <View style={styles.dividerDotted} />

              <View style={styles.addressBlock}>
                <Text style={styles.shipToHeader}>SHIP TO / CONSIGNEE:</Text>
                <Text style={styles.consigneeName}>
                  {curShipping.data.consigneeName} (Ph: {curShipping.data.consigneePhone})
                </Text>
                <Text style={styles.consigneeAddr}>{curShipping.data.consigneeAddress}</Text>
                <Text style={styles.consigneeCity}>
                  {curShipping.data.city}, {curShipping.data.state} - PIN: {curShipping.data.pincode}
                </Text>
                <Text style={styles.hubTag}>Routing Hub: {curShipping.data.routingHub}</Text>
              </View>

              <View style={styles.dividerDotted} />

              <View style={styles.sellerBlock}>
                <Text style={styles.shipperHeader}>RETURN / SHIPPER ADDRESS:</Text>
                <Text style={styles.sellerName}>{curShipping.data.sellerName}</Text>
                <Text style={styles.sellerAddr}>{curShipping.data.sellerAddress}</Text>
                <Text style={styles.sellerGst}>GSTIN: {curShipping.data.sellerGst}</Text>
                <Text style={styles.itemSummaryText}>Items: {curShipping.data.itemsSummary}</Text>
              </View>
            </View>

            {/* Hardware Recommendation */}
            <View style={styles.hardwareTip}>
              <Info size={14} color="#0369a1" style={{ marginRight: 6 }} />
              <Text style={styles.hardwareTipText}>
                <Text style={{ fontWeight: 'bold' }}>Recommended Printers:</Text> TVS LP 46 Neo, TSC TE244, Zebra ZD220 / ZD421, Rollo 4x6.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 2: PRODUCT BARCODE STICKERS (Small/Med/Large) */}
        {activeTab === 'BARCODE' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Product Barcode & Garment Price Tag</Text>
                <Text style={styles.sectionSub}>Supported Sizes: Small (50x25mm), Medium (75x40mm), Large (100x50mm)</Text>
              </View>
              <View style={styles.badgeBlue}>
                <Text style={styles.badgeBlueText}>TSPL Sticker</Text>
              </View>
            </View>

            {/* Size Selector */}
            <Text style={styles.pickerLabel}>SELECT STICKER SIZE:</Text>
            <View style={styles.sizeTogglesRow}>
              {(['SMALL', 'MEDIUM', 'LARGE'] as BarcodeLabelSize[]).map((sz) => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeToggleBtn, barcodeSize === sz && styles.sizeToggleBtnActive]}
                  onPress={() => setBarcodeSize(sz)}
                >
                  <Text style={[styles.sizeToggleBtnText, barcodeSize === sz && styles.sizeToggleBtnTextActive]}>
                    {sz === 'SMALL' ? 'Small (50x25 mm)' : sz === 'MEDIUM' ? 'Medium (75x40 mm)' : 'Large (100x50 mm)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sample Selector */}
            <Text style={[styles.pickerLabel, { marginTop: 12 }]}>SELECT PRODUCT SAMPLE:</Text>
            <View style={styles.sampleChipsRow}>
              {BARCODE_DEMOS.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sampleChip, selectedBarcodeIdx === idx && styles.sampleChipActive]}
                  onPress={() => setSelectedBarcodeIdx(idx)}
                >
                  <Text style={[styles.sampleChipText, selectedBarcodeIdx === idx && styles.sampleChipTextActive]}>
                    {item.productName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Visual Sticker Preview */}
            <Text style={styles.previewHeader}>STICKER PREVIEW ({barcodeSize}):</Text>
            <View style={[styles.stickerPaperPreview, barcodeSize === 'LARGE' ? { minHeight: 180 } : barcodeSize === 'MEDIUM' ? { minHeight: 140 } : { minHeight: 110 }]}>
              <Text style={styles.stickerStoreTitle}>VASANTHI'S SIGNATURE</Text>
              <Text style={styles.stickerProdName}>{curBarcode.productName}</Text>
              <Text style={styles.stickerVariant}>{curBarcode.variant}</Text>
              <Text style={styles.stickerSku}>SKU: {curBarcode.sku}</Text>

              <View style={styles.barcodeStripSmall}>
                <View style={styles.simulatedBarcodeLinesSmall}>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: i % 4 === 0 ? 3 : i % 2 === 0 ? 1.5 : 1,
                        height: 24,
                        backgroundColor: '#000000',
                        marginHorizontal: 0.8,
                      }}
                    />
                  ))}
                </View>
                <Text style={styles.barcodeCodeText}>{curBarcode.barcode}</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.mrpText}>MRP: ₹{curBarcode.mrp}</Text>
                <Text style={styles.offerPriceText}>OUR PRICE: ₹{curBarcode.price}</Text>
              </View>
            </View>

            {/* Hardware Recommendation */}
            <View style={styles.hardwareTip}>
              <Info size={14} color="#0369a1" style={{ marginRight: 6 }} />
              <Text style={styles.hardwareTipText}>
                <Text style={{ fontWeight: 'bold' }}>Recommended Media:</Text> 50x25mm (2x1 in) 1-across or 2-across direct thermal adhesive sticker rolls.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 3: POS THERMAL RECEIPT SLIPS (80mm / 58mm) */}
        {activeTab === 'POS_RECEIPT' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>In-Store POS Thermal Receipt Slip</Text>
                <Text style={styles.sectionSub}>Standard Roll Width: 80 mm (3-inch) or 58 mm (2-inch compact)</Text>
              </View>
              <View style={styles.badgeBlue}>
                <Text style={styles.badgeBlueText}>ESC/POS</Text>
              </View>
            </View>

            {/* Roll Width Toggle */}
            <Text style={styles.pickerLabel}>SELECT PAPER ROLL WIDTH:</Text>
            <View style={styles.sizeTogglesRow}>
              <TouchableOpacity
                style={[styles.sizeToggleBtn, receiptWidth === 80 && styles.sizeToggleBtnActive]}
                onPress={() => setReceiptWidth(80)}
              >
                <Text style={[styles.sizeToggleBtnText, receiptWidth === 80 && styles.sizeToggleBtnTextActive]}>
                  80 mm (Standard POS Roll)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sizeToggleBtn, receiptWidth === 58 && styles.sizeToggleBtnActive]}
                onPress={() => setReceiptWidth(58)}
              >
                <Text style={[styles.sizeToggleBtnText, receiptWidth === 58 && styles.sizeToggleBtnTextActive]}>
                  58 mm (Compact Handheld Roll)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sample Selector */}
            <Text style={[styles.pickerLabel, { marginTop: 12 }]}>SELECT RECEIPT SAMPLE:</Text>
            <View style={styles.sampleChipsRow}>
              {RECEIPT_DEMOS.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sampleChip, selectedReceiptIdx === idx && styles.sampleChipActive]}
                  onPress={() => setSelectedReceiptIdx(idx)}
                >
                  <Text style={[styles.sampleChipText, selectedReceiptIdx === idx && styles.sampleChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Visual Receipt Preview */}
            <Text style={styles.previewHeader}>RECEIPT PREVIEW ({receiptWidth}mm):</Text>
            <View style={[styles.receiptPaperPreview, receiptWidth === 58 ? { width: '75%', alignSelf: 'center' } : { width: '100%' }]}>
              <Text style={styles.receiptStoreName}>{curReceipt.data.storeName}</Text>
              <Text style={styles.receiptTagline}>{curReceipt.data.storeTagline}</Text>
              <Text style={styles.receiptAddress}>{curReceipt.data.address}</Text>
              <Text style={styles.receiptPhone}>Ph: {curReceipt.data.phone}</Text>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMeta}>Invoice: {curReceipt.data.orderNumber}</Text>
                <Text style={styles.receiptMeta}>Date: {curReceipt.data.dateStr}</Text>
              </View>
              <Text style={styles.receiptMeta}>Cashier: {curReceipt.data.cashierName}</Text>
              <Text style={styles.receiptMeta}>Customer: {curReceipt.data.customerName} ({curReceipt.data.customerPhone})</Text>

              <View style={styles.receiptDivider} />

              {/* Items List */}
              {curReceipt.data.items.map((it, idx) => (
                <View key={idx} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemTitle} numberOfLines={1}>{it.title} x{it.quantity}</Text>
                  <Text style={styles.receiptItemPrice}>₹{(it.unitPrice * it.quantity).toFixed(2)}</Text>
                </View>
              ))}

              <View style={styles.receiptDivider} />

              <View style={styles.receiptItemRow}>
                <Text style={styles.receiptTotalsLabel}>Subtotal</Text>
                <Text style={styles.receiptTotalsVal}>₹{curReceipt.data.subtotal.toFixed(2)}</Text>
              </View>
              {curReceipt.data.discountTotal ? (
                <View style={styles.receiptItemRow}>
                  <Text style={styles.receiptTotalsLabel}>Discount</Text>
                  <Text style={styles.receiptTotalsVal}>-₹{curReceipt.data.discountTotal.toFixed(2)}</Text>
                </View>
              ) : null}
              <View style={styles.receiptItemRow}>
                <Text style={styles.receiptTotalsLabel}>GST (5% CGST+SGST)</Text>
                <Text style={styles.receiptTotalsVal}>₹{(curReceipt.data.taxTotal || 0).toFixed(2)}</Text>
              </View>
              <View style={[styles.receiptItemRow, { marginTop: 4 }]}>
                <Text style={styles.receiptGrandTotalLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.receiptGrandTotalVal}>₹{curReceipt.data.grandTotal.toFixed(2)}</Text>
              </View>
              <Text style={styles.receiptPayment}>Payment Mode: {curReceipt.data.paymentMethod}</Text>

              <View style={styles.receiptDivider} />
              <Text style={styles.receiptFooter}>❖ THANK YOU FOR SHOPPING WITH US! ❖</Text>
              <Text style={styles.receiptFooterSub}>Visit again &bull; vasanthissignature.in</Text>
            </View>

            {/* Hardware Recommendation */}
            <View style={styles.hardwareTip}>
              <Info size={14} color="#0369a1" style={{ marginRight: 6 }} />
              <Text style={styles.hardwareTipText}>
                <Text style={{ fontWeight: 'bold' }}>Recommended POS Printers:</Text> Epson TM-T82, TVS RP 3200, Star Micronics, or any 80mm Bluetooth ESC/POS printer.
              </Text>
            </View>
          </View>
        )}

        {/* TAB 4: A4 GST TAX INVOICE */}
        {activeTab === 'GST_INVOICE' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Official A4 GST Tax Invoice</Text>
                <Text style={styles.sectionSub}>Standard Size: A4 (210 x 297 mm) &bull; Desktop Laser / Inkjet Printer</Text>
              </View>
              <View style={styles.badgeBlue}>
                <Text style={styles.badgeBlueText}>A4 Laser</Text>
              </View>
            </View>

            <View style={styles.a4PaperPreview}>
              <View style={styles.a4TopRow}>
                <View>
                  <Text style={styles.a4StoreName}>VASANTHI'S SIGNATURE</Text>
                  <Text style={styles.a4StoreSub}>Women's Ethnic Wear & Designer Fashion</Text>
                  <Text style={styles.a4StoreAddr}>Plot 42, Jubilee Hills Rd No 36, Hyderabad, TS - 500033</Text>
                  <Text style={styles.a4Gst}>GSTIN: 36AABCU9603R1ZM</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.a4TaxTitle}>TAX INVOICE</Text>
                  <Text style={styles.a4InvNum}>INV-20260904-0012</Text>
                  <Text style={styles.a4InvDate}>Date: 04-Sep-2026</Text>
                </View>
              </View>

              <View style={styles.a4Divider} />

              <View style={styles.a4PartyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.a4PartyHeader}>Billed To:</Text>
                  <Text style={styles.a4PartyName}>Priya Sharma</Text>
                  <Text style={styles.a4PartyAddr}>Flat 402, Green Palms, Indiranagar, Bengaluru - 560038</Text>
                  <Text style={styles.a4PartyState}>State: Karnataka (Code: 29)</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.a4PartyHeader}>Shipped To:</Text>
                  <Text style={styles.a4PartyName}>Priya Sharma (Ph: 9845123098)</Text>
                  <Text style={styles.a4PartyAddr}>Flat 402, Green Palms, Indiranagar, Bengaluru - 560038</Text>
                  <Text style={styles.a4PartyState}>Courier: Delhivery (AWB: DEL749281034)</Text>
                </View>
              </View>

              <View style={styles.a4Table}>
                <View style={styles.a4TableHeader}>
                  <Text style={[styles.a4Th, { flex: 2 }]}>Item Description</Text>
                  <Text style={[styles.a4Th, { flex: 1 }]}>HSN</Text>
                  <Text style={[styles.a4Th, { flex: 0.6 }]}>Qty</Text>
                  <Text style={[styles.a4Th, { flex: 1 }]}>Rate</Text>
                  <Text style={[styles.a4Th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                </View>
                <View style={styles.a4TableRow}>
                  <Text style={[styles.a4Td, { flex: 2 }]}>Emerald Silk Lehenga Set (Size: M)</Text>
                  <Text style={[styles.a4Td, { flex: 1 }]}>6204</Text>
                  <Text style={[styles.a4Td, { flex: 0.6 }]}>1</Text>
                  <Text style={[styles.a4Td, { flex: 1 }]}>₹4,380.00</Text>
                  <Text style={[styles.a4Td, { flex: 1, textAlign: 'right' }]}>₹4,380.00</Text>
                </View>
              </View>

              <View style={styles.a4TotalBlock}>
                <View style={styles.a4TotalRow}>
                  <Text style={styles.a4TotalLabel}>Taxable Subtotal:</Text>
                  <Text style={styles.a4TotalVal}>₹4,380.00</Text>
                </View>
                <View style={styles.a4TotalRow}>
                  <Text style={styles.a4TotalLabel}>IGST (5%):</Text>
                  <Text style={styles.a4TotalVal}>₹219.00</Text>
                </View>
                <View style={[styles.a4TotalRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4 }]}>
                  <Text style={[styles.a4TotalLabel, { fontWeight: 'bold' }]}>Invoice Grand Total:</Text>
                  <Text style={[styles.a4TotalVal, { fontWeight: 'bold' }]}>₹4,599.00</Text>
                </View>
              </View>
            </View>

            <View style={styles.hardwareTip}>
              <Info size={14} color="#0369a1" style={{ marginRight: 6 }} />
              <Text style={styles.hardwareTipText}>
                <Text style={{ fontWeight: 'bold' }}>Recommended Printers:</Text> Standard Office Wi-Fi / USB Laser or Ink Tank Printer (HP LaserJet, Canon, Epson EcoTank).
              </Text>
            </View>
          </View>
        )}

        {/* ACTION BUTTONS (Bluetooth Print & Share / Wi-Fi Print) */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.primaryPrintBtn, isPrinting && { opacity: 0.6 }]}
            onPress={handlePrintViaBluetooth}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Printer size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryPrintBtnText}>
                  {activeTab === 'GST_INVOICE'
                    ? 'Print A4 Invoice (System)'
                    : isBtConnected
                    ? 'Print via Bluetooth'
                    : 'Test Bluetooth Print'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryShareBtn}
            onPress={handleShareOrSystemPrint}
          >
            <Share2 size={18} color="#0284c7" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryShareBtnText}>Share / Wi-Fi Print</Text>
          </TouchableOpacity>
        </View>

        {/* PRINTER BUYING & TESTING GUIDE */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <Sparkles size={18} color="#0284c7" style={{ marginRight: 6 }} />
            <Text style={styles.guideTitle}>Printer Shop Testing & Buying Guide</Text>
          </View>
          <Text style={styles.guideText}>
            When visiting the printer shop tomorrow, follow these 3 steps to test with this app:
          </Text>
          <View style={styles.guideSteps}>
            <Text style={styles.guideStep}>
              <Text style={{ fontWeight: 'bold' }}>1. Pair Bluetooth:</Text> Go to phone's Android Bluetooth Settings &rarr; Pair the printer (PIN is usually <Text style={{ fontFamily: 'monospace' }}>0000</Text> or <Text style={{ fontFamily: 'monospace' }}>1234</Text>).
            </Text>
            <Text style={styles.guideStep}>
              <Text style={{ fontWeight: 'bold' }}>2. Connect in App:</Text> Tap the <Text style={{ fontWeight: 'bold' }}>"Pair"</Text> button at the top right &rarr; Select your printer &rarr; Status will turn <Text style={{ color: '#16a34a', fontWeight: 'bold' }}>Green</Text>.
            </Text>
            <Text style={styles.guideStep}>
              <Text style={{ fontWeight: 'bold' }}>3. Trigger Demo Prints:</Text> Switch between the 4 tabs above and press <Text style={{ fontWeight: 'bold' }}>"Print via Bluetooth"</Text> to verify alignment, font clarity, and barcode scannability!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 11,
    color: '#e0f2fe',
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  settingsBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statusBarConnected: {
    backgroundColor: '#f0fdf4',
    borderBottomColor: '#bbf7d0',
  },
  statusBarDisconnected: {
    backgroundColor: '#fffbeb',
    borderBottomColor: '#fde68a',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  statusAction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabItemActive: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0284c7',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: 'bold',
  },
  scrollBody: {
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  successBoxText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badgeBlue: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeBlueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sampleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  sampleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sampleChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sampleChipTextActive: {
    color: '#ffffff',
  },
  sizeTogglesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  sizeToggleBtn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  sizeToggleBtnActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  sizeToggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sizeToggleBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  previewHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  // 4x6 Shipping Label Paper
  shippingPaperPreview: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    borderRadius: 8,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shippingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courierTitle: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'sans-serif',
    color: '#000000',
  },
  shippingAwb: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 2,
  },
  payTypeTag: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  payTypeTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  barcodeStrip: {
    alignItems: 'center',
    marginVertical: 10,
  },
  simulatedBarcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  barcodeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  dividerDotted: {
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  addressBlock: {
    marginVertical: 2,
  },
  shipToHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
  },
  consigneeName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  consigneeAddr: {
    fontSize: 11,
    color: '#1e293b',
    marginTop: 1,
  },
  consigneeCity: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 2,
  },
  hubTag: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    borderRadius: 4,
  },
  sellerBlock: {
    marginTop: 2,
  },
  shipperHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  },
  sellerName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  sellerAddr: {
    fontSize: 10,
    color: '#475569',
  },
  sellerGst: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#64748b',
    marginTop: 1,
  },
  itemSummaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 3,
  },
  // Barcode Sticker Paper
  stickerPaperPreview: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerStoreTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#000000',
  },
  stickerProdName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 2,
  },
  stickerVariant: {
    fontSize: 9,
    color: '#64748b',
  },
  stickerSku: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 1,
  },
  barcodeStripSmall: {
    alignItems: 'center',
    marginVertical: 6,
  },
  simulatedBarcodeLinesSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
  },
  barcodeCodeText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#000000',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  mrpText: {
    fontSize: 9,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  offerPriceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  // POS Receipt Paper
  receiptPaperPreview: {
    backgroundColor: '#fffdf5',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  receiptStoreName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'serif',
    color: '#000000',
  },
  receiptTagline: {
    fontSize: 9,
    textAlign: 'center',
    color: '#64748b',
    marginTop: 1,
  },
  receiptAddress: {
    fontSize: 9,
    textAlign: 'center',
    color: '#475569',
    marginTop: 2,
  },
  receiptPhone: {
    fontSize: 9,
    textAlign: 'center',
    color: '#475569',
  },
  receiptDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptMeta: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#334155',
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 1.5,
  },
  receiptItemTitle: {
    fontSize: 10,
    color: '#0f172a',
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#000000',
  },
  receiptTotalsLabel: {
    fontSize: 10,
    color: '#475569',
  },
  receiptTotalsVal: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  receiptGrandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  receiptGrandTotalVal: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#000000',
  },
  receiptPayment: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
  },
  receiptFooter: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0f172a',
    marginTop: 4,
  },
  receiptFooterSub: {
    fontSize: 8,
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 1,
  },
  // A4 Preview
  a4PaperPreview: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 4,
    padding: 12,
  },
  a4TopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  a4StoreName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  a4StoreSub: {
    fontSize: 9,
    color: '#64748b',
  },
  a4StoreAddr: {
    fontSize: 8,
    color: '#64748b',
  },
  a4Gst: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#334155',
  },
  a4TaxTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0284c7',
  },
  a4InvNum: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  a4InvDate: {
    fontSize: 8,
    color: '#64748b',
  },
  a4Divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginVertical: 8,
  },
  a4PartyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  a4PartyHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  a4PartyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  a4PartyAddr: {
    fontSize: 8,
    color: '#334155',
  },
  a4PartyState: {
    fontSize: 8,
    color: '#64748b',
  },
  a4Table: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginVertical: 6,
  },
  a4TableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  a4Th: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
  },
  a4TableRow: {
    flexDirection: 'row',
    padding: 4,
  },
  a4Td: {
    fontSize: 8,
    color: '#0f172a',
  },
  a4TotalBlock: {
    alignSelf: 'flex-end',
    width: '50%',
    gap: 2,
    marginTop: 4,
  },
  a4TotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  a4TotalLabel: {
    fontSize: 8,
    color: '#475569',
  },
  a4TotalVal: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#000000',
  },
  hardwareTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
  },
  hardwareTipText: {
    fontSize: 10,
    color: '#0369a1',
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  primaryPrintBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryPrintBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryShareBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  guideText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 8,
  },
  guideSteps: {
    gap: 6,
  },
  guideStep: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
});
