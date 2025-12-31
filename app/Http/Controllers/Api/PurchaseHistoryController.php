<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PurchaseHistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($request->user() === null) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'status' => ['sometimes', 'string', 'max:40'],
            'reference' => ['sometimes', 'string', 'max:120'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
            'min_total' => ['sometimes', 'numeric', 'min:0'],
            'max_total' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $perPage = $validated['per_page'] ?? 10;
        $userId = $request->user()?->id;

        $query = $this->applyFilters(
            Purchase::query()
                ->withCount('items')
                ->with(['items:id,purchase_id,product_id,name,quantity,unit_price,line_total,discount_amount,cashback_amount']),
            $validated
        )->when($userId, fn ($builder) => $builder->where('user_id', $userId));

        return response()->json([
            'purchases' => $query
                ->orderByDesc('purchased_at')
                ->paginate($perPage),
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        if ($request->user() === null) {
            abort(401);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'max:40'],
            'reference' => ['sometimes', 'string', 'max:120'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
            'min_total' => ['sometimes', 'numeric', 'min:0'],
            'max_total' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $userId = $request->user()?->id;
        $query = $this->applyFilters(Purchase::query()->with('items'), $validated)
            ->when($userId, fn ($builder) => $builder->where('user_id', $userId))
            ->orderByDesc('purchased_at');

        $filename = 'purchase-history-' . now()->format('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'purchase_id',
                'payment_reference',
                'status',
                'currency',
                'purchased_at',
                'subtotal',
                'discount_total',
                'amount_due',
                'cashback_total',
                'item_count',
            ]);

            $query->chunk(200, function ($purchases) use ($handle) {
                foreach ($purchases as $purchase) {
                    fputcsv($handle, [
                        $purchase->id,
                        $purchase->payment_reference,
                        $purchase->status,
                        $purchase->currency,
                        optional($purchase->purchased_at)->toDateTimeString(),
                        $purchase->subtotal,
                        $purchase->discount_total,
                        $purchase->amount_due,
                        $purchase->cashback_total,
                        $purchase->items->count(),
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function exportPrint(Request $request)
    {
        if ($request->user() === null) {
            abort(401);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'max:40'],
            'reference' => ['sometimes', 'string', 'max:120'],
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
            'min_total' => ['sometimes', 'numeric', 'min:0'],
            'max_total' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $userId = $request->user()?->id;
        $purchases = $this->applyFilters(
            Purchase::query()->with('items'),
            $validated
        )
            ->when($userId, fn ($builder) => $builder->where('user_id', $userId))
            ->orderByDesc('purchased_at')
            ->limit(200)
            ->get();

        return response()->view('purchases.print', [
            'purchases' => $purchases,
            'filters' => $validated,
        ]);
    }

    /**
     * @param array<string, mixed> $filters
     */
    private function applyFilters($query, array $filters)
    {
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['reference'])) {
            $query->where('payment_reference', 'like', '%' . $filters['reference'] . '%');
        }

        if (!empty($filters['from'])) {
            $query->whereDate('purchased_at', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $query->whereDate('purchased_at', '<=', $filters['to']);
        }

        if (isset($filters['min_total'])) {
            $query->where('amount_due', '>=', $filters['min_total']);
        }

        if (isset($filters['max_total'])) {
            $query->where('amount_due', '<=', $filters['max_total']);
        }

        return $query;
    }
}
