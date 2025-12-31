<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $items = $request->validated('items');
        $paymentMethod = $request->validated('payment_method') ?? 'stripe';
        $productIds = collect($items)->pluck('product_id')->unique()->all();
        $products = Product::query()
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $lineItems = [];
        $stripeItems = [];
        $subtotal = 0.0;
        $discountTotal = 0.0;
        $cashbackTotal = 0.0;

        foreach ($items as $item) {
            $product = $products->get($item['product_id']);
            if ($product === null) {
                continue;
            }

            $quantity = (int) $item['quantity'];
            $price = (float) $product->price;
            $discountPercent = (float) $product->discount_percent;
            $cashbackPercent = (float) $product->cashback_percent;

            $lineSubtotal = $price * $quantity;
            $lineDiscount = $lineSubtotal * $discountPercent / 100;
            $lineTotal = max(0, $lineSubtotal - $lineDiscount);
            $lineCashback = $lineTotal * $cashbackPercent / 100;
            $unitAmount = (int) round(($lineTotal / max(1, $quantity)) * 100);

            $subtotal += $lineSubtotal;
            $discountTotal += $lineDiscount;
            $cashbackTotal += $lineCashback;

            $lineItems[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'quantity' => $quantity,
                'unit_price' => round($price, 2),
                'line_total' => round($lineTotal, 2),
                'discount_amount' => round($lineDiscount, 2),
                'cashback_amount' => round($lineCashback, 2),
            ];

            $stripeItems[] = [
                'price_data' => [
                    'currency' => config('cashier.currency', 'usd'),
                    'product_data' => [
                        'name' => $product->name,
                    ],
                    'unit_amount' => max(0, $unitAmount),
                ],
                'quantity' => $quantity,
            ];
        }

        if (count($lineItems) === 0) {
            return response()->json([
                'message' => 'No valid items found for checkout.',
            ], 422);
        }

        $amountDue = max(0, $subtotal - $discountTotal);
        $paymentReference = (string) Str::uuid();

        if ($paymentMethod === 'wallet') {
            if ((float) $user->wallet_balance < $amountDue) {
                return response()->json([
                    'message' => 'Insufficient cashback balance.',
                ], 422);
            }
        }

        $purchase = DB::transaction(function () use (
            $request,
            $paymentReference,
            $subtotal,
            $discountTotal,
            $amountDue,
            $cashbackTotal,
            $lineItems,
            $paymentMethod,
            $user
        ) {
            $purchase = Purchase::create([
                'user_id' => $request->user()?->id,
                'payment_reference' => $paymentReference,
                'currency' => strtoupper(config('cashier.currency', 'usd')),
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'amount_due' => $amountDue,
                'cashback_total' => $cashbackTotal,
                'status' => $paymentMethod === 'wallet' ? 'completed' : 'pending',
                'purchased_at' => $paymentMethod === 'wallet' ? now() : null,
            ]);

            $purchase->items()->createMany($lineItems);

            if ($paymentMethod === 'wallet') {
                $updatedUser = $user->fresh();
                $balanceAfterDebit = max(0, (float) $updatedUser->wallet_balance - $amountDue);
                $updatedUser->wallet_balance = $balanceAfterDebit;
                $updatedUser->save();

                WalletTransaction::create([
                    'user_id' => $updatedUser->id,
                    'purchase_id' => $purchase->id,
                    'type' => 'debit',
                    'amount' => $amountDue,
                    'balance_after' => $balanceAfterDebit,
                    'description' => 'Wallet payment for purchase.',
                ]);

                if ($cashbackTotal > 0) {
                    $balanceAfterCredit = $balanceAfterDebit + $cashbackTotal;
                    $updatedUser->wallet_balance = $balanceAfterCredit;
                    $updatedUser->save();

                    WalletTransaction::create([
                        'user_id' => $updatedUser->id,
                        'purchase_id' => $purchase->id,
                        'type' => 'cashback',
                        'amount' => $cashbackTotal,
                        'balance_after' => $balanceAfterCredit,
                        'description' => 'Cashback credited.',
                    ]);
                }
            }

            return $purchase;
        });

        if ($paymentMethod === 'wallet') {
            return response()->json([
                'payment_reference' => $paymentReference,
                'purchase_id' => $purchase->id,
                'currency' => $purchase->currency,
                'subtotal' => round($subtotal, 2),
                'discount_total' => round($discountTotal, 2),
                'amount_due' => round($amountDue, 2),
                'cashback_total' => round($cashbackTotal, 2),
                'items' => $lineItems,
                'wallet_balance' => (float) $user->fresh()->wallet_balance,
                'message' => 'Payment completed using cashback wallet.',
            ]);
        }

        $checkout = $user->checkout($stripeItems, [
            'success_url' => route('checkout.success', [], true) . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('checkout.cancel', [], true),
            'client_reference_id' => (string) $purchase->id,
            'metadata' => [
                'purchase_id' => (string) $purchase->id,
            ],
        ]);

        return response()->json([
            'payment_reference' => $paymentReference,
            'purchase_id' => $purchase->id,
            'currency' => $purchase->currency,
            'subtotal' => round($subtotal, 2),
            'discount_total' => round($discountTotal, 2),
            'amount_due' => round($amountDue, 2),
            'cashback_total' => round($cashbackTotal, 2),
            'items' => $lineItems,
            'checkout_url' => $checkout->url,
            'message' => 'Stripe checkout session created.',
        ]);
    }
}
