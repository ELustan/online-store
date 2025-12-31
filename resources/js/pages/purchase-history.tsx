import AppLayout from '@/layouts/app-layout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Fragment, useEffect, useMemo, useState } from 'react';

type Purchase = {
    id: number;
    payment_reference: string;
    status: string;
    currency: string;
    purchased_at: string | null;
    subtotal: number;
    discount_total: number;
    amount_due: number;
    cashback_total: number;
    items_count: number;
    items: {
        id: number;
        product_id: number | null;
        name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
        discount_amount: number;
        cashback_amount: number;
    }[];
};

type PurchaseResponse = {
    current_page: number;
    data: Purchase[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Purchase history',
        href: '/purchase-history',
    },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function PurchaseHistory() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [range, setRange] = useState<{ from: number | null; to: number | null }>({
        from: null,
        to: null,
    });
    const [filters, setFilters] = useState({
        status: '',
        reference: '',
        from: '',
        to: '',
        min_total: '',
        max_total: '',
    });
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [activeTab, setActiveTab] = useState<'history' | 'reviews'>('history');
    const [ratingModal, setRatingModal] = useState<{
        productId: number;
        name: string;
    } | null>(null);
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [ratingError, setRatingError] = useState<string | null>(null);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const queryParams = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.reference) params.set('reference', filters.reference);
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);
        if (filters.min_total) params.set('min_total', filters.min_total);
        if (filters.max_total) params.set('max_total', filters.max_total);
        params.set('page', String(currentPage));
        params.set('per_page', '10');
        return params;
    }, [currentPage, filters]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        axios
            .get('/api/purchases', {
                signal: controller.signal,
                params: Object.fromEntries(queryParams.entries()),
            })
            .then((response) => {
                const payload: PurchaseResponse = response.data.purchases;
                setPurchases(payload.data);
                setLastPage(payload.last_page);
                setTotal(payload.total);
                setRange({ from: payload.from, to: payload.to });
                setLoading(false);
            })
            .catch((fetchError) => {
                if (axios.isCancel(fetchError)) return;
                console.error('Error fetching purchases:', fetchError);
                setError('Unable to load purchase history right now.');
                setLoading(false);
            });

        return () => controller.abort();
    }, [queryParams]);

    const formatCurrency = (value: number) => currencyFormatter.format(value);

    const handleExport = (type: 'csv' | 'print') => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.reference) params.set('reference', filters.reference);
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);
        if (filters.min_total) params.set('min_total', filters.min_total);
        if (filters.max_total) params.set('max_total', filters.max_total);
        const url = `/api/purchases/export/${type}?${params.toString()}`;
        if (type === 'print') {
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        window.location.href = url;
    };

    const toggleExpanded = (purchaseId: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(purchaseId)) {
                next.delete(purchaseId);
            } else {
                next.add(purchaseId);
            }
            return next;
        });
    };

    const reviewableItems = useMemo(() => {
        const map = new Map<number, { productId: number; name: string; quantity: number }>();
        purchases.forEach((purchase) => {
            purchase.items?.forEach((item) => {
                if (!item.product_id) return;
                const existing = map.get(item.product_id);
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    map.set(item.product_id, {
                        productId: item.product_id,
                        name: item.name,
                        quantity: item.quantity,
                    });
                }
            });
        });
        return Array.from(map.values());
    }, [purchases]);

    const openRatingModal = (productId: number, name: string) => {
        setRatingModal({ productId, name });
        setRatingValue(5);
        setRatingComment('');
        setRatingError(null);
    };

    const handleSubmitRating = async () => {
        if (!ratingModal) return;
        setRatingSubmitting(true);
        setRatingError(null);
        try {
            const response = await axios.post(`/api/products/${ratingModal.productId}/reviews`, {
                rating: ratingValue,
                comment: ratingComment,
            });
            setToast(response.data.message ?? 'Review submitted.');
            setRatingModal(null);
        } catch (submitError: any) {
            console.error('Review submit failed:', submitError);
            setRatingError(
                submitError?.response?.data?.message ??
                    'Unable to submit your review right now.',
            );
        } finally {
            setRatingSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase history" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {toast ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        {toast}
                    </div>
                ) : null}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-lg font-semibold">Purchase history</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {total > 0 && range.from !== null && range.to !== null
                                    ? `Showing ${range.from}-${range.to} of ${total}`
                                    : 'Track completed checkouts and totals.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                className="rounded-md border border-sidebar-border/70 px-3 py-1 text-xs font-semibold dark:border-sidebar-border"
                                onClick={() => handleExport('csv')}
                                type="button"
                            >
                                Export Excel (CSV)
                            </button>
                            <button
                                className="rounded-md bg-foreground px-3 py-1 text-xs font-semibold text-background"
                                onClick={() => handleExport('print')}
                                type="button"
                            >
                                Print / PDF
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                                activeTab === 'history'
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-sidebar-border/70 text-muted-foreground'
                            }`}
                            onClick={() => setActiveTab('history')}
                            type="button"
                        >
                            Purchase history
                        </button>
                        <button
                            className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                                activeTab === 'reviews'
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-sidebar-border/70 text-muted-foreground'
                            }`}
                            onClick={() => setActiveTab('reviews')}
                            type="button"
                        >
                            Reviews
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="Status"
                            value={filters.status}
                            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                        />
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="Reference"
                            value={filters.reference}
                            onChange={(event) =>
                                setFilters((prev) => ({ ...prev, reference: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="From (YYYY-MM-DD)"
                            value={filters.from}
                            type="date"
                            onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                        />
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="To (YYYY-MM-DD)"
                            value={filters.to}
                            type="date"
                            onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                        />
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="Min total"
                            value={filters.min_total}
                            onChange={(event) =>
                                setFilters((prev) => ({ ...prev, min_total: event.target.value }))
                            }
                        />
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="Max total"
                            value={filters.max_total}
                            onChange={(event) =>
                                setFilters((prev) => ({ ...prev, max_total: event.target.value }))
                            }
                        />
                    </div>
                    {activeTab === 'history' ? (
                        <>
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    className="rounded-md border border-sidebar-border/70 px-3 py-1 text-xs dark:border-sidebar-border"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={loading || currentPage === 1}
                                    type="button"
                                >
                                    Prev
                                </button>
                                <span className="text-xs text-muted-foreground">
                                    Page {currentPage} of {lastPage}
                                </span>
                                <button
                                    className="rounded-md border border-sidebar-border/70 px-3 py-1 text-xs dark:border-sidebar-border"
                                    onClick={() => setCurrentPage((page) => Math.min(lastPage, page + 1))}
                                    disabled={loading || currentPage === lastPage}
                                    type="button"
                                >
                                    Next
                                </button>
                            </div>
                            {error ? (
                                <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
                            ) : (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3">Reference</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3">Purchased</th>
                                                <th className="px-4 py-3">Items</th>
                                                <th className="px-4 py-3">Amount</th>
                                                <th className="px-4 py-3">Cashback</th>
                                                <th className="px-4 py-3 text-right">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading
                                                ? Array.from({ length: 6 }).map((_, index) => (
                                                      <tr
                                                          key={`skeleton-${index}`}
                                                          className="border-b border-sidebar-border/70 dark:border-sidebar-border"
                                                      >
                                                          <td className="px-4 py-4">
                                                              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                                                          </td>
                                                          <td className="px-4 py-4">
                                                              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                                                          </td>
                                                          <td className="px-4 py-4">
                                                              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                                          </td>
                                                          <td className="px-4 py-4">
                                                              <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                                                          </td>
                                                          <td className="px-4 py-4">
                                                              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                                                          </td>
                                                          <td className="px-4 py-4">
                                                              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                                                          </td>
                                                          <td className="px-4 py-4">
                                                              <div className="h-4 w-10 animate-pulse rounded bg-muted" />
                                                          </td>
                                                      </tr>
                                                  ))
                                                : purchases.map((purchase) => (
                                                      <Fragment key={purchase.id}>
                                                          <tr
                                                              className="border-b border-sidebar-border/70 dark:border-sidebar-border"
                                                          >
                                                              <td className="px-4 py-3 text-xs font-medium">
                                                                  {purchase.payment_reference}
                                                              </td>
                                                              <td className="px-4 py-3 text-xs uppercase text-muted-foreground">
                                                                  {purchase.status}
                                                              </td>
                                                              <td className="px-4 py-3 text-xs">
                                                                  {purchase.purchased_at
                                                                      ? new Date(purchase.purchased_at).toLocaleDateString()
                                                                      : '—'}
                                                              </td>
                                                              <td className="px-4 py-3 text-xs">{purchase.items_count}</td>
                                                              <td className="px-4 py-3 text-xs font-semibold">
                                                                  {formatCurrency(purchase.amount_due)}
                                                              </td>
                                                              <td className="px-4 py-3 text-xs text-emerald-600 dark:text-emerald-300">
                                                                  {formatCurrency(purchase.cashback_total)}
                                                              </td>
                                                              <td className="px-4 py-3 text-right text-xs">
                                                                  <button
                                                                      className="rounded-md border border-sidebar-border/70 px-2 py-1 text-xs font-semibold dark:border-sidebar-border"
                                                                      onClick={() => toggleExpanded(purchase.id)}
                                                                      type="button"
                                                                  >
                                                                      {expanded.has(purchase.id) ? 'Hide' : 'View'}
                                                                  </button>
                                                              </td>
                                                          </tr>
                                                          {expanded.has(purchase.id) ? (
                                                              <tr className="border-b border-sidebar-border/70 dark:border-sidebar-border">
                                                                  <td className="px-4 pb-4 text-xs text-muted-foreground" colSpan={7}>
                                                                      <div className="rounded-lg border border-sidebar-border/60 bg-muted/40 p-3 dark:border-sidebar-border">
                                                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                                                              <span className="text-xs font-semibold uppercase text-muted-foreground">
                                                                                  Items breakdown
                                                                              </span>
                                                                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                                                  <span>Subtotal: {formatCurrency(purchase.subtotal)}</span>
                                                                                  <span>Discount: {formatCurrency(purchase.discount_total)}</span>
                                                                                  <span>Cashback: {formatCurrency(purchase.cashback_total)}</span>
                                                                                  <span className="font-semibold text-foreground">
                                                                                      Total: {formatCurrency(purchase.amount_due)}
                                                                                  </span>
                                                                              </div>
                                                                          </div>
                                                                          <div className="mt-3 grid gap-2">
                                                                              {purchase.items?.length ? (
                                                                                  purchase.items.map((item) => (
                                                                                      <div
                                                                                          key={item.id}
                                                                                          className="flex flex-wrap items-center justify-between gap-2"
                                                                                      >
                                                                                          <div>
                                                                                              <span className="text-foreground">
                                                                                                  {item.name}
                                                                                              </span>{' '}
                                                                                              x{item.quantity}
                                                                                              <span className="ml-2 text-muted-foreground">
                                                                                                  {formatCurrency(item.unit_price)} each
                                                                                              </span>
                                                                                          </div>
                                                                                          <div className="flex flex-wrap items-center gap-3">
                                                                                              <span className="text-muted-foreground">
                                                                                                  Discount: {formatCurrency(item.discount_amount)}
                                                                                              </span>
                                                                                              <span className="text-muted-foreground">
                                                                                                  Cashback: {formatCurrency(item.cashback_amount)}
                                                                                              </span>
                                                                                              <span className="font-semibold text-foreground">
                                                                                                  {formatCurrency(item.line_total)}
                                                                                              </span>
                                                                                          </div>
                                                                                      </div>
                                                                                  ))
                                                                              ) : (
                                                                                  <span>No items recorded.</span>
                                                                              )}
                                                                          </div>
                                                                      </div>
                                                                  </td>
                                                              </tr>
                                                          ) : null}
                                                      </Fragment>
                                                  ))}
                                        </tbody>
                                    </table>
                                    {!loading && purchases.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-sidebar-border/60 p-6 text-sm text-muted-foreground dark:border-sidebar-border">
                                            No purchases found for the selected filters.
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={`review-skeleton-${index}`}
                                        className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                    >
                                        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                                        <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-muted" />
                                    </div>
                                ))
                            ) : reviewableItems.length ? (
                                reviewableItems.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Purchased {item.quantity}x
                                            </p>
                                        </div>
                                        <button
                                            className="rounded-md border border-sidebar-border/70 px-3 py-2 text-xs font-semibold dark:border-sidebar-border"
                                            onClick={() => openRatingModal(item.productId, item.name)}
                                            type="button"
                                        >
                                            Leave a review
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed border-sidebar-border/60 p-6 text-sm text-muted-foreground dark:border-sidebar-border">
                                    No purchased items available for review.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Dialog open={Boolean(ratingModal)} onOpenChange={(open) => (!open ? setRatingModal(null) : null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rate product</DialogTitle>
                        <DialogDescription>
                            Share your experience to help other shoppers.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium">
                                {ratingModal?.name ?? 'Product'}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        className={`rounded-md border px-2 py-1 text-sm ${
                                            star <= ratingValue
                                                ? 'border-amber-300 bg-amber-50 text-amber-700'
                                                : 'border-sidebar-border/70 text-muted-foreground'
                                        }`}
                                        onClick={() => setRatingValue(star)}
                                        type="button"
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            className="min-h-[120px] w-full rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-sm dark:border-sidebar-border"
                            placeholder="Write your review..."
                            value={ratingComment}
                            onChange={(event) => setRatingComment(event.target.value)}
                        />
                        {ratingError ? (
                            <p className="text-sm text-red-600 dark:text-red-400">{ratingError}</p>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <button
                            className="rounded-md border border-sidebar-border/70 px-3 py-2 text-sm dark:border-sidebar-border"
                            onClick={() => setRatingModal(null)}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            className="rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={handleSubmitRating}
                            disabled={ratingSubmitting || ratingComment.trim().length === 0}
                            type="button"
                        >
                            {ratingSubmitting ? 'Submitting...' : 'Submit review'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
