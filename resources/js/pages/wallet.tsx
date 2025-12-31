import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type WalletTransaction = {
    id: number;
    type: string;
    amount: number;
    balance_after: number;
    description?: string | null;
    created_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Wallet',
        href: '/wallet',
    },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function WalletPage() {
    const [balance, setBalance] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        axios
            .get('/api/wallet', { signal: controller.signal })
            .then((response) => {
                setBalance(response.data.balance ?? 0);
                setTransactions(response.data.transactions ?? []);
                setLoading(false);
            })
            .catch((walletError) => {
                if (axios.isCancel(walletError)) return;
                console.error('Error fetching wallet:', walletError);
                setError('Unable to load wallet right now.');
                setLoading(false);
            });

        return () => controller.abort();
    }, []);

    const formatCurrency = (value: number) => currencyFormatter.format(value);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wallet" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                    <h1 className="text-lg font-semibold">Cashback wallet</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track your cashback earnings and usage.
                    </p>
                    <div className="mt-4 rounded-lg border border-sidebar-border/60 bg-muted/30 p-4 text-sm dark:border-sidebar-border">
                        <div className="text-xs uppercase text-muted-foreground">Current balance</div>
                        <div className="mt-1 text-2xl font-semibold">
                            {balance !== null ? formatCurrency(balance) : '—'}
                        </div>
                    </div>
                    {error ? (
                        <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
                    ) : (
                        <div className="mt-4">
                            <h2 className="text-sm font-semibold">Recent activity</h2>
                            <div className="mt-3 space-y-3">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <div
                                            key={`wallet-skeleton-${index}`}
                                            className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                        >
                                            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                                            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-muted" />
                                        </div>
                                    ))
                                ) : transactions.length ? (
                                    transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sidebar-border/70 p-4 text-sm dark:border-sidebar-border"
                                        >
                                            <div>
                                                <p className="font-semibold capitalize">{transaction.type}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {transaction.description ?? 'Wallet update'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(transaction.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className={`text-sm font-semibold ${
                                                        transaction.type === 'debit'
                                                            ? 'text-red-600 dark:text-red-300'
                                                            : 'text-emerald-600 dark:text-emerald-300'
                                                    }`}
                                                >
                                                    {transaction.type === 'debit' ? '-' : '+'}
                                                    {formatCurrency(transaction.amount)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Balance: {formatCurrency(transaction.balance_after)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-lg border border-dashed border-sidebar-border/60 p-6 text-sm text-muted-foreground dark:border-sidebar-border">
                                        No wallet transactions yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
