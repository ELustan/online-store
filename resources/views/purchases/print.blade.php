<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Purchase History</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin: 32px;
                color: #1f2933;
            }
            h1 {
                margin-bottom: 4px;
            }
            .meta {
                font-size: 12px;
                color: #4b5563;
                margin-bottom: 16px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            th,
            td {
                border: 1px solid #e5e7eb;
                padding: 8px;
                text-align: left;
                vertical-align: top;
            }
            th {
                background: #f3f4f6;
            }
            .items {
                margin-top: 8px;
                font-size: 11px;
                color: #6b7280;
            }
            @media print {
                body {
                    margin: 0;
                }
                .no-print {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <button class="no-print" onclick="window.print()" type="button">Print / Save as PDF</button>
        <h1>Purchase History</h1>
        <div class="meta">
            Generated {{ now()->toDateTimeString() }}
        </div>
        <table>
            <thead>
                <tr>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Purchased</th>
                    <th>Totals</th>
                    <th>Items</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($purchases as $purchase)
                    <tr>
                        <td>{{ $purchase->payment_reference }}</td>
                        <td>{{ $purchase->status }}</td>
                        <td>{{ optional($purchase->purchased_at)->toDateTimeString() }}</td>
                        <td>
                            Amount: {{ number_format($purchase->amount_due, 2) }} {{ $purchase->currency }}<br />
                            Discount: {{ number_format($purchase->discount_total, 2) }}<br />
                            Cashback: {{ number_format($purchase->cashback_total, 2) }}
                        </td>
                        <td>
                            @foreach ($purchase->items as $item)
                                <div class="items">
                                    {{ $item->name }} x{{ $item->quantity }}
                                    ({{ number_format($item->line_total, 2) }})
                                </div>
                            @endforeach
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5">No purchases found for the selected filters.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </body>
</html>
