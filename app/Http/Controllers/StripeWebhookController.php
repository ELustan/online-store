<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request)
    {
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');
        $secret = config('cashier.webhook.secret');

        if (! $secret) {
            return response()->json(['message' => 'Webhook secret not configured.'], 400);
        }

        try {
            $event = Webhook::constructEvent($payload, $signature, $secret);
        } catch (\Throwable $exception) {
            return response()->json(['message' => 'Invalid webhook signature.'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $purchaseId = $session->client_reference_id ?? ($session->metadata->purchase_id ?? null);

            if ($purchaseId) {
                DB::transaction(function () use ($purchaseId) {
                    $purchase = Purchase::where('id', $purchaseId)->lockForUpdate()->first();
                    if (! $purchase || $purchase->status !== 'pending') {
                        return;
                    }

                    $purchase->status = 'completed';
                    $purchase->purchased_at = now();
                    $purchase->save();

                    $user = $purchase->user;
                    if (! $user || $purchase->cashback_total <= 0) {
                        return;
                    }

                    $alreadyCredited = WalletTransaction::where('purchase_id', $purchase->id)
                        ->where('type', 'cashback')
                        ->exists();

                    if ($alreadyCredited) {
                        return;
                    }

                    $balanceAfterCredit = (float) $user->wallet_balance + (float) $purchase->cashback_total;
                    $user->wallet_balance = $balanceAfterCredit;
                    $user->save();

                    WalletTransaction::create([
                        'user_id' => $user->id,
                        'purchase_id' => $purchase->id,
                        'type' => 'cashback',
                        'amount' => $purchase->cashback_total,
                        'balance_after' => $balanceAfterCredit,
                        'description' => 'Cashback credited via Stripe webhook.',
                    ]);
                });
            }
        }

        return response()->json(['received' => true]);
    }
}
