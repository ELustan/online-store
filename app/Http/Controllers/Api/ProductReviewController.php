<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductReviewController extends Controller
{
    public function index(Product $product, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ]);

        $perPage = $validated['per_page'] ?? 10;

        $reviews = ProductReview::query()
            ->where('product_id', $product->id)
            ->with('user:id,name')
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'reviews' => $reviews->through(function (ProductReview $review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'reviewer' => $review->user?->name ?? 'Anonymous',
                    'created_at' => $review->created_at?->toISOString(),
                ];
            }),
        ]);
    }

    public function store(Product $product, Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $hasPurchased = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->where('purchases.user_id', $user->id)
            ->where('purchase_items.product_id', $product->id)
            ->whereIn('purchases.status', ['completed', 'paid'])
            ->exists();

        if (! $hasPurchased) {
            return response()->json([
                'message' => 'You can only review products you have purchased.',
            ], 403);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:500'],
        ]);

        $review = ProductReview::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        return response()->json([
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'reviewer' => $user->name,
                'created_at' => $review->created_at?->toISOString(),
            ],
            'message' => 'Review submitted.',
        ], 201);
    }
}
