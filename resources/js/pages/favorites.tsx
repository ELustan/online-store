import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type FavoriteProduct = {
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
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Favorites',
        href: '/favorites',
    },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function Favorites() {
    const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        axios
            .get('/api/favorites', { signal: controller.signal })
            .then((response) => {
                setFavorites(response.data.favorites ?? []);
                setLoading(false);
            })
            .catch((fetchError) => {
                if (axios.isCancel(fetchError)) return;
                console.error('Error fetching favorites:', fetchError);
                setError('Unable to load favorites right now.');
                setLoading(false);
            });

        return () => controller.abort();
    }, []);

    const formatCurrency = (value: number) => currencyFormatter.format(value);

    const handleRemove = async (productId: number) => {
        try {
            await axios.delete(`/api/favorites/${productId}`);
            setFavorites((prev) => prev.filter((item) => item.id !== productId));
        } catch (deleteError) {
            console.error('Failed to remove favorite:', deleteError);
            setError('Unable to remove favorite right now.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Favorites" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold">Favorite products</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {favorites.length ? `${favorites.length} items saved` : 'Save items you love.'}
                            </p>
                        </div>
                    </div>
                    {error ? (
                        <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
                    ) : (
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                                : favorites.map((product) => (
                                      <div
                                          key={product.id}
                                          className="flex h-full flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 shadow-sm dark:border-sidebar-border"
                                      >
                                          <div className="relative h-36 overflow-hidden rounded-lg border border-sidebar-border/50 bg-muted/40 dark:border-sidebar-border">
                                              {product.image ? (
                                                  <img
                                                      src={product.image}
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
                                          <p className="mt-3 max-h-10 overflow-hidden text-sm text-muted-foreground">
                                              {product.description ?? 'No description provided.'}
                                          </p>
                                          <div className="mt-4 flex items-center justify-between">
                                              <div>
                                                  <span className="text-lg font-semibold">
                                                      {formatCurrency(product.final_price)}
                                                  </span>
                                                  {product.cashback_percent > 0 && (
                                                      <p className="text-xs text-muted-foreground">
                                                          Earn {formatCurrency(product.cashback_amount)} cashback
                                                      </p>
                                                  )}
                                              </div>
                                              <button
                                                  className="rounded-md border border-sidebar-border/70 px-3 py-2 text-xs font-semibold dark:border-sidebar-border"
                                                  onClick={() => handleRemove(product.id)}
                                                  type="button"
                                              >
                                                  Remove
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                        </div>
                    )}
                    {!loading && favorites.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-dashed border-sidebar-border/60 p-6 text-sm text-muted-foreground dark:border-sidebar-border">
                            No favorites yet.
                        </div>
                    ) : null}
                </div>
            </div>
        </AppLayout>
    );
}
