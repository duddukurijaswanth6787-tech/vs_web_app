'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useCustomer,
  useCustomerProfile,
  useCustomerAddresses,
  useCustomerWishlist,
  useCustomerCart,
  useCustomerWallet,
  useCustomerWalletTransactions,
  useCreditCustomerWallet,
  useDebitCustomerWallet,
} from '@/features/customers/customers.hooks';
import { WalletTransactionResponse, CustomerWishlistItem } from '@/features/customers/customers.types';
import {
  User,
  ArrowLeft,
  Heart,
  ShoppingCart,
  Coins,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';
import { useToast } from '@/components/toast/ToastProvider';

export default function CustomerDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;

  const { data: customer, isLoading: customerLoading, error: customerError, refetch: refetchCustomer } = useCustomer(id);
  const { data: profile, isLoading: profileLoading } = useCustomerProfile(id);

  // Addresses, Wishlist, Cart, Wallet
  const { data: addresses } = useCustomerAddresses(profile?.id || '');
  const { data: wishlist } = useCustomerWishlist(profile?.id || '');
  const { data: cart } = useCustomerCart(profile?.id || '');
  const { data: wallet, refetch: refetchWallet } = useCustomerWallet(profile?.id || '');

  const [transactionPage, setTransactionPage] = useState(1);
  const { data: transactions, refetch: refetchTransactions } = useCustomerWalletTransactions(profile?.id || '', transactionPage, 10);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'wallet' | 'wishlist' | 'cart'>('overview');

  // Wallet adjustment forms
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const creditMutation = useCreditCustomerWallet();
  const debitMutation = useDebitCustomerWallet();

  const handleRetry = () => {
    refetchCustomer();
  };

  const handleWalletAdjustment = async (type: 'CREDIT' | 'DEBIT') => {
    if (!profile?.id) return;
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      toast('warning', 'Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    setIsAdjusting(true);
    try {
      if (type === 'CREDIT') {
        await creditMutation.mutateAsync({
          customerId: profile.id,
          dto: { amount: numAmt, description },
        });
        toast('success', 'Wallet credited');
      } else {
        await debitMutation.mutateAsync({
          customerId: profile.id,
          dto: { amount: numAmt, description },
        });
        toast('success', 'Wallet debited');
      }
      setAmount('');
      setDescription('');
      refetchWallet();
      refetchTransactions();
    } catch (err: unknown) {
      toast('error', 'Wallet adjustment failed', getApiErrorMessage(err, 'Wallet adjustment failed.'));
    } finally {
      setIsAdjusting(false);
    }
  };

  if (customerLoading || profileLoading) {
    return <SectionLoader message="Loading customer workspace..." />;
  }

  if (customerError || !customer) {
    return (
      <PageError
        title="Customer Profile Load Failure"
        message="Could not retrieve account details from database."
        retry={handleRetry}
      />
    );
  }

  const transactionList = transactions?.data || [];
  const transMeta = transactions?.meta || { totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to customer directory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-neutral-600 shadow-sm">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {customer.firstName} {customer.lastName || ''}
              </h1>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">{customer.email}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border uppercase
              ${
                customer.accountStatus === 'ACTIVE'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-neutral-100 text-neutral-500 border-neutral-300'
              }
            `}
          >
            {customer.accountStatus}
          </span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
          {(['overview', 'orders', 'addresses', 'wallet', 'wishlist', 'cart'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 border-b-2 transition-all
                ${
                  activeTab === tab
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Profile details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-neutral-400 uppercase">First Name</span>
                <p className="font-semibold text-neutral-800 mt-1">{customer.firstName}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Last Name</span>
                <p className="font-semibold text-neutral-800 mt-1">{customer.lastName || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Phone</span>
                <p className="font-semibold text-neutral-800 mt-1">{customer.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Gender</span>
                <p className="font-semibold text-neutral-800 mt-1">{customer.gender || 'N/A'}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Language</span>
                <p className="font-semibold text-neutral-800 mt-1">{profile?.preferredLanguage || 'en'}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-400 uppercase">Currency</span>
                <p className="font-semibold text-neutral-800 mt-1">{profile?.preferredCurrency || 'INR'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm md:col-span-1 space-y-4 h-fit">
            <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2">Account Meta</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Customer ID</span>
                <span className="font-mono text-neutral-800 font-semibold truncate max-w-[120px]">{profile?.id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Registered date</span>
                <span className="font-semibold text-neutral-800">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Last login</span>
                <span className="font-semibold text-neutral-800">
                  {customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-neutral-900 border-b border-neutral-50 pb-2 mb-4">Customer Orders</h3>
          <div className="text-center py-6 text-xs text-neutral-400">
            For ordering operations, please refer to the global{' '}
            <Link href="/admin/orders" className="text-neutral-900 font-bold underline">
              Orders Workspace
            </Link>.
          </div>
        </div>
      )}

      {/* Addresses tab */}
      {activeTab === 'addresses' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses && addresses.length > 0 ? (
            addresses.map((addr) => (
              <div key={addr.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3 relative">
                <div className="flex items-center justify-between border-b border-neutral-50 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-800">
                    <MapPin className="h-4 w-4 text-neutral-400" /> {addr.label}
                  </div>
                  {addr.isDefaultShipping && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700">
                      Default Shipping
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-600 space-y-1">
                  <p className="font-bold text-neutral-800">{addr.fullName}</p>
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>
                    {addr.city}, {addr.state} - {addr.postalCode}
                  </p>
                  <p>{addr.country}</p>
                  <p className="font-semibold pt-1">Phone: {addr.phone}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 text-center text-xs text-neutral-400 border border-dashed rounded-xl">
              No saved addresses found.
            </div>
          )}
        </div>
      )}

      {/* Wallet tab */}
      {activeTab === 'wallet' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Balance card and Adjustment form */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Wallet balance</span>
                <h3 className="text-2xl font-bold text-neutral-900 mt-1">
                  ₹{wallet?.balance ? wallet.balance.toFixed(2) : '0.00'}
                </h3>
              </div>
              <div className="rounded-lg bg-neutral-900 p-2.5 text-white">
                <Coins className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2">
                Balance adjustments
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Amount (INR)</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Adjustment Reason</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                    placeholder="e.g. Refund override"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleWalletAdjustment('CREDIT')}
                    disabled={isAdjusting}
                    className="rounded-lg bg-green-600 hover:bg-green-700 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Credit
                  </button>
                  <button
                    onClick={() => handleWalletAdjustment('DEBIT')}
                    disabled={isAdjusting}
                    className="rounded-lg bg-red-600 hover:bg-red-700 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Debit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet transaction logs */}
          <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2 mb-3">
                Transaction history
              </h3>
              <div className="divide-y divide-neutral-100 text-xs">
                {transactionList.length > 0 ? (
                  transactionList.map((t: WalletTransactionResponse) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block px-1 rounded text-[8px] font-bold font-mono uppercase
                              ${t.type === 'CREDIT' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
                            `}
                          >
                            {t.type}
                          </span>
                          <span className="font-semibold text-neutral-800">{t.description || 'Adjustment'}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{t.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount.toFixed(2)}
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 py-6 text-center">No transaction records found.</p>
                )}
              </div>
            </div>

            {/* Pagination */}
            {transMeta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-3 mt-4">
                <span className="text-xs text-neutral-500">
                  Page {transactionPage} of {transMeta.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransactionPage(Math.max(1, transactionPage - 1))}
                    disabled={transactionPage === 1}
                    className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setTransactionPage(Math.min(transMeta.totalPages, transactionPage + 1))}
                    disabled={transactionPage === transMeta.totalPages}
                    className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wishlist tab */}
      {activeTab === 'wishlist' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2">
            Wishlist Items ({wishlist?.data?.length || 0})
          </h3>
          <div className="divide-y divide-neutral-100 text-xs">
            {wishlist?.data && wishlist.data.length > 0 ? (
              wishlist.data.map((item: CustomerWishlistItem) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <Heart className="h-4 w-4 text-neutral-400 fill-neutral-200" />
                  <div>
                    <span className="font-bold text-neutral-800">{item.productName || 'Catalog Product'}</span>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Product ID: {item.productId}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 py-6 text-center">No products saved in wishlist.</p>
            )}
          </div>
        </div>
      )}

      {/* Cart tab */}
      {activeTab === 'cart' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-neutral-900 uppercase border-b border-neutral-50 pb-2">
            Shopping Cart Items ({cart?.items?.length || 0})
          </h3>
          <div className="divide-y divide-neutral-100 text-xs">
            {cart?.items && cart.items.length > 0 ? (
              cart.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-neutral-400" />
                    <div>
                      <span className="font-bold text-neutral-800">{item.productName || 'Catalog Product'}</span>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-800">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 py-6 text-center">Active shopping cart is empty.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
