'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useWarehouseDetail } from '@/features/warehouse/warehouse.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { ArrowLeft, Home, Phone, Mail, User, Info, Database, Plus } from 'lucide-react';
import Link from 'next/link';
import CreateLocationDialog from '@/features/warehouse/components/CreateLocationDialog';
import AssignInventoryDialog from '@/features/warehouse/components/AssignInventoryDialog';
import StockTransferDialog from '@/features/warehouse/components/StockTransferDialog';
import { useAuth } from '@/hooks/useAuth';

export default function WarehouseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LOCATIONS' | 'INVENTORY'>('OVERVIEW');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Queries
  const { data: detailData, isLoading, isError, refetch } = useWarehouseDetail(id);

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  if (isLoading) {
    return <SectionLoader message="Fetching warehouse layout registries..." />;
  }

  if (isError || !detailData) {
    return (
      <PageError
        title="Details Load Failure"
        message="Could not retrieve layout details for this warehouse from backend."
        retry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/warehouses" className="p-2 hover:bg-neutral-100 rounded-xl transition">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">{detailData.name}</h1>
              {detailData.isDefault && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 text-[9px] font-bold">
                  <Home className="w-2.5 h-2.5" /> Default
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1">Warehouse Code: {detailData.code} | Status: {detailData.status}</p>
          </div>
        </div>
        {isEditor && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsTransferOpen(true)}
              className="bg-white hover:bg-neutral-50 text-neutral-800 font-semibold py-2 px-3.5 rounded-xl text-xs border border-neutral-200 transition"
            >
              Transfer Stock
            </button>
            <button
              onClick={() => setIsAssignOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
            >
              Assign Stock
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        {(['OVERVIEW', 'LOCATIONS', 'INVENTORY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px
              ${activeTab === tab
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Warehouse Info Card */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4 col-span-2">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Info className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Storage Facility Details</h3>
            </div>
            <p className="text-xs text-neutral-600">{detailData.description || 'No detailed description provided.'}</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Address</span>
                <span className="text-neutral-800 block mt-0.5">{detailData.address || 'N/A'}</span>
                <span className="text-neutral-500 block">
                  {detailData.city}, {detailData.state} {detailData.postalCode}
                </span>
                <span className="text-neutral-400 block">{detailData.country}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Manager</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-neutral-800">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{detailData.contactPerson || 'Unassigned'}</span>
                  </div>
                </div>
                {detailData.phone && (
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Phone</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-neutral-800">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{detailData.phone}</span>
                    </div>
                  </div>
                )}
                {detailData.email && (
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Email</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-neutral-800 font-mono">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{detailData.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Database className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Inventory Metrics</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-neutral-500">Assigned SKU Items:</span>
                  <span className="text-neutral-900 font-bold">{detailData.inventories?.length || 0}</span>
                </div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-neutral-500">Layout Zones / Locations:</span>
                  <span className="text-neutral-900 font-bold">{detailData.locations?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LOCATIONS' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Storage Locations & Zones</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Locations defined inside the warehouse grid layout.</p>
            </div>
            {isEditor && (
              <button
                onClick={() => setIsLocationOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1.5 px-3 rounded-lg text-2xs flex items-center gap-1 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Location
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-neutral-400 font-bold uppercase tracking-wider text-[9px] bg-neutral-50 border-b border-neutral-200">
                  <th className="p-3">Zone</th>
                  <th className="p-3">Rack</th>
                  <th className="p-3">Shelf</th>
                  <th className="p-3">Bin</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {detailData.locations?.map((loc) => (
                  <tr key={loc.id} className="hover:bg-neutral-50/50 transition">
                    <td className="p-3 font-semibold text-neutral-900">{loc.zone || 'N/A'}</td>
                    <td className="p-3 font-mono">{loc.rack || 'N/A'}</td>
                    <td className="p-3 font-mono">{loc.shelf || 'N/A'}</td>
                    <td className="p-3 font-mono">{loc.bin || 'N/A'}</td>
                    <td className="p-3 text-neutral-500">{loc.description || '-'}</td>
                    <td className="p-3 text-right">
                      <span className="inline-block px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-100 text-[9px] font-bold rounded">
                        {loc.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!detailData.locations || detailData.locations.length === 0) && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-neutral-400">
                      No layout locations defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'INVENTORY' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Assigned Stocks</h3>
              <p className="text-[10px] text-neutral-400 mt-0.5">Physical stocks specifically mapped to this warehouse.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-neutral-400 font-bold uppercase tracking-wider text-[9px] bg-neutral-50 border-b border-neutral-200">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Product Variant</th>
                  <th className="p-3 text-center">Available Stock</th>
                  <th className="p-3 text-center">Reserved</th>
                  <th className="p-3 text-center">Damaged</th>
                  <th className="p-3 text-center">Min / Max Stock</th>
                  <th className="p-3 text-center">Reorder level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {detailData.inventories?.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition">
                    <td className="p-3 font-mono font-bold text-[10px] text-neutral-900">{item.variant?.sku || item.variantId.substring(0, 8)}</td>
                    <td className="p-3 font-semibold text-neutral-800">{item.variant?.title || 'Unknown Product Variant'}</td>
                    <td className="p-3 text-center font-bold text-neutral-900">{item.availableQuantity}</td>
                    <td className="p-3 text-center text-neutral-500">{item.reservedQuantity}</td>
                    <td className="p-3 text-center text-red-500">{item.damagedQuantity}</td>
                    <td className="p-3 text-center text-neutral-400">
                      {item.minimumStock} <span className="text-neutral-300">/</span> {item.maximumStock}
                    </td>
                    <td className="p-3 text-center text-neutral-500">{item.reorderLevel}</td>
                  </tr>
                ))}
                {(!detailData.inventories || detailData.inventories.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-neutral-400">
                      No product variant stock assignments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog: Create Location */}
      {isLocationOpen && (
        <CreateLocationDialog
          warehouseId={detailData.id}
          onClose={() => setIsLocationOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Dialog: Assign Stock */}
      {isAssignOpen && (
        <AssignInventoryDialog
          warehouseId={detailData.id}
          onClose={() => setIsAssignOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Dialog: Inter-Warehouse stock transfer */}
      {isTransferOpen && (
        <StockTransferDialog
          sourceWarehouse={detailData}
          sourceInventory={detailData.inventories || []}
          onClose={() => setIsTransferOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
