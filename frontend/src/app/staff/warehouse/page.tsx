'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse as WarehouseIcon, ArrowLeftRight, Pencil, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useWarehouseList,
  useWarehouseInventory,
  useUpdateWarehouseInventoryCount,
  useTransferWarehouseStock,
} from '@/features/warehouse/warehouse.hooks';
import { StaffPortalNav } from '@/components/staff/StaffPortalNav';
import { StaffLoginGate } from '@/components/staff/StaffLoginGate';
import { getApiErrorMessage } from '@/utils/api-error';

export default function StaffWarehousePage() {
  const { isAuthenticated, isStaffUser, isInitializing } = useAuth();
  const [warehouseId, setWarehouseId] = useState('');
  const [editingVariantId, setEditingVariantId] = useState('');
  const [newCount, setNewCount] = useState(0);
  const [transferModalVariantId, setTransferModalVariantId] = useState('');
  const [transferToWarehouseId, setTransferToWarehouseId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState(1);
  const [message, setMessage] = useState('');

  const warehousesQuery = useWarehouseList({ status: 'ACTIVE', limit: 100 });
  const warehouses = warehousesQuery.data?.data ?? [];
  const currentWarehouseId = warehouseId || warehouses[0]?.id || '';

  useEffect(() => {
    if (!warehouseId && warehouses[0]?.id) setWarehouseId(warehouses[0].id);
  }, [warehouseId, warehouses]);

  const inventoryQuery = useWarehouseInventory(currentWarehouseId, !!currentWarehouseId);
  const updateCountMutation = useUpdateWarehouseInventoryCount();
  const transferMutation = useTransferWarehouseStock();

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/warehouse" />;
  }

  const inventory = inventoryQuery.data ?? [];
  const otherWarehouses = warehouses.filter((w) => w.id !== currentWarehouseId);

  const handleUpdateCount = async (variantId: string) => {
    setMessage('');
    try {
      await updateCountMutation.mutateAsync({
        warehouseId: currentWarehouseId,
        variantId,
        dto: { availableQuantity: newCount },
      });
      setMessage('Count updated.');
      setEditingVariantId('');
    } catch (err) {
      setMessage(getApiErrorMessage(err));
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferToWarehouseId) return;
    setMessage('');
    try {
      await transferMutation.mutateAsync({
        variantId: transferModalVariantId,
        fromWarehouseId: currentWarehouseId,
        toWarehouseId: transferToWarehouseId,
        quantity: transferQuantity,
      });
      setMessage('Transfer complete.');
      setTransferModalVariantId('');
      setTransferQuantity(1);
    } catch (err) {
      setMessage(getApiErrorMessage(err));
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-white font-sans antialiased pb-20 sm:pb-0">
      <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2 shrink-0">
            <WarehouseIcon className="w-4 h-4" />
            Warehouse Ops
          </h1>
          <select
            value={currentWarehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white max-w-[60%]"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
            ))}
          </select>
        </div>
      </header>

      <StaffPortalNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {message && <p className="text-xs text-emerald-400">{message}</p>}

        {inventoryQuery.isLoading && <p className="text-xs text-neutral-400">Loading inventory...</p>}
        {inventoryQuery.error && <p className="text-xs text-red-400">{getApiErrorMessage(inventoryQuery.error)}</p>}
        {!inventoryQuery.isLoading && inventory.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-8">No stock assigned to this warehouse yet.</p>
        )}

        <div className="space-y-2.5">
          {inventory.map((item) => (
            <div key={item.id} className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{item.variant?.title || item.variantId}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">{item.variant?.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black">{item.availableQuantity}</p>
                  <p className="text-[9px] text-neutral-500 uppercase">In Stock</p>
                </div>
              </div>

              {editingVariantId === item.variantId ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={newCount}
                    onChange={(e) => setNewCount(Number(e.target.value) || 0)}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdateCount(item.variantId)}
                    disabled={updateCountMutation.isPending}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingVariantId('')} className="text-neutral-400 p-1.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingVariantId(item.variantId);
                      setNewCount(item.availableQuantity);
                    }}
                    className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" /> Update Count
                  </button>
                  <button
                    onClick={() => setTransferModalVariantId(item.variantId)}
                    disabled={otherWarehouses.length === 0}
                    className="flex-1 bg-sky-800/60 hover:bg-sky-800 disabled:opacity-40 text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-3 h-3" /> Transfer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Transfer modal */}
      {transferModalVariantId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="bg-neutral-800 rounded-2xl border border-neutral-700 w-full max-w-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-sky-400" /> Transfer Stock
              </h3>
              <button onClick={() => setTransferModalVariantId('')} className="text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-2.5">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300">Destination warehouse</span>
                <select
                  required
                  value={transferToWarehouseId}
                  onChange={(e) => setTransferToWarehouseId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="">Select...</option>
                  {otherWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300">Quantity</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value) || 1)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </label>
              <button
                type="submit"
                disabled={transferMutation.isPending}
                className="w-full bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl"
              >
                {transferMutation.isPending ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
