<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Successful</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                background: #f8fafc;
                color: #0f172a;
            }
            .container {
                max-width: 720px;
                margin: 0 auto;
                padding: 48px 24px;
            }
            .card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 32px;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            }
            .badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                border-radius: 999px;
                background: #ecfdf3;
                color: #047857;
                font-size: 12px;
                font-weight: 600;
            }
            h1 {
                margin: 16px 0 8px;
                font-size: 28px;
            }
            p {
                margin: 0 0 16px;
                color: #475569;
                line-height: 1.6;
            }
            .actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                margin-top: 24px;
            }
            .button {
                display: inline-block;
                padding: 10px 16px;
                border-radius: 8px;
                font-weight: 600;
                text-decoration: none;
            }
            .button.primary {
                background: #0f172a;
                color: #ffffff;
            }
            .button.secondary {
                border: 1px solid #cbd5f5;
                color: #0f172a;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <span class="badge">Payment successful</span>
                <h1>Thank you for your purchase!</h1>
                <p>Your payment was processed successfully. You can review your order details anytime.</p>
                <div class="actions">
                    <a class="button primary" href="{{ route('dashboard') }}">Back to store</a>
                    <a class="button secondary" href="{{ route('purchase-history') }}">View purchase history</a>
                </div>
            </div>
        </div>
    </body>
</html>
