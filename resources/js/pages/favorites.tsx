import AppLayout from '@/layouts/app-layout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Heart, Trash2 } from 'lucide-react';
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
    images?: {
        id: number;
        url: string | null;
        caption?: string | null;
    }[];
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
    const [selectedImages, setSelectedImages] = useState<Record<number, string>>({});
    const [imageModal, setImageModal] = useState<{
        url: string;
        caption?: string | null;
        name: string;
    } | null>(null);
    const [descriptionSheet, setDescriptionSheet] = useState<{
        name: string;
        description: string;
    } | null>(null);

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

    const openImageModal = (url: string, product: FavoriteProduct) => {
        const match = product.images?.find((image) => image.url === url);
        setImageModal({
            url,
            caption: match?.caption ?? null,
            name: product.name,
        });
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
                        <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
                            <Heart className="h-4 w-4 text-rose-500" />
                            Keep what you like close.
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
                                : favorites.map((product) => {
                                      const previewImages = [
                                          product.image,
                                          ...(product.images ?? []).map((image) => image.url),
                                      ].filter((image): image is string => Boolean(image));
                                      const activeImage =
                                          selectedImages[product.id] ?? previewImages[0] ?? null;

                                      return (
                                          <div
                                              key={product.id}
                                              className="flex h-full flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 shadow-sm dark:border-sidebar-border"
                                          >
                                              <div className="relative h-36 overflow-hidden rounded-lg border border-sidebar-border/50 bg-muted/40 dark:border-sidebar-border">
                                                  {activeImage ? (
                                                      <button
                                                          className="h-full w-full"
                                                          onClick={() => openImageModal(activeImage, product)}
                                                          type="button"
                                                      >
                                                          <img
                                                              src={activeImage}
                                                              alt={product.name}
                                                              className="h-full w-full object-cover"
                                                              loading="lazy"
                                                          />
                                                      </button>
                                                  ) : (
                                                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                                          No image
                                                      </div>
                                                  )}
                                                  <button
                                                      className="absolute right-2 top-2 rounded-full border border-rose-200 bg-white/90 p-2 text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200"
                                                      onClick={() => handleRemove(product.id)}
                                                      type="button"
                                                      aria-label="Remove from favorites"
                                                  >
                                                      <Heart className="h-4 w-4 fill-current" />
                                                  </button>
                                              </div>
                                              {previewImages.length > 1 ? (
                                                  <div className="mt-2 flex flex-wrap gap-2">
                                                      {previewImages.map((image, index) => (
                                                          <button
                                                              key={`${product.id}-preview-${index}`}
                                                              className={`h-10 w-10 overflow-hidden rounded-md border ${
                                                                  activeImage === image
                                                                      ? 'border-foreground'
                                                                      : 'border-sidebar-border/70'
                                                              }`}
                                                              onClick={() =>
                                                                  setSelectedImages((prev) => ({
                                                                      ...prev,
                                                                      [product.id]: image,
                                                                  }))
                                                              }
                                                              type="button"
                                                          >
                                                              <img
                                                                  src={image}
                                                                  alt={`${product.name} preview ${index + 1}`}
                                                                  className="h-full w-full object-cover"
                                                                  loading="lazy"
                                                              />
                                                          </button>
                                                      ))}
                                                  </div>
                                              ) : null}
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
                                              <div
                                                  className="mt-3 max-h-12 overflow-hidden text-sm text-muted-foreground"
                                                  dangerouslySetInnerHTML={{
                                                      __html:
                                                          product.description ??
                                                          '<p>No description provided.</p>',
                                                  }}
                                              />
                                              {product.description ? (
                                                  <button
                                                      className="mt-2 text-xs font-semibold text-foreground/70"
                                                      onClick={() =>
                                                          setDescriptionSheet({
                                                              name: product.name,
                                                              description: product.description ?? '',
                                                          })
                                                      }
                                                      type="button"
                                                  >
                                                      Read full description
                                                  </button>
                                              ) : null}
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
                                                      className="inline-flex items-center gap-2 rounded-md border border-sidebar-border/70 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground dark:border-sidebar-border"
                                                      onClick={() => handleRemove(product.id)}
                                                      type="button"
                                                  >
                                                      <Trash2 className="h-4 w-4" />
                                                      Remove
                                                  </button>
                                              </div>
                                          </div>
                                      );
                                  })}
                        </div>
                    )}
                    {!loading && favorites.length === 0 ? (
                        <div className="mt-4 rounded-lg border border-dashed border-sidebar-border/60 p-6 text-sm text-muted-foreground dark:border-sidebar-border">
                            No favorites yet.
                        </div>
                    ) : null}
                </div>
            </div>
            <Dialog open={Boolean(imageModal)} onOpenChange={(open) => (!open ? setImageModal(null) : null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{imageModal?.name ?? 'Product image'}</DialogTitle>
                        <DialogDescription>
                            {imageModal?.caption ?? 'Preview image'}
                        </DialogDescription>
                    </DialogHeader>
                    {imageModal?.url ? (
                        <div className="overflow-hidden rounded-lg border border-sidebar-border/70">
                            <img
                                src={imageModal.url}
                                alt={imageModal.name}
                                className="h-full w-full object-contain"
                            />
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
            <Sheet open={Boolean(descriptionSheet)} onOpenChange={(open) => (!open ? setDescriptionSheet(null) : null)}>
                <SheetContent side="right" className="flex h-full w-full max-w-lg flex-col">
                    <SheetHeader>
                        <SheetTitle>{descriptionSheet?.name ?? 'Description'}</SheetTitle>
                        <SheetDescription>Full product details</SheetDescription>
                    </SheetHeader>
                    <div
                        className="mt-4 flex-1 overflow-y-auto p-4 text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{
                            __html:
                                descriptionSheet?.description ??
                                '<p>No description provided.</p>',
                        }}
                    />
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
