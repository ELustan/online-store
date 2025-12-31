import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

type SupportTicket = {
    id: number;
    subject: string;
    message: string;
    priority: string;
    status: string;
    created_at: string;
};

type TicketResponse = {
    current_page: number;
    data: SupportTicket[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Support',
        href: '/support',
    },
];

export default function Support() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('normal');
    const [toast, setToast] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        axios
            .get('/api/support-tickets', {
                signal: controller.signal,
                params: {
                    status: statusFilter || undefined,
                    page: currentPage,
                    per_page: 10,
                },
            })
            .then((response) => {
                const payload: TicketResponse = response.data.tickets;
                setTickets(payload.data);
                setLastPage(payload.last_page);
                setLoading(false);
            })
            .catch((fetchError) => {
                if (axios.isCancel(fetchError)) return;
                console.error('Error fetching support tickets:', fetchError);
                setError('Unable to load support requests right now.');
                setLoading(false);
            });

        return () => controller.abort();
    }, [statusFilter, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const response = await axios.post('/api/support-tickets', {
                subject,
                message,
                priority,
            });
            setToast(response.data.message ?? 'Support request submitted.');
            setSubject('');
            setMessage('');
            setPriority('normal');
            setCurrentPage(1);
        } catch (submitError) {
            console.error('Support request failed:', submitError);
            setError('Unable to submit your request right now.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Support" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {toast ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        {toast}
                    </div>
                ) : null}
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <h1 className="text-lg font-semibold">Support requests</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track bugs and issues you have reported.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <select
                                className="rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-xs dark:border-sidebar-border"
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                            >
                                <option value="">All statuses</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                            <button
                                className="rounded-md border border-sidebar-border/70 px-3 py-1 text-xs dark:border-sidebar-border"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={loading || currentPage === 1}
                                type="button"
                            >
                                Prev
                            </button>
                            <span className="text-xs text-muted-foreground">
                                Page {currentPage} of {lastPage}
                            </span>
                            <button
                                className="rounded-md border border-sidebar-border/70 px-3 py-1 text-xs dark:border-sidebar-border"
                                onClick={() => setCurrentPage((page) => Math.min(lastPage, page + 1))}
                                disabled={loading || currentPage === lastPage}
                                type="button"
                            >
                                Next
                            </button>
                        </div>
                        {error ? (
                            <div className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, index) => (
                                        <div
                                            key={`ticket-skeleton-${index}`}
                                            className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                        >
                                            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                                            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
                                        </div>
                                    ))
                                ) : tickets.length ? (
                                    tickets.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="rounded-lg border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold">{ticket.subject}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(ticket.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="rounded-full border border-sidebar-border/70 px-2 py-0.5 dark:border-sidebar-border">
                                                        {ticket.priority}
                                                    </span>
                                                    <span className="rounded-full border border-sidebar-border/70 px-2 py-0.5 dark:border-sidebar-border">
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-sm text-muted-foreground">{ticket.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-lg border border-dashed border-sidebar-border/60 p-6 text-sm text-muted-foreground dark:border-sidebar-border">
                                        No support requests yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <h2 className="text-lg font-semibold">Submit a request</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tell us about bugs, billing issues, or product feedback.
                        </p>
                        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                            <input
                                className="w-full rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-sm dark:border-sidebar-border"
                                placeholder="Subject"
                                value={subject}
                                onChange={(event) => setSubject(event.target.value)}
                                required
                            />
                            <select
                                className="w-full rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-sm dark:border-sidebar-border"
                                value={priority}
                                onChange={(event) => setPriority(event.target.value)}
                            >
                                <option value="low">Low priority</option>
                                <option value="normal">Normal priority</option>
                                <option value="high">High priority</option>
                                <option value="urgent">Urgent priority</option>
                            </select>
                            <textarea
                                className="min-h-[140px] w-full rounded-md border border-sidebar-border/70 bg-background px-3 py-2 text-sm dark:border-sidebar-border"
                                placeholder="Describe the issue"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                required
                            />
                            <button
                                className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={submitting}
                                type="submit"
                            >
                                {submitting ? 'Submitting...' : 'Send request'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
