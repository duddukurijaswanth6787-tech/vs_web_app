'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useSocialPosts,
  useCreateSocialPost,
  useUpdatePostStatus,
  useAttachMedia,
  useTagProducts,
  useDeleteSocialPost,
  useRestoreSocialPost,
  useSocialReports,
  useResolveReport,
} from '@/features/social/social.hooks';
import {
  SocialPostContentType,
  SocialPostStatus,
  SocialPostVisibility,
  SocialMediaType,
  SocialReportStatus,
  SocialPostResponse,
  SocialReportResponse,
  ProductTagDto,
} from '@/features/social/social.types';
import { useProducts } from '@/features/catalog/products/product.hooks';
import { ProductResponse } from '@/features/catalog/products/product.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';
import {
  MessageSquare,
  Heart,
  Bookmark,
  Play,
  Plus,
  Trash2,
  X,
  Tag,
  Upload,
  AlertOctagon,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { categorizeApiError } from '@/lib/api-error-handler';
import { socialService } from '@/features/social/social.service';
import { RemoteImage } from '@/components/media/RemoteImage';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { mediaService } from '@/features/catalog/media/media.service';

// Form schemas
const postSchema = z.object({
  contentType: z.enum([SocialPostContentType.POST, SocialPostContentType.REEL]),
  caption: z.string().max(300).optional(),
  hashtags: z.string().optional(),
  visibility: z.enum([SocialPostVisibility.PUBLIC, SocialPostVisibility.HIDDEN]),
  allowComments: z.boolean(),
});

type PostFormValues = z.infer<typeof postSchema>;

export default function SocialDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Active Tab
  const activeTab = searchParams.get('tab') || 'posts';
  const postPage = parseInt(searchParams.get('postPage') || '1');
  const reportPage = parseInt(searchParams.get('reportPage') || '1');

  // Queries
  const { data: postsData, isLoading: postsLoading, isError: postsError, refetch: refetchPosts } = useSocialPosts({
    contentType: activeTab === 'reels' ? SocialPostContentType.REEL : undefined,
    page: postPage,
    limit: 12,
  });

  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useSocialReports({
    page: reportPage,
    limit: 10,
  });

  // Actions
  const createPostMut = useCreateSocialPost();
  const deletePostMut = useDeleteSocialPost();
  const restorePostMut = useRestoreSocialPost();
  const updateStatusMut = useUpdatePostStatus();

  // Modal visibility states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPostResponse | null>(null);
  const [selectedReport, setSelectedReport] = useState<SocialReportResponse | null>(null);

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/admin/social?${params.toString()}`);
  };

  const handleCreateSubmit = async (values: PostFormValues) => {
    try {
      const hashtags = values.hashtags
        ? values.hashtags.split(' ').map((h) => h.trim()).filter((h) => h.startsWith('#'))
        : [];
      await createPostMut.mutateAsync({
        ...values,
        hashtags,
      });
      setIsCreateOpen(false);
      refetchPosts();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleStatusChange = async (postId: string, action: 'PUBLISH' | 'HIDE' | 'ARCHIVE' | 'RESTORE') => {
    try {
      await updateStatusMut.mutateAsync({ id: postId, action });
      refetchPosts();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to soft delete this post?')) return;
    try {
      await deletePostMut.mutateAsync(postId);
      refetchPosts();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleRestorePost = async (postId: string) => {
    try {
      await restorePostMut.mutateAsync(postId);
      refetchPosts();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  // Compute Aggregate Analytics Metrics locally from visible posts
  const aggregateAnalytics = React.useMemo(() => {
    if (!postsData?.data) return { likes: 0, comments: 0, views: 0, bookmarks: 0 };
    return postsData.data.reduce(
      (acc, cur) => ({
        likes: acc.likes + (cur.likeCount || 0),
        comments: acc.comments + (cur.commentCount || 0),
        views: acc.views + (cur.viewCount || 0),
        bookmarks: acc.bookmarks + (cur.saveCount || 0),
      }),
      { likes: 0, comments: 0, views: 0, bookmarks: 0 }
    );
  }, [postsData]);

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Social Commerce Dashboard</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure shoppable instagram/reels integrations, moderate safety reports, and manage coordinates product tag mapping.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Social Post
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-neutral-200 gap-6 text-xs font-bold text-neutral-400">
        <button
          onClick={() => updateQuery('tab', 'posts')}
          className={`pb-3 transition-colors ${activeTab === 'posts' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'hover:text-neutral-600'}`}
        >
          Catalog Posts
        </button>
        <button
          onClick={() => updateQuery('tab', 'reels')}
          className={`pb-3 transition-colors ${activeTab === 'reels' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'hover:text-neutral-600'}`}
        >
          Reels Player
        </button>
        <button
          onClick={() => updateQuery('tab', 'reports')}
          className={`pb-3 transition-colors ${activeTab === 'reports' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'hover:text-neutral-600'}`}
        >
          Safety Flag Reports
        </button>
        <button
          onClick={() => updateQuery('tab', 'analytics')}
          className={`pb-3 transition-colors ${activeTab === 'analytics' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'hover:text-neutral-600'}`}
        >
          Feed Analytics
        </button>
      </div>

      {/* ─── TAB: POSTS & REELS LIST ────────────────────────────────── */}
      {(activeTab === 'posts' || activeTab === 'reels') && (
        <>
          {postsLoading ? (
            <SectionLoader message="Retrieving social feed grid..." />
          ) : postsError ? (
            <PageError title="Connection Failure" message="Could not fetch social feed." retry={refetchPosts} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {postsData?.data?.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-neutral-300 transition group">
                  {/* Image/Video media Preview Container */}
                  <div className="aspect-square bg-neutral-100 relative overflow-hidden flex items-center justify-center border-b border-neutral-100">
                    {post.media && post.media[0] ? (
                      post.media[0].mediaType === SocialMediaType.VIDEO ? (
                        <div className="w-full h-full relative">
                          <video src={post.media[0].url} className="w-full h-full object-cover" muted loop playsInline />
                          <div className="absolute top-3 left-3 bg-black/60 text-white rounded-lg p-1.5 flex items-center">
                            <Video className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <RemoteImage
                          src={post.media[0].url}
                          alt="feed post preview"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-neutral-400 text-center">
                        <ImageIcon className="w-8 h-8 text-neutral-300 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Media Attached</span>
                        {isEditor && (
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setIsMediaOpen(true);
                            }}
                            className="mt-3 text-xs bg-neutral-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-neutral-800 transition"
                          >
                            <Upload className="w-3.5 h-3.5" /> Attach Media
                          </button>
                        )}
                      </div>
                    )}

                    {/* Content type Badge overlays */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white bg-black/65`}>
                        {post.contentType}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white bg-neutral-900`}>
                        {post.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content Info */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-neutral-700 line-clamp-3 leading-relaxed">{post.caption || 'No caption description.'}</p>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[10px] font-mono text-neutral-500 font-semibold">
                        {post.hashtags.map((h, i) => <span key={i}>{h}</span>)}
                      </div>
                    )}

                    {/* Metadata statistics metrics */}
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-3 border-t border-neutral-100 font-semibold font-mono">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likeCount}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {post.commentCount}</span>
                      <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> {post.saveCount}</span>
                      <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5" /> {post.viewCount}</span>
                    </div>
                  </div>

                  {/* Actions operations footer */}
                  {isEditor && (
                    <div className="bg-neutral-50 p-3 border-t border-neutral-100 flex items-center justify-between gap-1">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setIsMediaOpen(true);
                          }}
                          className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600"
                          title="Attach Media file"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setIsTagsOpen(true);
                          }}
                          className="p-1.5 hover:bg-neutral-200 rounded text-neutral-600"
                          title="Tag catalog items"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex gap-1">
                        {post.status === SocialPostStatus.DRAFT && (
                          <button
                            onClick={() => handleStatusChange(post.id, 'PUBLISH')}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1 px-2.5 rounded text-[10px] uppercase shadow-sm transition"
                          >
                            Publish
                          </button>
                        )}
                        {post.status === SocialPostStatus.PUBLISHED && (
                          <button
                            onClick={() => handleStatusChange(post.id, 'HIDE')}
                            className="bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold py-1 px-2.5 rounded text-[10px] uppercase shadow-sm transition"
                          >
                            Hide
                          </button>
                        )}
                        {post.status !== SocialPostStatus.ARCHIVED ? (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 hover:bg-red-50 text-red-650 rounded"
                            title="Soft Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestorePost(post.id)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!postsData?.data || postsData.data.length === 0) && (
                <div className="col-span-full bg-white p-12 text-center border border-neutral-200 rounded-2xl shadow-sm text-neutral-400 font-medium">
                  No social posts in this category.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── TAB: SAFETY FLAG REPORTS ──────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="font-bold text-neutral-900 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-red-500" /> Moderation Reports Flagged Queue
            </h2>
          </div>
          {reportsLoading ? (
            <SectionLoader message="Retrieving safety reports..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Report Details</th>
                    <th className="p-4">Reason Code</th>
                    <th className="p-4">Post Link</th>
                    <th className="p-4 font-mono">Reporter Client ID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {reportsData?.data?.map((rep) => (
                    <tr key={rep.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-neutral-800">{rep.description || 'No descriptive context.'}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">Submitted: {formatDate(rep.createdAt)}</div>
                      </td>
                      <td className="p-4 font-bold text-red-650 text-2xs tracking-wider uppercase font-mono">{rep.reason}</td>
                      <td className="p-4">
                        <span className="font-mono text-[10px] text-neutral-500">Post ID: {rep.postId}</span>
                      </td>
                      <td className="p-4 font-mono text-neutral-500 text-[10px]">{rep.userId}</td>
                      <td className="p-4">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                          ${rep.status === 'PENDING' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-neutral-100 text-neutral-500'}
                        `}>
                          {rep.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isEditor && rep.status === SocialReportStatus.PENDING && (
                          <button
                            onClick={() => {
                              setSelectedReport(rep);
                              setIsReportOpen(true);
                            }}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1.5 px-3 rounded-lg text-2xs shadow-sm transition"
                          >
                            Action Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!reportsData?.data || reportsData.data.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-400 font-medium">
                        No pending safety reports.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: ANALYTICS SUMMARY ────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Aggregate Likes</span>
              <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">{aggregateAnalytics.likes}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Aggregate Comments</span>
              <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">{aggregateAnalytics.comments}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Save Bookmarks</span>
              <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">{aggregateAnalytics.bookmarks}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Views Count</span>
              <div className="text-xl font-bold text-neutral-900 mt-2 font-mono">{aggregateAnalytics.views}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-neutral-950 font-sans">Social Commerce Performance Insights</h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">
              These analytics represent the aggregated metrics calculated from the currently queried feed posts data. Note that dedicated global social metrics aggregations endpoints are unavailable on the backend; all summaries are compiled dynamically on the client workspace.
            </p>
          </div>
        </div>
      )}

      {/* ─── MODAL: ALL-IN-ONE CREATE REEL / POST ────────────────── */}
      {isCreateOpen && (
        <CreatePostModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            refetchPosts();
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* ─── MODAL: ATTACH MEDIA ──────────────────────────────────── */}
      {isMediaOpen && selectedPost && (
        <AttachMediaModal
          post={selectedPost}
          onClose={() => {
            setIsMediaOpen(false);
            setSelectedPost(null);
          }}
          onSuccess={() => {
            refetchPosts();
            setIsMediaOpen(false);
            setSelectedPost(null);
          }}
        />
      )}

      {/* ─── MODAL: PRODUCT TAGGING ────────────────────────────────── */}
      {isTagsOpen && selectedPost && (
        <TagProductsModal
          post={selectedPost}
          onClose={() => {
            setIsTagsOpen(false);
            setSelectedPost(null);
          }}
          onSuccess={() => {
            refetchPosts();
            setIsTagsOpen(false);
            setSelectedPost(null);
          }}
        />
      )}

      {/* ─── MODAL: ACTION REPORT ──────────────────────────────────── */}
      {isReportOpen && selectedReport && (
        <ActionReportModal
          report={selectedReport}
          onClose={() => {
            setIsReportOpen(false);
            setSelectedReport(null);
          }}
          onSuccess={() => {
            refetchReports();
            setIsReportOpen(false);
            setSelectedReport(null);
          }}
        />
      )}
    </div>
  );
}

