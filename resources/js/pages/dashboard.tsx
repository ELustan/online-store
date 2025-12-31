import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useRef, useState } from 'react';

type Product = {
    id: number;
    name: string;
    slug: string;
    category: string | null;
    image?: string | null;
    description?: string | null;
    price: number;
    discount_percent: number;
    cashback_percent: number;
    promo_label?: string | null;
    promo_expires_at?: string | null;
    promo_active: boolean;
    final_price: number;
    cashback_amount: number;
    rating_average?: number | null;
    reviews_count?: number;
    reviews?: {
        id: number;
        rating: number;
        comment: string;
        reviewer: string;
    }[];
};

type ProductResponse = {
    current_page: number;
    data: Product[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function Dashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [range, setRange] = useState<{ from: number | null; to: number | null }>({
        from: null,
        to: null,
    });
    const [cart, setCart] = useState<Record<number, number>>({});
    const [checkoutState, setCheckoutState] = useState<{
        productId: number | null;
        status: 'idle' | 'loading' | 'success' | 'error';
        message?: string;
    }>({
        productId: null,
        status: 'idle',
    });
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [favoritePulse, setFavoritePulse] = useState<number | null>(null);
    const [favoriteToast, setFavoriteToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(
        null,
    );
    const favoriteToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [cartReady, setCartReady] = useState(false);
    const cartSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        min_price: '',
        max_price: '',
    });
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wallet'>('stripe');

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        axios
            .get('/api/products', {
                signal: controller.signal,
                params: {
                    page: currentPage,
                    per_page: perPage,
                    ...(filters.search ? { search: filters.search } : {}),
                    ...(filters.category ? { category: filters.category } : {}),
                    ...(filters.min_price ? { min_price: filters.min_price } : {}),
                    ...(filters.max_price ? { max_price: filters.max_price } : {}),
                },
            })
            .then((response) => {
                const payload: ProductResponse = response.data.products;
                setProducts(payload.data);
                setLastPage(payload.last_page);
                setTotal(payload.total);
                setRange({ from: payload.from, to: payload.to });
                setLoading(false);
            })
            .catch((error) => {
                if (axios.isCancel(error)) return;
                console.error('Error fetching data:', error);
                setError('Unable to load products right now.');
                setLoading(false);
            });

        return () => controller.abort();
    }, [currentPage, perPage, filters]);

    useEffect(() => {
        const controller = new AbortController();
        axios
            .get('/api/favorites', { signal: controller.signal })
            .then((response) => {
                const ids = (response.data.favorites ?? []).map((item: Product) => item.id);
                setFavorites(new Set(ids));
            })
            .catch((favoriteError) => {
                if (axios.isCancel(favoriteError)) return;
                console.error('Error fetching favorites:', favoriteError);
            });

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        axios
            .get('/api/cart', { signal: controller.signal })
            .then((response) => {
                setCart(response.data.items ?? {});
                setCartReady(true);
            })
            .catch((cartError) => {
                if (axios.isCancel(cartError)) return;
                console.error('Error fetching cart:', cartError);
                setCartReady(true);
            });

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        axios
            .get('/api/wallet', { signal: controller.signal })
            .then((response) => {
                setWalletBalance(response.data.balance ?? 0);
            })
            .catch((walletError) => {
                if (axios.isCancel(walletError)) return;
                console.error('Error fetching wallet:', walletError);
            });

        return () => controller.abort();
    }, []);

    useEffect(() => {
        return () => {
            if (favoriteToastTimer.current) {
                clearTimeout(favoriteToastTimer.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!cartReady) return;
        if (cartSyncTimer.current) {
            clearTimeout(cartSyncTimer.current);
        }
        cartSyncTimer.current = setTimeout(() => {
            const items = Object.entries(cart).map(([productId, quantity]) => ({
                product_id: Number(productId),
                quantity,
            }));
            axios.post('/api/cart', { items }).catch((cartError) => {
                console.error('Error saving cart:', cartError);
            });
        }, 400);

        return () => {
            if (cartSyncTimer.current) {
                clearTimeout(cartSyncTimer.current);
            }
        };
    }, [cart, cartReady]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const formatCurrency = (value: number) => currencyFormatter.format(value);

    const formatPromoDate = (value?: string | null) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
    };

    const handleAddToCart = (productId: number) => {
        setCart((prev) => ({
            ...prev,
            [productId]: (prev[productId] ?? 0) + 1,
        }));
    };

    const handleRemoveFromCart = (productId: number) => {
        setCart((prev) => {
            const next = { ...prev };
            if (!next[productId]) return next;
            if (next[productId] === 1) {
                delete next[productId];
                return next;
            }
            next[productId] = next[productId] - 1;
            return next;
        });
    };

    const handleCheckout = async () => {
        const items = Object.entries(cart).map(([productId, quantity]) => ({
            product_id: Number(productId),
            quantity,
        }));

        if (items.length === 0) {
            setCheckoutState({
                productId: null,
                status: 'error',
                message: 'Your cart is empty.',
            });
            return;
        }

        setCheckoutState({ productId: null, status: 'loading' });
        try {
            const response = await axios.post('/api/checkout', {
                items,
                payment_method: paymentMethod,
            });
            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
                return;
            }
            setCheckoutState({
                productId: null,
                status: 'success',
                message: `Payment session ${response.data.payment_reference} created.`,
            });
            setCart({});
            await axios.delete('/api/cart');
            if (typeof response.data.wallet_balance === 'number') {
                setWalletBalance(response.data.wallet_balance);
            }
        } catch (checkoutError) {
            console.error('Checkout failed:', checkoutError);
            setCheckoutState({
                productId: null,
                status: 'error',
                message:
                    (checkoutError as any)?.response?.data?.message ??
                    'Payment setup failed. Try again.',
            });
        }
    };

    const showFavoriteToast = (message: string, tone: 'success' | 'error') => {
        setFavoriteToast({ message, tone });
        if (favoriteToastTimer.current) {
            clearTimeout(favoriteToastTimer.current);
        }
        favoriteToastTimer.current = setTimeout(() => {
            setFavoriteToast(null);
            favoriteToastTimer.current = null;
        }, 2200);
    };

    const toggleFavorite = async (productId: number) => {
        const next = new Set(favorites);
        const isFavorite = next.has(productId);
        next[isFavorite ? 'delete' : 'add'](productId);
        setFavorites(next);
        setFavoritePulse(productId);
        setTimeout(() => setFavoritePulse(null), 400);

        try {
            if (isFavorite) {
                await axios.delete(`/api/favorites/${productId}`);
                showFavoriteToast('Removed from favorites.', 'success');
            } else {
                await axios.post('/api/favorites', { product_id: productId });
                showFavoriteToast('Added to favorites.', 'success');
            }
        } catch (favoriteError) {
            console.error('Favorite update failed:', favoriteError);
            const rollback = new Set(favorites);
            setFavorites(rollback);
            showFavoriteToast('Unable to update favorites.', 'error');
        }
    };

    const cartItems = products
        .filter((product) => cart[product.id])
        .map((product) => ({
            ...product,
            quantity: cart[product.id],
            lineTotal: product.final_price * cart[product.id],
            lineCashback: product.cashback_amount * cart[product.id],
        }));

    const categoryOptions = useMemo(() => {
        const unique = new Set<string>();
        products.forEach((product) => {
            if (product.category) {
                unique.add(product.category);
            }
        });
        return Array.from(unique).sort();
    }, [products]);

    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const cartCashback = cartItems.reduce((sum, item) => sum + item.lineCashback, 0);
    const canPayWithWallet =
        walletBalance !== null && walletBalance >= cartSubtotal && cartItems.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {favoriteToast ? (
                    <div className="pointer-events-none fixed right-6 top-6 z-50">
                        <div
                            className={`rounded-lg border px-4 py-2 text-sm shadow-lg ${
                                favoriteToast.tone === 'success'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-red-200 bg-red-50 text-red-700'
                            }`}
                        >
                            {favoriteToast.message}
                        </div>
                    </div>
                ) : null}
                <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-muted/40 via-background to-muted/30 p-6 dark:border-sidebar-border">
                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-400/20" />
                    <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-400/20" />
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                Online Store
                            </p>
                            <h1 className="mt-2 text-2xl font-semibold text-foreground">
                                Secure payments, instant savings
                            </h1>
                            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                                Shop curated products with transparent pricing, active promos, and automatic cashback.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="min-w-[140px] rounded-lg border border-sidebar-border/60 bg-background/80 px-4 py-3 shadow-sm dark:border-sidebar-border">
                                <p className="text-xs text-muted-foreground">Products</p>
                                <p className="text-lg font-semibold">{total}</p>
                            </div>
                            <div className="min-w-[140px] rounded-lg border border-sidebar-border/60 bg-background/80 px-4 py-3 shadow-sm dark:border-sidebar-border">
                                <p className="text-xs text-muted-foreground">Secure checkout</p>
                                <p className="text-lg font-semibold">Enabled</p>
                            </div>
                            <div className="min-w-[140px] rounded-lg border border-sidebar-border/60 bg-background/80 px-4 py-3 shadow-sm dark:border-sidebar-border">
                                <p className="text-xs text-muted-foreground">Promos today</p>
                                <p className="text-lg font-semibold">
                                    {products.filter((product) => product.promo_active).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Filter products</h2>
                            <p className="text-sm text-muted-foreground">
                                Search, category, or price range to refine the list.
                            </p>
                        </div>
                        <button
                            className="rounded-md border border-sidebar-border/70 px-3 py-1 text-xs font-semibold dark:border-sidebar-border"
                            onClick={() =>
                                setFilters({
                                    search: '',
                                    category: '',
                                    min_price: '',
                                    max_price: '',
                                })
                            }
                            type="button"
                        >
                            Clear filters
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="Search products"
                            value={filters.search}
                            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        />
                        <select
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            value={filters.category}
                            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                        >
                            <option value="">All categories</option>
                            {categoryOptions.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="Min price"
                            value={filters.min_price}
                            onChange={(event) => setFilters((prev) => ({ ...prev, min_price: event.target.value }))}
                            type="number"
                            min="0"
                        />
                        <input
                            className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                            placeholder="Max price"
                            value={filters.max_price}
                            onChange={(event) => setFilters((prev) => ({ ...prev, max_price: event.target.value }))}
                            type="number"
                            min="0"
                        />
                    </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                        <div className="flex flex-col gap-3 border-b border-sidebar-border/70 px-4 py-4 md:flex-row md:items-center md:justify-between dark:border-sidebar-border">
                            <div>
                                <h2 className="text-lg font-semibold">Products</h2>
                                <p className="text-sm text-muted-foreground">
                                    {total > 0 && range.from !== null && range.to !== null
                                        ? `Showing ${range.from}-${range.to} of ${total}`
                                        : 'No products found'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="rounded-md border border-sidebar-border/70 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-sidebar-border"
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={loading || currentPage === 1}
                                    type="button"
                                >
                                    Prev
                                </button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {lastPage}
                                </span>
                                <button
                                    className="rounded-md border border-sidebar-border/70 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-sidebar-border"
                                    onClick={() => setCurrentPage((page) => Math.min(lastPage, page + 1))}
                                    disabled={loading || currentPage === lastPage}
                                    type="button"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                        {error ? (
                            <div className="px-4 py-6 text-sm text-red-600 dark:text-red-400">{error}</div>
                        ) : (
                            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                                {loading
                                    ? Array.from({ length: 6 }).map((_, index) => (
                                          <div
                                              key={`skeleton-${index}`}
                                              className="space-y-3 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                          >
                                              <div className="h-36 w-full animate-pulse rounded-lg bg-muted" />
                                              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                                              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                                              <div className="h-8 w-full animate-pulse rounded bg-muted" />
                                          </div>
                                      ))
                                    : products.map((product) => {
                                          const promoDate = formatPromoDate(product.promo_expires_at);
                                          const showDiscount = product.discount_percent > 0;
                                          const showCashback = product.cashback_percent > 0;
                                          return (
                                              <div
                                                  key={product.id}
                                                  className="flex h-full flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-sidebar-border"
                                              >
                                                  <div className="relative h-36 overflow-hidden rounded-lg border border-sidebar-border/50 bg-muted/40 dark:border-sidebar-border">
                                                      {product.image ? (
                                                          <img
                                                              src={`/storage/${product.image}`}
                                                              alt={product.name}
                                                              className="h-full w-full object-cover"
                                                              loading="lazy"
                                                          /> 
                                                      ) : (
                                                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                                              No image
                                                          </div>
                                                      )}
                                                  </div>
                                                  <div className="mt-4 flex items-start justify-between gap-3">
                                                      <div>
                                                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                                              {product.category ?? 'Unassigned'}
                                                          </p>
                                                          <h3 className="text-lg font-semibold">{product.name}</h3>
                                                      </div>
                                                      {product.promo_active && (
                                                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                                                              {product.promo_label ?? 'Promo'}
                                                          </span>
                                                      )}
                                                  </div>
                                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                                  {showDiscount && (
                                                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                                                          {product.discount_percent}% off
                                                      </span>
                                                  )}
                                                  {showCashback && (
                                                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-200">
                                                          {product.cashback_percent}% cashback
                                                      </span>
                                                  )}
                                                  <span className="text-xs text-muted-foreground">
                                                      {product.rating_average !== null && product.rating_average !== undefined
                                                          ? `${product.rating_average.toFixed(1)} / 5`
                                                          : 'No ratings'}
                                                      {product.reviews_count ? ` (${product.reviews_count})` : ''}
                                                  </span>
                                                  {promoDate && (
                                                      <span className="text-xs text-muted-foreground">
                                                          Ends {promoDate}
                                                      </span>
                                                  )}
                                              </div>
                                                  <p className="mt-3 max-h-10 overflow-hidden text-sm text-muted-foreground">
                                                      {product.description ?? 'No description provided.'}
                                                  </p>
                                              <div className="mt-4 flex items-end justify-between">
                                                  <div>
                                                          {showDiscount ? (
                                                              <div className="flex items-center gap-2">
                                                                  <span className="text-lg font-semibold">
                                                                      {formatCurrency(product.final_price)}
                                                                  </span>
                                                                  <span className="text-xs text-muted-foreground line-through">
                                                                      {formatCurrency(product.price)}
                                                                  </span>
                                                              </div>
                                                          ) : (
                                                              <span className="text-lg font-semibold">
                                                                  {formatCurrency(product.price)}
                                                              </span>
                                                          )}
                                                          {showCashback && (
                                                              <p className="text-xs text-muted-foreground">
                                                                  Earn {formatCurrency(product.cashback_amount)} cashback
                                                              </p>
                                                          )}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      <button
                                                          className={`rounded-md border px-2 py-2 text-xs font-semibold transition duration-200 dark:border-sidebar-border ${
                                                              favorites.has(product.id)
                                                                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                                                                  : 'border-sidebar-border/70 text-muted-foreground'
                                                          } ${
                                                              favoritePulse === product.id
                                                                  ? 'scale-110 rotate-12 shadow-md'
                                                                  : 'scale-100'
                                                          }`}
                                                          onClick={() => toggleFavorite(product.id)}
                                                          type="button"
                                                      >
                                                          {favorites.has(product.id) ? '★' : '☆'}
                                                      </button>
                                                      <button
                                                          className="rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                          onClick={() => handleAddToCart(product.id)}
                                                          disabled={checkoutState.status === 'loading'}
                                                          type="button"
                                                      >
                                                          Add to cart
                                                      </button>
                                                  </div>
                                              </div>
                                              {product.reviews?.length ? (
                                                  <div className="mt-4 rounded-lg border border-sidebar-border/60 bg-muted/30 p-3 text-xs text-muted-foreground dark:border-sidebar-border">
                                                      <div className="text-xs font-semibold uppercase text-muted-foreground">
                                                          Recent reviews
                                                      </div>
                                                      <div className="mt-2 space-y-2">
                                                          {product.reviews.map((review) => (
                                                              <div key={review.id} className="space-y-1">
                                                                  <div className="flex items-center justify-between">
                                                                      <span className="text-foreground">
                                                                          {review.reviewer}
                                                                      </span>
                                                                      <span>{'★'.repeat(review.rating)}</span>
                                                                  </div>
                                                                  <p className="text-xs">{review.comment}</p>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              ) : null}
                                          </div>
                                      );
                                  })}
                            </div>
                        )}
                    </div>
                    <div className="lg:sticky lg:top-6 lg:self-start">
                        <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">Shopping list</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {cartItems.length ? 'Items ready for checkout' : 'Your cart is empty'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                {cartItems.length ? (
                                    cartItems.map((item) => (
                                        <div
                                            key={`cart-${item.id}`}
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sidebar-border/60 p-3 dark:border-sidebar-border"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatCurrency(item.final_price)} each
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="rounded-md border border-sidebar-border/70 px-2 py-1 text-xs dark:border-sidebar-border"
                                                    onClick={() => handleRemoveFromCart(item.id)}
                                                    type="button"
                                                >
                                                    -
                                                </button>
                                                <span className="text-sm font-semibold">{item.quantity}</span>
                                                <button
                                                    className="rounded-md border border-sidebar-border/70 px-2 py-1 text-xs dark:border-sidebar-border"
                                                    onClick={() => handleAddToCart(item.id)}
                                                    type="button"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="text-sm font-semibold">
                                                {formatCurrency(item.lineTotal)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-lg border border-dashed border-sidebar-border/60 p-6 text-sm text-muted-foreground dark:border-sidebar-border">
                                        Add products to build your shopping list.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                            <h2 className="text-lg font-semibold">Checkout</h2>
                            <p className="text-sm text-muted-foreground">Review totals before paying.</p>
                            <div className="mt-3 rounded-lg border border-sidebar-border/60 bg-muted/30 p-3 text-xs text-muted-foreground dark:border-sidebar-border">
                                <div className="flex items-center justify-between">
                                    <span>Cashback wallet</span>
                                    <span className="font-semibold text-foreground">
                                        {walletBalance !== null ? formatCurrency(walletBalance) : '—'}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                                            paymentMethod === 'stripe'
                                                ? 'border-foreground bg-foreground text-background'
                                                : 'border-sidebar-border/70 text-muted-foreground'
                                        }`}
                                        onClick={() => setPaymentMethod('stripe')}
                                        type="button"
                                    >
                                        Pay by card
                                    </button>
                                    <button
                                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                                            paymentMethod === 'wallet'
                                                ? 'border-foreground bg-foreground text-background'
                                                : 'border-sidebar-border/70 text-muted-foreground'
                                        }`}
                                        onClick={() => setPaymentMethod('wallet')}
                                        type="button"
                                    >
                                        Use cashback
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Items</span>
                                    <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-semibold">{formatCurrency(cartSubtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Cashback</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                                        {formatCurrency(cartCashback)}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="mt-4 w-full rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={handleCheckout}
                                disabled={
                                    checkoutState.status === 'loading' ||
                                    cartItems.length === 0 ||
                                    (paymentMethod === 'wallet' && !canPayWithWallet)
                                }
                                type="button"
                            >
                                {checkoutState.status === 'loading'
                                    ? 'Processing...'
                                    : paymentMethod === 'wallet'
                                      ? 'Pay with cashback'
                                      : 'Checkout with card'}
                            </button>
                            {paymentMethod === 'wallet' && !canPayWithWallet && cartItems.length > 0 ? (
                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                                    Cashback balance is insufficient for this order.
                                </p>
                            ) : null}
                            {checkoutState.status !== 'idle' && checkoutState.message ? (
                                <p
                                    className={`mt-3 text-xs ${
                                        checkoutState.status === 'success'
                                            ? 'text-emerald-600 dark:text-emerald-300'
                                            : checkoutState.status === 'error'
                                              ? 'text-red-600 dark:text-red-300'
                                              : 'text-muted-foreground'
                                    }`}
                                >
                                    {checkoutState.message}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
