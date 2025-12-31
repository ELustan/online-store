<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;

class CheckoutRedirectController extends Controller
{
    public function success(Request $request)
    {
        $sessionId = $request->query('session_id');
        if ($sessionId) {
            try {
                Stripe::setApiKey(config('cashier.secret'));
                $session = StripeSession::retrieve($sessionId);
                $purchaseId = $session->client_reference_id ?? $session->metadata->purchase_id ?? null;
                if ($purchaseId) {
                    $purchase = Purchase::where('id', $purchaseId)
                        ->where('status', 'pending')
                        ->first();

                    if ($purchase) {
                        $purchase->status = 'completed';
                        $purchase->purchased_at = now();
                        $purchase->save();

                        $user = $purchase->user;
                        if ($user && $purchase->cashback_total > 0) {
                            $balanceAfterCredit = (float) $user->wallet_balance + (float) $purchase->cashback_total;
                            $user->wallet_balance = $balanceAfterCredit;
                            $user->save();

                            WalletTransaction::create([
                                'user_id' => $user->id,
                                'purchase_id' => $purchase->id,
                                'type' => 'cashback',
                                'amount' => $purchase->cashback_total,
                                'balance_after' => $balanceAfterCredit,
                                'description' => 'Cashback credited.',
                            ]);
                        }
                    }
                }
            } catch (\Throwable $exception) {
                // Keep the success page even if Stripe lookup fails.
            }
        }

        return view('checkout.success');
    }

    public function cancel()
    {
        return view('checkout.cancel');
    }
}