// All-in-One Shoppable Reel & Post Creation Modal with Live Preview
function CreatePostModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [contentType, setContentType] = useState<SocialPostContentType>(SocialPostContentType.REEL);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('#vasanthissignature #ethnicwear #festive');
  const [visibility, setVisibility] = useState<SocialPostVisibility>(SocialPostVisibility.PUBLIC);
  const [allowComments, setAllowComments] = useState(true);

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Tagged Products state
  const [taggedProducts, setTaggedProducts] = useState<ProductResponse[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Form submission state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Queries
  const { data: searchProductData } = useProducts({ search: productSearch || undefined, limit: 6 });

  // Handle local media file drop/select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMediaPreviewUrl(objectUrl);
  };

  const handleAddHashtag = (tag: string) => {
    if (!hashtags.includes(tag)) {
      setHashtags((prev) => (prev ? `${prev.trim()} ${tag}` : tag));
    }
  };

  const handleAddProductTag = (product: ProductResponse) => {
    if (!taggedProducts.some((p) => p.id === product.id)) {
      setTaggedProducts((prev) => [...prev, product]);
    }
    setProductSearch('');
  };

  const handleRemoveProductTag = (productId: string) => {
    setTaggedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleSubmitAll = async (publishImmediately: boolean) => {
    setError(null);
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // 1. Create Social Post entry
      const parsedHashtags = hashtags
        ? hashtags.split(' ').map((h) => h.trim()).filter((h) => h.startsWith('#'))
        : [];

      const newPost = await socialService.createPost({
        contentType,
        caption,
        hashtags: parsedHashtags,
        visibility,
        allowComments,
      });

      // 2. Upload and attach Media file if provided
      if (mediaFile) {
        const ext = mediaFile.name.split('.').pop() || (contentType === SocialPostContentType.REEL ? 'mp4' : 'jpg');
        const mediaType = contentType === SocialPostContentType.REEL ? SocialMediaType.VIDEO : SocialMediaType.IMAGE;

        const { uploadUrl, s3Key, url } = await socialService.getUploadUrl(newPost.id, mediaType, ext);
        await mediaService.uploadToS3(uploadUrl, mediaFile, (pct) => setUploadProgress(pct));

        await socialService.attachMedia(newPost.id, [
          {
            mediaType,
            s3Key,
            url,
            mimeType: mediaFile.type || (contentType === SocialPostContentType.REEL ? 'video/mp4' : 'image/jpeg'),
            size: mediaFile.size,
            displayOrder: 0,
          },
        ]);
      } else if (mediaPreviewUrl && mediaPreviewUrl.startsWith('http')) {
        const mediaType = contentType === SocialPostContentType.REEL ? SocialMediaType.VIDEO : SocialMediaType.IMAGE;
        await socialService.attachMedia(newPost.id, [
          {
            mediaType,
            s3Key: `external/${Date.now()}`,
            url: mediaPreviewUrl,
            mimeType: contentType === SocialPostContentType.REEL ? 'video/mp4' : 'image/jpeg',
            size: 1000,
            displayOrder: 0,
          },
        ]);
      }

      // 3. Tag products if selected
      if (taggedProducts.length > 0) {
        const tagDtos = taggedProducts.map((p, idx) => ({
          productId: p.id,
          label: p.name,
          tagX: 50,
          tagY: 50 + idx * 10,
          displayOrder: idx,
        }));
        await socialService.tagProducts(newPost.id, tagDtos);
      }

      // 4. Publish immediately if requested
      if (publishImmediately) {
        await socialService.updateStatus(newPost.id, 'PUBLISH');
      }

      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to create social post. Check network or storage settings.'));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/70 p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 text-xs max-h-[92vh] flex flex-col justify-between overflow-y-auto">
        
        {/* Header Title Bar */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#800020] text-amber-300 flex items-center justify-center font-bold text-lg shadow-sm">
              ❖
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 tracking-tight font-serif">Create Shoppable Social Reel</h3>
              <p className="text-[11px] text-neutral-400 font-medium">Upload video/image, tag store products, and preview live before publishing.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold">{error}</div>}

        {/* Modal Main Body (Grid Layout: Form Left, Mobile Live Preview Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 flex-1">
          
          {/* LEFT 7 COLUMNS: Inputs & Upload Controls */}
          <div className="lg:col-span-7 space-y-4 pr-1">
            
            {/* 1. Content Type Switcher */}
            <div>
              <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1">Select Media Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200/60">
                <button
                  type="button"
                  onClick={() => setContentType(SocialPostContentType.REEL)}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${contentType === SocialPostContentType.REEL ? 'bg-white text-[#800020] shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <Video className="w-4 h-4 text-[#800020]" />
                  <span>🎥 Instagram Reel (MP4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentType(SocialPostContentType.POST)}
                  className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition ${contentType === SocialPostContentType.POST ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                >
                  <ImageIcon className="w-4 h-4 text-neutral-700" />
                  <span>📷 Catalog Post (Image)</span>
                </button>
              </div>
            </div>

            {/* 2. Media File Upload Dropzone */}
            <div>
              <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1">
                {contentType === SocialPostContentType.REEL ? 'Upload MP4 Reel Video' : 'Upload Banner / Product Image'}
              </label>
              
              <div className="border-2 border-dashed border-rose-200/90 hover:border-[#800020] bg-rose-50/30 rounded-2xl p-5 text-center transition relative group cursor-pointer">
                <Upload className="w-8 h-8 text-[#800020] mx-auto mb-1.5 animate-bounce" />
                <p className="text-xs font-bold text-neutral-800">
                  {mediaFile ? mediaFile.name : `Click or Drag & Drop ${contentType === 'REEL' ? 'MP4 Video' : 'JPEG/PNG Image'} here`}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">Recommended resolution: 1080x1920 (9:16 portrait format)</p>
                <input
                  type="file"
                  accept={contentType === SocialPostContentType.REEL ? 'video/mp4' : 'image/*'}
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Direct Media URL Input / Media Picker Alternative */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Or paste media URL (e.g. https://images.unsplash.com/...)"
                  value={mediaPreviewUrl}
                  onChange={(e) => setMediaPreviewUrl(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-3 py-1.5 rounded-xl text-xs shrink-0"
                >
                  Media Library
                </button>
              </div>
            </div>

            {/* 3. Caption & Hashtags */}
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1">Caption Description</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write an engaging caption for your reel..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#800020]/20 resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider mb-1">Hashtags</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#vasanthissignature #ethnicwear #festive"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-mono text-neutral-900"
                />
                {/* Popular Hashtags Pill Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['#vasanthissignature', '#saree', '#lehenga', '#anarkali', '#festive', '#wedding'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddHashtag(tag)}
                      className="px-2 py-0.5 rounded-full bg-neutral-100 hover:bg-rose-100 hover:text-[#800020] text-[9px] font-mono text-neutral-600 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Tag Shoppable Catalog Products ("Shop the Look") */}
            <div className="space-y-2.5 border-t border-neutral-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-extrabold text-[#800020] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Attach Catalog Products ("Shop the Look")</span>
                </label>
                <span className="text-[10px] bg-rose-100 text-[#800020] px-2 py-0.5 rounded-full font-bold">
                  {taggedProducts.length} attached
                </span>
              </div>

              {/* Search Box */}
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="🔍 Search store catalog by product name..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#800020]/20"
              />

              {/* Product Selection List (Always visible!) */}
              <div className="border border-neutral-200/80 rounded-2xl p-2 bg-neutral-50/60 max-h-48 overflow-y-auto space-y-1.5">
                <div className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider px-1">
                  {productSearch ? `Search Results for "${productSearch}"` : 'Select Store Products to Attach:'}
                </div>

                {searchProductData?.data && searchProductData.data.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {searchProductData.data.map((prod) => {
                      const isTagged = taggedProducts.some((p) => p.id === prod.id);
                      const imgUrl = prod.images?.[0]?.url || (prod as any).thumbnailUrl || '';
                      const price = prod.salePrice || prod.basePrice || 0;

                      return (
                        <div
                          key={prod.id}
                          onClick={() => (isTagged ? handleRemoveProductTag(prod.id) : handleAddProductTag(prod))}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer transition ${
                            isTagged
                              ? 'bg-rose-50 border-[#800020] ring-1 ring-[#800020]/30'
                              : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {imgUrl ? (
                              <RemoteImage src={imgUrl} alt={prod.name} width={36} height={36} className="w-9 h-9 object-cover rounded-lg shrink-0 border border-neutral-100" />
                            ) : (
                              <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center text-[10px] text-neutral-400 font-bold shrink-0">🛍️</div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-neutral-900 text-[11px] truncate">{prod.name}</div>
                              <div className="text-[10px] font-semibold text-[#800020] font-mono">₹{price.toLocaleString('en-IN')}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase shrink-0 transition ${
                              isTagged
                                ? 'bg-[#800020] text-white'
                                : 'bg-neutral-100 hover:bg-rose-100 hover:text-[#800020] text-neutral-700'
                            }`}
                          >
                            {isTagged ? 'Attached ✓' : '+ Attach'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-neutral-400 text-xs italic">
                    No products found matching "{productSearch}".
                  </div>
                )}
              </div>

              {/* Tagged items count notice */}
              {taggedProducts.length > 0 && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 text-emerald-900 px-3 py-1.5 rounded-xl text-[10px] font-bold">
                  <span>✓ {taggedProducts.length} Product(s) attached & ready for "Shop the Look"</span>
                  <button type="button" onClick={() => setTaggedProducts([])} className="text-emerald-700 hover:underline text-[9px]">Clear All</button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 5 COLUMNS: Live Phone Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-neutral-900 rounded-3xl p-4 text-white relative shadow-inner overflow-hidden min-h-[360px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">Live Storefront Preview</span>
            
            {/* Phone Frame Mockup */}
            <div className="w-[200px] sm:w-[220px] aspect-[9/16] bg-black rounded-[2rem] border-4 border-neutral-700 overflow-hidden relative shadow-2xl flex flex-col justify-between">
              
              {/* Media Content Layer */}
              {mediaPreviewUrl ? (
                contentType === SocialPostContentType.REEL && mediaFile?.type?.includes('video') ? (
                  <video src={mediaPreviewUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img src={mediaPreviewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-neutral-800 text-neutral-500">
                  <Play className="w-8 h-8 text-neutral-600 mb-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">No Media Selected</span>
                </div>
              )}

              {/* Overlay Top Bar */}
              <div className="relative z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent text-[9px] font-bold">
                <span className="flex items-center gap-1 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  Reels
                </span>
                <span className="text-neutral-300">Vasanthi's Signature</span>
              </div>

              {/* Overlay Bottom Content */}
              <div className="relative z-10 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-1.5 text-left">
                <div className="text-[9px] font-bold text-white leading-tight line-clamp-1">
                  @vasanthissignature
                </div>
                <div className="text-[8px] text-neutral-200 line-clamp-2 leading-tight">
                  {caption || 'Reel caption description preview...'}
                </div>

                {/* Shoppable Tagged Products Badge */}
                {taggedProducts.length > 0 && (
                  <div className="bg-white/95 text-neutral-900 rounded-xl p-1.5 shadow-md flex items-center justify-between gap-1 mt-1">
                    <div className="flex items-center gap-1">
                      <RemoteImage src={taggedProducts[0].images?.[0]?.url || (taggedProducts[0] as any).thumbnailUrl || ''} alt="" width={20} height={20} className="w-5 h-5 object-cover rounded-md" />
                      <span className="text-[8px] font-extrabold line-clamp-1">{taggedProducts[0].name}</span>
                    </div>
                    <span className="text-[8px] font-bold text-[#800020] bg-rose-100 px-1.5 py-0.5 rounded-md shrink-0">Shop</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Progress Bar when uploading */}
        {isSubmitting && uploadProgress !== null && uploadProgress > 0 && (
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-neutral-600 uppercase">
              <span>Uploading Video / Media File...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
              <div className="bg-[#800020] h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {/* Modal Action Buttons Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitAll(false)}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-2.5 px-4 rounded-xl text-xs transition disabled:opacity-50"
            >
              {isSubmitting && <ButtonLoader />} Save Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitAll(true)}
              className="bg-[#800020] hover:bg-[#600018] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? <ButtonLoader /> : '🚀 Publish Live to Storefront'}
            </button>
          </div>
        </div>

      </div>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(m) => {
          const media = Array.isArray(m) ? m[0] : m;
          if (media) {
            setMediaPreviewUrl(media.publicUrl);
          }
          setShowMediaPicker(false);
        }}
        mimeFilter={contentType === SocialPostContentType.REEL ? 'video/' : 'image/'}
      />
    </div>
  );
}

// Inner Modal to handle direct file uploads to S3 and confirmation attach
function AttachMediaModal({ post, onClose, onSuccess }: { post: SocialPostResponse; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const attachMut = useAttachMedia();

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const mediaType =
        post.contentType === SocialPostContentType.REEL ? SocialMediaType.VIDEO : SocialMediaType.IMAGE;

      // 1. Generate presigned URL via social admin helper
      const { uploadUrl, s3Key, url } = await socialService.getUploadUrl(post.id, mediaType, ext);

      // 2. Upload file binary directly to S3/Local storage
      await mediaService.uploadToS3(uploadUrl, file, (pct) => {
        setProgress(pct);
      });

      // 3. Construct media details object matching DTO
      const mediaDto = {
        mediaType,
        s3Key,
        url,
        mimeType: file.type || 'image/jpeg',
        size: file.size,
        displayOrder: 0,
      };

      // 4. Attach media in database
      await attachMut.mutateAsync({ id: post.id, media: [mediaDto] });
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Media S3 upload attachment failed. Validate local storage permissions.'));
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Upload Media Attachment</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-655 font-semibold">{error}</div>}

        <div className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl p-6 bg-neutral-50 hover:bg-neutral-100/55 transition cursor-pointer relative">
          <Upload className="w-8 h-8 text-neutral-300 mb-2" />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            {post.contentType === 'REEL' ? 'Select MP4 Video File' : 'Select JPEG/PNG Image'}
          </span>
          <input
            type="file"
            accept={post.contentType === 'REEL' ? 'video/mp4' : 'image/*'}
            disabled={isUploading}
            onChange={handleUploadFile}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {isUploading && progress !== null && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              <span>Uploading to S3...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-neutral-900 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Inner Modal to handle Coordinate Product Tagging
function TagProductsModal({ post, onClose, onSuccess }: { post: SocialPostResponse; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<ProductTagDto[]>(post.productTags || []);
  
  const [searchVal, setSearchVal] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [tagX, setTagX] = useState(50);
  const [tagY, setTagY] = useState(50);
  const [tagLabel, setTagLabel] = useState('');

  // Fetch products lists
  const { data: prodData } = useProducts({ search: searchVal || undefined, limit: 8 });

  const tagMut = useTagProducts();

  const handleAddTag = () => {
    if (!selectedProduct) return;
    const newTag = {
      productId: selectedProduct.id,
      label: tagLabel || selectedProduct.name,
      tagX,
      tagY,
      displayOrder: tags.length,
    };
    setTags((prev) => [...prev, newTag]);
    setSelectedProduct(null);
    setTagLabel('');
    setTagX(50);
    setTagY(50);
  };

  const handleRemoveTag = (idx: number) => {
    setTags((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTags = async () => {
    setError(null);
    try {
      await tagMut.mutateAsync({
        id: post.id,
        tags: tags.map((t) => ({
          productId: t.productId,
          label: t.label,
          tagX: t.tagX,
          tagY: t.tagY,
          displayOrder: t.displayOrder,
        })),
      });
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to save coordinates tags'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Tag Products Coordinate Mapping</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-655 font-semibold">{error}</div>}

        {/* Existing Tags list display */}
        <div className="mt-4 space-y-2">
          <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Attached Shoppable Tags ({tags.length})</label>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1.5 border border-neutral-200 rounded-xl bg-neutral-50">
            {tags.map((t, idx) => (
              <div key={idx} className="bg-white border border-neutral-250 rounded-lg px-2.5 py-1 text-[10px] font-semibold text-neutral-700 flex items-center gap-1.5 shadow-sm">
                <span>{t.label} (X:{t.tagX}%, Y:{t.tagY}%)</span>
                <button type="button" onClick={() => handleRemoveTag(idx)} className="text-neutral-400 hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {tags.length === 0 && <span className="text-[10px] text-neutral-400 italic">No coordinate tags mapped.</span>}
          </div>
        </div>

        {/* Form to add a coordinate tag */}
        <div className="border-t border-neutral-100 pt-4 mt-4 space-y-3">
          <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Add Coordinate Product Tag</h4>

          {/* Catalog search */}
          <div>
            <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Search Catalog</label>
            <input
              type="text"
              placeholder="Type to search items..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            />
            
            {/* Search list display */}
            {searchVal && prodData?.data && (
              <div className="max-h-24 overflow-y-auto border border-neutral-200 rounded-lg mt-1 bg-white divide-y divide-neutral-100">
                {prodData.data.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setSearchVal('');
                    }}
                    className="p-2 hover:bg-neutral-50 cursor-pointer text-[10px] font-semibold text-neutral-800"
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="border border-neutral-200 rounded-xl bg-neutral-50/50 p-3 space-y-3">
              <div className="text-[10px] text-neutral-900 font-bold uppercase tracking-wider">Mapping Target: {selectedProduct.name}</div>

              {/* Tag Label */}
              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Tag Label Override</label>
                <input
                  type="text"
                  placeholder={selectedProduct.name}
                  value={tagLabel}
                  onChange={(e) => setTagLabel(e.target.value)}
                  className="mt-1 w-full bg-white border border-neutral-200 rounded px-2 py-1 focus:outline-none text-[10px]"
                />
              </div>

              {/* Tag Coordinates relative X and Y sliders */}
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Horizontal Coord X: {tagX}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tagX}
                    onChange={(e) => setTagX(parseInt(e.target.value))}
                    className="w-full mt-2 accent-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Vertical Coord Y: {tagY}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tagY}
                    onChange={(e) => setTagY(parseInt(e.target.value))}
                    className="w-full mt-2 accent-neutral-900"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTag}
                className="w-full bg-neutral-950 hover:bg-neutral-900 text-white font-bold py-1.5 rounded-lg text-2xs transition"
              >
                Add Tag
              </button>
            </div>
          )}
        </div>

        {/* Save button footer */}
        <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-neutral-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTags}
            disabled={tagMut.isPending}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
          >
            {tagMut.isPending && <ButtonLoader />} Save Coordinate Tags
          </button>
        </div>
      </div>
    </div>
  );
}

// Inner Modal to action safety reports
function ActionReportModal({ report, onClose, onSuccess }: { report: SocialReportResponse; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  
  const resolveMut = useResolveReport();

  const executeAction = async (action: 'DISMISS' | 'TAKE_ACTION') => {
    setError(null);
    try {
      await resolveMut.mutateAsync({
        id: report.id,
        dto: { action, resolution: resolution || undefined }
      });
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to resolve report'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 font-sans">Moderate Safety Flag</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-655 font-semibold">{error}</div>}

        <div className="mt-4 space-y-3">
          <div className="bg-neutral-50 p-3 border border-neutral-200 rounded-xl space-y-1">
            <div className="font-bold text-neutral-800 uppercase tracking-wider text-[9px]">Report Description</div>
            <p className="text-neutral-600 font-medium leading-relaxed">{report.description}</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Resolution Logs Note</label>
            <textarea
              rows={3}
              placeholder="Provide a reason for moderation action (dismissing or archiving content)..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 focus:outline-none resize-none font-sans"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-neutral-100">
          <button
            onClick={() => executeAction('DISMISS')}
            disabled={resolveMut.isPending}
            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2 px-3 rounded-lg transition"
          >
            Dismiss Report
          </button>
          <button
            onClick={() => executeAction('TAKE_ACTION')}
            disabled={resolveMut.isPending}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl shadow-sm transition"
          >
            Archive Content
          </button>
        </div>
      </div>
    </div>
  );
}
