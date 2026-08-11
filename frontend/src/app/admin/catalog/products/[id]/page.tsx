'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProduct, useDeleteProduct, useRestoreProduct } from '@/features/catalog/products/product.hooks';
import { useVariants } from '@/features/catalog/variants/variant.hooks';
import { useMediaList } from '@/features/catalog/media/media.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Tag, 
  Globe, 
  Box, 
  Info,
  DollarSign,
} from 'lucide-react';
import { ProductStatus } from '@/features/catalog/products/product.types';
import { RemoteImage } from '@/components/media/RemoteImage';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const { data: variants } = useVariants({ productId: id });
  const { data: media } = useMediaList({ productId: id });

  const deleteProductMut = useDeleteProduct();
  const restoreProductMut = useRestoreProduct();

  const handleDelete = async () => {
    if (!product) return;
    if (window.confirm(`Are you sure you want to archive "${product.name}"?`)) {
      await deleteProductMut.mutateAsync(id);
      router.push('/admin/catalog/products');
    }
  };

  const handleRestore = async () => {
    await restoreProductMut.mutateAsync(id);
    refetch();
  };

  const isSuperAdmin = user?.roles?.includes('super_admin');
  const isPrimaryImage = media?.data?.find((m) => m.isPrimary)?.url;

  return (
    <div className="space-y-6">
      {/* Header View Action Bar */}
      {isLoading ? (
        <SectionLoader message="Fetching product specifications..." />
      ) : isError || !product ? (
        <PageError title="Loading Failed" message="Could not fetch product information." retry={refetch} />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/catalog/products"
                className="p-2 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">{product.name}</h1>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${product.status === ProductStatus.ACTIVE ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}
                  `}>
                    {product.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 font-mono">SKU: {product.sku} | Barcode: {product.barcode}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/admin/catalog/products/${id}/edit`}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Product
              </Link>
              {product.status === ProductStatus.ARCHIVED ? (
                isSuperAdmin && (
                  <button
                    onClick={handleRestore}
                    className="border border-green-200 hover:bg-green-50 text-green-700 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Restore Product
                  </button>
                )
              ) : (
                isSuperAdmin && (
                  <button
                    onClick={handleDelete}
                    className="border border-red-200 hover:bg-red-50 text-red-600 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Archive Product
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Panel */}
            <div className="space-y-6">
              {/* Product Thumbnail */}
              <div className="relative bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center aspect-square overflow-hidden">
                {isPrimaryImage ? (
                  <RemoteImage
                    src={isPrimaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-contain"
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <Box className="w-12 h-12 text-neutral-300 mx-auto" />
                    <p className="text-xs text-neutral-400">No primary image selected</p>
                  </div>
                )}
              </div>

              {/* Quick Info Grid */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Operational Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 font-medium block">Brand</span>
                    <span className="font-bold text-neutral-950">{product.brandName || 'VD Exclusive'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium block">Storefront Visibility</span>
                    <span className="font-bold text-neutral-950 uppercase">{product.visibility}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium block">Track Inventory</span>
                    <span className="font-bold text-neutral-950">{product.trackInventory ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium block">Created Date</span>
                    <span className="font-bold text-neutral-950">{new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specification Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic spec details */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Info className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-sm font-bold text-neutral-950">Specifications & Descriptions</h2>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-neutral-400 font-bold block mb-1 uppercase text-[10px]">Short Description</span>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                      {product.shortDescription || 'No description summary set for this listing.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-bold block mb-1 uppercase text-[10px]">Full Catalog Details</span>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-100 whitespace-pre-line">
                      {product.description || 'No detailed specifications entered.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Dimensions Card */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <DollarSign className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-sm font-bold text-neutral-950">Commercial Pricing & Shipping Details</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-400 font-medium block">Base Price</span>
                    <span className="font-bold text-neutral-950 text-sm">₹{product.basePrice}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium block">Sale Price</span>
                    <span className="font-bold text-green-600 text-sm">{product.salePrice ? `₹${product.salePrice}` : 'Not on Sale'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium block">Tax percentage</span>
                    <span className="font-bold text-neutral-950">{product.taxPercentage ?? 0}%</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium block">Dimensions (L x W x H)</span>
                    <span className="font-bold text-neutral-950">
                      {product.length && product.width && product.height 
                        ? `${product.length}x${product.width}x${product.height} cm` 
                        : 'Unspecified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic specs sheet */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Tag className="w-4 h-4 text-neutral-500" />
                    <h2 className="text-sm font-bold text-neutral-950">Attribute Specifications</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.attributes.map((attr) => (
                      <div key={attr.attributeId} className="flex justify-between p-2.5 bg-neutral-50 rounded-lg border border-neutral-100 text-xs">
                        <span className="text-neutral-500 font-medium">{attr.attributeName}</span>
                        <span className="font-bold text-neutral-900">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants table */}
              {variants?.data && variants.data.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <Box className="w-4 h-4 text-neutral-500" />
                    <h2 className="text-sm font-bold text-neutral-950">Assigned Variants Combinations</h2>
                  </div>
                  <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                          <th className="p-3">SKU</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Price (Override)</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {variants.data.map((v) => (
                          <tr key={v.id} className="hover:bg-neutral-50/50">
                            <td className="p-3 font-semibold font-mono text-[10px] text-neutral-900">{v.sku}</td>
                            <td className="p-3 text-neutral-600">{v.title}</td>
                            <td className="p-3 font-semibold text-neutral-950">₹{v.priceOverride ?? product.basePrice}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                v.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                {v.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SEO parameters card */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Globe className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-sm font-bold text-neutral-950">SEO Search Index Settings</h2>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-neutral-400 font-medium block">Meta Title</span>
                      <span className="font-bold text-neutral-950">{product.seoTitle || 'Default name schema'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 font-medium block">Keywords</span>
                      <span className="font-bold text-neutral-950">{product.seoKeywords || 'None'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-medium block">Meta Description</span>
                    <p className="text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 mt-1">
                      {product.seoDescription || 'No meta snippet configured.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
