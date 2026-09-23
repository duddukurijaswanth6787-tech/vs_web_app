'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrderList } from '@/features/orders/order.hooks';
import type { OrderResponse } from '@/features/orders/order.types';
import { OrderStatusBadge, ChannelBadge } from '@/components/feedback/StatusBadges';
import {
  Search,
  Eye,
  FileText,
  Calendar,
  Store,
  Globe,
  Users,
  ArrowRight,
  Printer,
  Tag,
  CheckSquare,
  Loader2,
  Download,
  FileSpreadsheet,
  X,
  Check,
  Filter,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import { apiClient } from '@/lib/api/client';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const channel = searchParams.get('channel') || '';
  const status = searchParams.get('status') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const [manifestError, setManifestError] = useState('');
  const [localSearch, setLocalSearch] = useState(search);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // Bulk Selection & Label Printing state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isPrintingLabels, setIsPrintingLabels] = useState(false);
  const [printError, setPrintError] = useState('');

  // Excel & CSV Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportChannel, setExportChannel] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const [exportErrorMsg, setExportErrorMsg] = useState('');

  const { data: listData, isLoading, isError, refetch } = useOrderList({
    page,
    limit: 10,
    search: search || undefined,
    channel: channel || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const handleExportManifest = async () => {
    try {
      const res = await apiClient.get('/shipping/delhivery/manifest');
      const manifest = res.data?.data;
      if (!manifest) return;

      const printWin = window.open('', 'ManifestPrint', 'width=800,height=1000');
      if (!printWin) return;

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Delhivery Manifest - ${manifest.manifestId}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #111; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 12px; }
            .title { font-size: 20px; font-weight: bold; }
            .meta { margin-top: 16px; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f4f4f4; }
            .sig-box { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
            .sig-line { border-top: 1px dashed #000; width: 200px; text-align: center; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">COURIER DISPATCH MANIFEST</div>
              <div style="font-size: 12px; color: #555;">${manifest.courierPartner}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: monospace; font-size: 16px; font-weight: bold;">${manifest.manifestId}</div>
              <div style="font-size: 12px;">Date: ${manifest.manifestDate}</div>
            </div>
          </div>

          <div class="meta">
            <strong>Pickup Location:</strong> ${manifest.pickupLocation.name}<br>
            <strong>Address:</strong> ${manifest.pickupLocation.address}<br>
            <strong>Contact:</strong> ${manifest.pickupLocation.contact}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Order Ref</th>
                <th>AWB / Waybill</th>
                <th>Customer Name</th>
                <th>Destination</th>
                <th>Payment</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              ${manifest.packages.map((pkg: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${pkg.orderNumber}</strong></td>
                  <td style="font-family: monospace;">${pkg.waybillNumber}</td>
                  <td>${pkg.customerName}</td>
                  <td>${pkg.city} (${pkg.pincode})</td>
                  <td>${pkg.paymentMode}</td>
                  <td>${pkg.weightGrams}g</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 16px; font-size: 13px; text-align: right;">
            <strong>Total Packages:</strong> ${manifest.totalPackages} &nbsp;|&nbsp; 
            <strong>Total Weight:</strong> ${manifest.totalWeightGrams}g
          </div>

          <div class="sig-box">
            <div>
              <div class="sig-line">Warehouse Executive Signature</div>
            </div>
            <div>
              <div class="sig-line">Delhivery Driver Signature & Name</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `);
      printWin.document.close();
    } catch {
      setManifestError('Failed to generate End-of-Day manifest.');
      setTimeout(() => setManifestError(''), 4000);
    }
  };

  const handlePrintBulkLabels = async (format: '4x6' | 'A4' = '4x6') => {
    if (!selectedOrderIds.size) return;
    setIsPrintingLabels(true);
    setPrintError('');
    try {
      const res = await apiClient.post('/shipping/bulk-labels', {
        orderIds: Array.from(selectedOrderIds),
        format,
      });
      const data = res.data?.data;
      if (!data?.html) {
        throw new Error('No label printable content returned');
      }

      const printWin = window.open('', '_blank', 'width=900,height=1000');
      if (!printWin) {
        alert('Please allow popups to open the shipping label print window.');
        return;
      }
      printWin.document.open();
      printWin.document.write(data.html);
      printWin.document.close();
    } catch (err: any) {
      setPrintError(err.response?.data?.message || err.message || 'Failed to generate shipping labels.');
      setTimeout(() => setPrintError(''), 5000);
    } finally {
      setIsPrintingLabels(false);
    }
  };


  const setModalDatePreset = (preset: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH' | 'FY' | 'ALL') => {
    const now = new Date();
    if (preset === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      setExportStartDate(todayStr);
      setExportEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yestStr = yest.toISOString().split('T')[0];
      setExportStartDate(yestStr);
      setExportEndDate(yestStr);
    } else if (preset === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setExportStartDate(weekAgo.toISOString().split('T')[0]);
      setExportEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setExportStartDate(startOfMonth.toISOString().split('T')[0]);
      setExportEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'LAST_MONTH') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setExportStartDate(startOfLastMonth.toISOString().split('T')[0]);
      setExportEndDate(endOfLastMonth.toISOString().split('T')[0]);
    } else if (preset === 'FY') {
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const startOfFy = new Date(year, 3, 1);
      setExportStartDate(startOfFy.toISOString().split('T')[0]);
      setExportEndDate(now.toISOString().split('T')[0]);
    } else {
      setExportStartDate('');
      setExportEndDate('');
    }
  };

  const handleExecuteExcelExport = async () => {
    setIsExporting(true);
    setExportErrorMsg('');
    setExportSuccessMsg('');

    try {
      const params: Record<string, string | number> = {
        limit: 5000,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (exportStartDate) {
        params.startDate = new Date(exportStartDate + 'T00:00:00.000Z').toISOString();
      }
      if (exportEndDate) {
        params.endDate = new Date(exportEndDate + 'T23:59:59.999Z').toISOString();
      }
      if (exportChannel) {
        params.channel = exportChannel;
      }
      if (exportStatus) {
        params.status = exportStatus;
      }

      const res = await apiClient.get('/orders', { params });
      const orders: any[] = res.data?.data?.data || res.data?.data || [];

      if (!orders.length) {
        throw new Error('No orders found matching the selected date range and filters.');
      }

      const formattedRows = orders.map((o) => {
        const custFirst = o.customer?.user?.firstName || o.customer?.firstName || '';
        const custLast = o.customer?.user?.lastName || o.customer?.lastName || '';
        const userFullName = (custFirst || custLast) ? `${custFirst} ${custLast}`.trim() : '';

        const shippingAddr = o.addresses?.find((a: any) => a.addressType === 'SHIPPING');
        const billingAddr = o.addresses?.find((a: any) => a.addressType === 'BILLING');
        const name = userFullName || shippingAddr?.fullName || billingAddr?.fullName || o.customerName || (o.channel === 'POS_SHOPORA' ? 'Walk-in Customer' : 'Online Customer');
        const phone = shippingAddr?.phone || billingAddr?.phone || o.customer?.phone || o.customer?.user?.phone || o.customerPhone || '';
        const email = o.customer?.user?.email || o.customer?.email || o.customerEmail || '';
        const addrLine = [shippingAddr?.addressLine1, shippingAddr?.addressLine2].filter(Boolean).join(', ') || '';
        const city = shippingAddr?.city || '';
        const state = shippingAddr?.state || '';
        const pincode = shippingAddr?.pincode || '';

        const itemsSummary = (o.items || []).map((it: any) => `${it.quantity || 1}x ${it.productName || 'Garment'} (${it.variantName || it.sku || ''})`).join(' | ');
        const totalUnits = (o.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

        return {
          orderNumber: o.orderNumber || o.id,
          createdAt: new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          channel: o.channel === 'POS_SHOPORA' ? 'In-Store POS (Shopora)' : 'Online Web Store',
          customerName: name,
          phone,
          email,
          shippingAddress: addrLine,
          city,
          state,
          pincode,
          itemsCount: totalUnits,
          itemsSummary,
          subtotal: Number(o.subtotal || 0).toFixed(2),
          discountTotal: Number(o.discountTotal || 0).toFixed(2),
          taxTotal: Number(o.taxTotal || 0).toFixed(2),
          shippingTotal: Number(o.shippingTotal || 0).toFixed(2),
          grandTotal: Number(o.grandTotal || 0).toFixed(2),
          currency: o.currency || 'INR',
          paymentStatus: o.paymentStatus || 'COMPLETED',
          paymentMethod: o.paymentMethod || (o.channel === 'POS_SHOPORA' ? 'Store Counter / UPI' : 'Razorpay Gateway'),
          orderStatus: o.status,
          waybillNumber: o.waybillNumber || o.shippingProviderOrderId || '—',
          courierPartner: o.courierPartner || 'Delhivery',
          billedBy: o.createdBy || 'System',
          notes: o.notes || '',
        };
      });

      const todayStamp = new Date().toISOString().split('T')[0];
      const filename = `Vasanthi_Signatures_Orders_${todayStamp}.${exportFormat === 'csv' ? 'csv' : 'xls'}`;

      if (exportFormat === 'csv') {
        const headers = [
          'Order Number',
          'Date (IST)',
          'Channel',
          'Customer Name',
          'Phone',
          'Email',
          'Shipping Address',
          'City',
          'State',
          'Pincode',
          'Total Units',
          'Items Summary',
          'Subtotal (INR)',
          'Discount (INR)',
          'Tax / GST (INR)',
          'Shipping (INR)',
          'Grand Total (INR)',
          'Currency',
          'Payment Status',
          'Payment Method',
          'Order Status',
          'Delhivery AWB / Waybill',
          'Courier Partner',
          'Billed By',
          'Notes',
        ];

        const escapeCsv = (str: any) => `"${String(str ?? '').replace(/"/g, '""')}"`;
        const csvContent = '\uFEFF' + [
          headers.map(escapeCsv).join(','),
          ...formattedRows.map((r) => [
            escapeCsv(r.orderNumber),
            escapeCsv(r.createdAt),
            escapeCsv(r.channel),
            escapeCsv(r.customerName),
            escapeCsv(r.phone),
            escapeCsv(r.email),
            escapeCsv(r.shippingAddress),
            escapeCsv(r.city),
            escapeCsv(r.state),
            escapeCsv(r.pincode),
            escapeCsv(r.itemsCount),
            escapeCsv(r.itemsSummary),
            escapeCsv(r.subtotal),
            escapeCsv(r.discountTotal),
            escapeCsv(r.taxTotal),
            escapeCsv(r.shippingTotal),
            escapeCsv(r.grandTotal),
            escapeCsv(r.currency),
            escapeCsv(r.paymentStatus),
            escapeCsv(r.paymentMethod),
            escapeCsv(r.orderStatus),
            escapeCsv(r.waybillNumber),
            escapeCsv(r.courierPartner),
            escapeCsv(r.billedBy),
            escapeCsv(r.notes),
          ].join(',')),
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Excel XML Spreadsheet 2003
        const escapeXml = (unsafe: any) => {
          return String(unsafe ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };

        const excelXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Vasanthi's Signature Orders Report</Title>
  <Author>Vasanthi Signatures</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#000000"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="BoldCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Size="11"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Orders_Report">
  <Table ss:DefaultColumnWidth="120" ss:DefaultRowHeight="20">
   <Column ss:Width="130"/>
   <Column ss:Width="140"/>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="180"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="70"/>
   <Column ss:Width="70"/>
   <Column ss:Width="300"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="60"/>
   <Column ss:Width="100"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   <Column ss:Width="140"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="150"/>
   <Row ss:Height="24" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Order Number</Data></Cell>
    <Cell><Data ss:Type="String">Date (IST)</Data></Cell>
    <Cell><Data ss:Type="String">Sales Channel</Data></Cell>
    <Cell><Data ss:Type="String">Customer Name</Data></Cell>
    <Cell><Data ss:Type="String">Customer Phone</Data></Cell>
    <Cell><Data ss:Type="String">Customer Email</Data></Cell>
    <Cell><Data ss:Type="String">Shipping Address</Data></Cell>
    <Cell><Data ss:Type="String">City</Data></Cell>
    <Cell><Data ss:Type="String">State</Data></Cell>
    <Cell><Data ss:Type="String">Pincode</Data></Cell>
    <Cell><Data ss:Type="Number">Units</Data></Cell>
    <Cell><Data ss:Type="String">Items Summary</Data></Cell>
    <Cell><Data ss:Type="String">Subtotal (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Discount (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Tax/GST (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Shipping (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Grand Total (INR)</Data></Cell>
    <Cell><Data ss:Type="String">Currency</Data></Cell>
    <Cell><Data ss:Type="String">Payment Status</Data></Cell>
    <Cell><Data ss:Type="String">Payment Method</Data></Cell>
    <Cell><Data ss:Type="String">Order Status</Data></Cell>
    <Cell><Data ss:Type="String">Delhivery AWB</Data></Cell>
    <Cell><Data ss:Type="String">Courier</Data></Cell>
    <Cell><Data ss:Type="String">Billed By</Data></Cell>
    <Cell><Data ss:Type="String">Order Notes</Data></Cell>
   </Row>
   ${formattedRows.map((r) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">${escapeXml(r.orderNumber)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.createdAt)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.channel)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.customerName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.phone)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.email)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.shippingAddress)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.city)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.state)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.pincode)}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.itemsCount}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.itemsSummary)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${r.subtotal}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${r.discountTotal}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${r.taxTotal}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${r.shippingTotal}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${r.grandTotal}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.currency)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.paymentStatus)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.paymentMethod)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.orderStatus)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.waybillNumber)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.courierPartner)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.billedBy)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(r.notes)}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

        const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setExportSuccessMsg(`Successfully exported ${orders.length} order(s) to ${filename}`);
      setTimeout(() => {
        setExportSuccessMsg('');
        setIsExportModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setExportErrorMsg(err.response?.data?.message || err.message || 'Failed to export orders.');
    } finally {
      setIsExporting(false);
    }
  };

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    if (key !== 'page') params.set('page', '1');
    router.push(`/admin/orders?${params}`);
  };

  const setDatePreset = (preset: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL') => {
    const now = new Date();
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (preset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      params.set('startDate', start);
      params.delete('endDate');
    } else if (preset === 'YESTERDAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59).toISOString();
      params.set('startDate', start);
      params.set('endDate', end);
    } else if (preset === 'WEEK') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      params.set('startDate', start);
      params.delete('endDate');
    } else if (preset === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      params.set('startDate', start);
      params.delete('endDate');
    } else {
      params.delete('startDate');
      params.delete('endDate');
    }
    router.push(`/admin/orders?${params}`);
  };

  const columns: Column<OrderResponse>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (o) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 block">{o.orderNumber}</span>
          {o.createdBy && (
            <span className="text-[10px] text-neutral-400 font-semibold block">Billed: {o.createdBy}</span>
          )}
        </div>
      ),
    },
    { key: 'channel', label: 'Channel', render: (o) => <ChannelBadge channel={o.channel} /> },
    {
      key: 'customerId',
      label: 'Customer',
      render: (o) => {
        const custFirst = o.customer?.user?.firstName || o.customer?.firstName || '';
        const custLast = o.customer?.user?.lastName || o.customer?.lastName || '';
        const rawUserFullName = (custFirst || custLast) ? `${custFirst} ${custLast}`.trim() : '';
        const userFullName = (rawUserFullName && !['customer', 'user', 'guest', 'admin', 'pos_operator'].includes(rawUserFullName.toLowerCase())) ? rawUserFullName : '';

        const shippingAddr = o.addresses?.find((a) => a.addressType === 'SHIPPING');
        const billingAddr = o.addresses?.find((a) => a.addressType === 'BILLING');
        const addressFullName = shippingAddr?.fullName || billingAddr?.fullName || o.addresses?.[0]?.fullName;

        const defaultLabel = o.channel === 'ONLINE_STORE' || o.channel === 'ONLINE' ? 'Online Customer' : 'Walk-in Customer';
        const name = addressFullName || userFullName || defaultLabel;
        const phone = shippingAddr?.phone || billingAddr?.phone || o.customer?.phone || o.customer?.user?.phone;
        const email = o.customer?.user?.email || o.customer?.email;

        return (
          <div className="max-w-[200px]">
            <span className="font-semibold text-neutral-800 text-xs block truncate" title={name}>{name}</span>
            {phone && <span className="text-[10px] text-neutral-400 font-mono block">{phone}</span>}
            {!phone && email && !email.includes('@vasanthi.local') && <span className="text-[10px] text-neutral-400 truncate block">{email}</span>}
          </div>
        );
      },
    },
    { key: 'createdAt', label: 'Date', render: (o) => <span className="text-neutral-600 text-xs">{formatDate(o.createdAt)}</span> },
    {
      key: 'items',
      label: 'Items',
      render: (o) => {
        const totalUnits = o.items?.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const count = totalUnits !== undefined && totalUnits > 0 ? totalUnits : (o.items?.length || 0);
        return <span className="font-semibold text-center block text-neutral-800">{count}</span>;
      },
    },
    { key: 'subtotal', label: 'Subtotal', render: (o) => <span className="font-mono font-semibold block text-right">{formatMoney(o.subtotal, o.currency)}</span> },
    { key: 'discountTotal', label: 'Discount', render: (o) => <span className="font-mono text-red-500 block text-right">{Number(o.discountTotal) > 0 ? `-${formatMoney(o.discountTotal, o.currency)}` : '—'}</span> },
    { key: 'grandTotal', label: 'Total', render: (o) => <span className="font-mono font-bold text-neutral-950 block text-right">{formatMoney(o.grandTotal, o.currency)}</span> },
    { key: 'status', label: 'Status', render: (o) => <OrderStatusBadge status={o.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (o) => (
        <div className="flex justify-end">
          <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1 text-2xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold px-2 py-1 rounded transition">
            <Eye className="w-3.5 h-3.5" /> Details
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight font-sans">Orders Control Desk</h1>
          <p className="text-xs text-neutral-400 mt-1">Review orders, manage fulfillment status transitions, and inspect financial metrics.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsExportModalOpen(true);
              setModalDatePreset('MONTH');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>📥 Download Excel / CSV Report</span>
          </button>

          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            View Payments & Analytics Hub <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Date & Channel Preset Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full">
            <button onClick={() => setDatePreset('ALL')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${!startDate && !endDate ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'}`}>All Time</button>
            <button onClick={() => setDatePreset('TODAY')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition shrink-0">Today</button>
            <button onClick={() => setDatePreset('YESTERDAY')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition shrink-0">Yesterday</button>
            <button onClick={() => setDatePreset('WEEK')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition shrink-0">Last 7 Days</button>
            <button onClick={() => setDatePreset('MONTH')} className="px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-500 hover:text-neutral-900 transition shrink-0">This Month</button>
          </div>

          {/* Quick Channel Presets */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full">
            <button onClick={() => updateQuery('channel', '')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${!channel ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}>All Channels</button>
            <button onClick={() => updateQuery('channel', 'POS_SHOPORA')} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${channel === 'POS_SHOPORA' ? 'bg-sky-600 text-white shadow-xs' : 'text-neutral-600 hover:text-sky-700'}`}><Store className="w-3 h-3" /> In-Store</button>
            <button onClick={() => updateQuery('channel', 'ONLINE_STORE')} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${channel === 'ONLINE_STORE' ? 'bg-purple-600 text-white shadow-xs' : 'text-neutral-600 hover:text-purple-700'}`}><Globe className="w-3 h-3" /> Online Web</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full lg:w-80">
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search order number or customer ID..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900" />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </form>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center justify-end w-full lg:w-auto">
            <form onSubmit={(e) => { e.preventDefault(); updateQuery('startDate', localStartDate); updateQuery('endDate', localEndDate); }} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input type="date" value={localStartDate} onChange={(e) => setLocalStartDate(e.target.value)} className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs min-h-[38px]" />
                <span className="text-neutral-400 text-xs shrink-0">to</span>
                <input type="date" value={localEndDate} onChange={(e) => setLocalEndDate(e.target.value)} className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 text-xs min-h-[38px]" />
              </div>
              <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shrink-0 min-h-[38px] flex items-center justify-center">Apply</button>
            </form>
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportManifest}
                className="w-full sm:w-auto px-3.5 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold shrink-0 min-h-[38px] flex items-center justify-center gap-1.5 shadow-2xs transition"
              >
                <FileText className="w-3.5 h-3.5" /> 📄 Export Manifest
              </button>
              {manifestError && <p className="text-[10px] text-red-600 font-medium">{manifestError}</p>}
            </div>
            <select value={channel} onChange={(e) => updateQuery('channel', e.target.value)} className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium">
              <option value="">All Channels</option>
              <option value="ONLINE_STORE">🌐 Online Store</option>
              <option value="POS_SHOPORA">📱 Mobile POS / Store</option>
            </select>
            <select value={status} onChange={(e) => updateQuery('status', e.target.value)} className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium">
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PACKING">PACKING</option>
              <option value="READY_TO_SHIP">READY TO SHIP</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="RETURN_REQUESTED">RETURN REQUESTED</option>
              <option value="RETURN_APPROVED">RETURN APPROVED</option>
              <option value="RETURN_COMPLETED">RETURN COMPLETED</option>
            </select>
          </div>
        </div>
      </div>

      {printError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{printError}</span>
          <button onClick={() => setPrintError('')} className="text-red-500 hover:text-red-700">Dismiss</button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={listData?.data ?? []}
        total={listData?.meta?.total ?? 0}
        page={page}
        pageSize={10}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/orders?${params}`); }}
        rowKey={(o) => o.id}
        selectedIds={selectedOrderIds}
        onSelectionChange={setSelectedOrderIds}
        bulkActions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrintBulkLabels('4x6')}
              disabled={isPrintingLabels}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              {isPrintingLabels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              Print 4x6 Thermal Labels
            </button>
            <button
              onClick={() => handlePrintBulkLabels('A4')}
              disabled={isPrintingLabels}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 text-neutral-800 rounded-lg text-xs font-bold transition"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              Print A4 Sheet
            </button>
          </div>
        }
        emptyMessage="No orders found matching the filter selection."
      />

      {/* EXCEL & CSV ORDERS EXPORT MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 max-w-lg w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Download Orders Spreadsheet</h2>
                  <p className="text-xs text-emerald-100/90 mt-0.5">Select a date range and filters to generate your Excel / CSV report.</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Quick Date Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 block">Quick Date Ranges</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Today', preset: 'TODAY' },
                    { label: 'Yesterday', preset: 'YESTERDAY' },
                    { label: 'Last 7 Days', preset: 'WEEK' },
                    { label: 'This Month', preset: 'MONTH' },
                    { label: 'Last Month', preset: 'LAST_MONTH' },
                    { label: 'FY 25–26', preset: 'FY' },
                    { label: 'All Orders', preset: 'ALL' },
                  ].map((p) => (
                    <button
                      key={p.preset}
                      type="button"
                      onClick={() => setModalDatePreset(p.preset as any)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                    From Date (Start)
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                    To Date (End)
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Channel & Status Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                    Channel Filter
                  </label>
                  <select
                    value={exportChannel}
                    onChange={(e) => setExportChannel(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    <option value="">All Channels</option>
                    <option value="ONLINE_STORE">🌐 Online Store</option>
                    <option value="POS_SHOPORA">📱 In-Store POS (Shopora)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                    Order Status
                  </label>
                  <select
                    value={exportStatus}
                    onChange={(e) => setExportStatus(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="READY_TO_SHIP">READY TO SHIP</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="RETURN_COMPLETED">RETURN COMPLETED</option>
                  </select>
                </div>
              </div>

              {/* Export Format Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 block">Spreadsheet Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      exportFormat === 'xlsx'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className={`w-5 h-5 ${exportFormat === 'xlsx' ? 'text-emerald-700' : 'text-neutral-400'}`} />
                      <div>
                        <div className="text-xs font-bold">Microsoft Excel</div>
                        <div className="text-[10px] text-neutral-500">.xlsx / .xls formatted</div>
                      </div>
                    </div>
                    {exportFormat === 'xlsx' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      exportFormat === 'csv'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className={`w-5 h-5 ${exportFormat === 'csv' ? 'text-emerald-700' : 'text-neutral-400'}`} />
                      <div>
                        <div className="text-xs font-bold">CSV Spreadsheet</div>
                        <div className="text-[10px] text-neutral-500">.csv (UTF-8 with BOM)</div>
                      </div>
                    </div>
                    {exportFormat === 'csv' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                </div>
              </div>

              {/* Columns Included Notice */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>25 Detailed Columns Included in Export:</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  Order #, Date & Time (IST), Sales Channel, Customer Name, Phone, Email, Delivery Address, City, State, Pincode, Total Units, Items Breakdown with SKUs, Subtotal, Discounts, GST/Tax, Shipping, Grand Total, Payment Status & Method, Order Status, Delhivery AWB, Courier Partner, Billed By, and Notes.
                </p>
              </div>

              {/* Feedback messages */}
              {exportErrorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <span>{exportErrorMsg}</span>
                </div>
              )}
              {exportSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{exportSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExcelExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{isExporting ? 'Generating Report...' : `Download ${exportFormat.toUpperCase()} Sheet`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

