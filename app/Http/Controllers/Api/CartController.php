<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $items = $request->session()->get('cart_items', []);

        return response()->json([
            'items' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'max:50'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:25'],
        ]);

        $items = collect($validated['items'])
            ->mapWithKeys(function ($item) {
                return [(int) $item['product_id'] => (int) $item['quantity']];
            })
            ->all();

        $request->session()->put('cart_items', $items);

        return response()->json([
            'items' => $items,
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->session()->forget('cart_items');

        return response()->json([
            'items' => [],
        ]);
    }
}
