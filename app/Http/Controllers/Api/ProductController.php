<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'search' => ['sometimes', 'string', 'max:120'],
            'category' => ['sometimes', 'string', 'max:120'],
            'min_price' => ['sometimes', 'numeric', 'min:0'],
            'max_price' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $perPage = $validated['per_page'] ?? 10;

        return response()
            ->json([
                'products' => Product::query()
                    ->with([
                        'category:id,name',
                        'images:id,product_id,path,caption',
                        'reviews' => function ($query) {
                            $query->latest()
                                ->limit(2)
                                ->with('user:id,name');
                        },
                    ])
                    ->select([
                        'id',
                        'category_id',
                        'image',
                        'name',
                        'slug',
                        'description',
                        'price',
                        'discount_percent',
                        'cashback_percent',
                        'promo_label',
                        'promo_expires_at',
                    ])
                    ->withAvg('reviews', 'rating')
                    ->withCount('reviews')
                    ->when($validated['search'] ?? null, function ($query, $search) {
                        $query->where(function ($inner) use ($search) {
                            $inner->where('name', 'like', '%' . $search . '%')
                                ->orWhere('slug', 'like', '%' . $search . '%')
                                ->orWhere('description', 'like', '%' . $search . '%');
                        });
                    })
                    ->when($validated['category'] ?? null, function ($query, $category) {
                        $query->whereHas('category', function ($categoryQuery) use ($category) {
                            $categoryQuery->where('name', $category);
                        });
                    })
                    ->when($validated['min_price'] ?? null, function ($query, $minPrice) {
                        $query->where('price', '>=', $minPrice);
                    })
                    ->when($validated['max_price'] ?? null, function ($query, $maxPrice) {
                        $query->where('price', '<=', $maxPrice);
                    })
                    ->orderByDesc('id')
                    ->paginate($perPage)
                    ->through(fn (Product $product) => $this->transformProduct($product)),
            ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());
        $product->load('category:id,name');

        return response()->json([
            'product' => $this->transformProduct($product),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load([
            'category:id,name',
            'images:id,product_id,path,caption',
            'reviews' => function ($query) {
                $query->latest()
                    ->limit(10)
                    ->with('user:id,name');
            },
        ]);
        $product->loadAvg('reviews', 'rating');
        $product->loadCount('reviews');

        return response()->json([
            'product' => $this->transformProduct($product),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $product->fill($request->validated());
        $product->save();
        $product->load('category:id,name');

        return response()->json([
            'product' => $this->transformProduct($product),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => 'Product deleted.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformProduct(Product $product): array
    {
        $price = (float) $product->price;
        $discountPercent = (float) $product->discount_percent;
        $cashbackPercent = (float) $product->cashback_percent;
        $discountedPrice = max(0, $price - ($price * $discountPercent / 100));
        $cashbackAmount = $discountedPrice * $cashbackPercent / 100;

        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'category' => $product->category?->name,
            'image' => $this->formatImageUrl($product->image),
            'description' => $product->description,
            'price' => $price,
            'discount_percent' => $discountPercent,
            'cashback_percent' => $cashbackPercent,
            'promo_label' => $product->promo_label,
            'promo_expires_at' => $this->formatDate($product->promo_expires_at),
            'promo_active' => $this->promoActive($product),
            'final_price' => round($discountedPrice, 2),
            'cashback_amount' => round($cashbackAmount, 2),
            'rating_average' => $product->reviews_avg_rating !== null
                ? round((float) $product->reviews_avg_rating, 1)
                : null,
            'reviews_count' => $product->reviews_count ?? 0,
            'images' => $product->relationLoaded('images')
                ? $product->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'caption' => $image->caption,
                        'url' => $this->formatImageUrl($image->path),
                    ];
                })->values()
                : [],
            'reviews' => $product->relationLoaded('reviews')
                ? $product->reviews->map(function ($review) {
                    return [
                        'id' => $review->id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'reviewer' => $review->user?->name ?? 'Anonymous',
                        'created_at' => $review->created_at?->toISOString(),
                    ];
                })->values()
                : [],
        ];
    }

    private function promoActive(Product $product): bool
    {
        if ($product->promo_label === null) {
            return false;
        }

        if ($product->promo_expires_at === null) {
            return true;
        }

        return $product->promo_expires_at->isFuture();
    }

    private function formatDate(?CarbonInterface $date): ?string
    {
        return $date?->toISOString();
    }

    private function formatImageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '/storage/'])) {
            return $path;
        }

        return Storage::url($path);
    }
}
