<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($user === null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $favorites = Favorite::query()
            ->where('user_id', $user->id)
            ->with([
                'product' => function ($query) {
                    $query->select([
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
                    ])->with(['category:id,name', 'images:id,product_id,path,caption']);
                },
            ])
            ->latest()
            ->get();

        return response()->json([
            'favorites' => $favorites->map(function (Favorite $favorite) {
                $product = $favorite->product;
                if ($product === null) {
                    return null;
                }

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
                    'promo_expires_at' => $product->promo_expires_at?->toISOString(),
                    'promo_active' => $product->promo_label !== null
                        && ($product->promo_expires_at === null || $product->promo_expires_at->isFuture()),
                    'final_price' => round($discountedPrice, 2),
                    'cashback_amount' => round($cashbackAmount, 2),
                    'images' => $product->relationLoaded('images')
                        ? $product->images->map(function ($image) {
                            return [
                                'id' => $image->id,
                                'caption' => $image->caption,
                                'url' => $this->formatImageUrl($image->path),
                            ];
                        })->values()
                        : [],
                ];
            })->filter()->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        Favorite::firstOrCreate([
            'user_id' => $user->id,
            'product_id' => $validated['product_id'],
        ]);

        return response()->json(['message' => 'Added to favorites.'], 201);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        Favorite::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->delete();

        return response()->json(['message' => 'Removed from favorites.']);
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
