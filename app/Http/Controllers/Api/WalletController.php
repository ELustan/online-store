<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'balance' => (float) $user->wallet_balance,
            'transactions' => $user->walletTransactions()
                ->latest()
                ->limit(10)
                ->get([
                    'id',
                    'type',
                    'amount',
                    'balance_after',
                    'description',
                    'created_at',
                ]),
        ]);
    }
}
