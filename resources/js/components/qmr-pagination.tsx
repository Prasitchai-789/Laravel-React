import { Link } from '@inertiajs/react';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginationProps = {
    links?: PaginationLink[];
};

function formatLabel(label: string) {
    return label.replace('&laquo;', '‹').replace('&raquo;', '›');
}

export function QmrPagination({ links = [] }: PaginationProps) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-center gap-1.5">
            {links.map((link, index) => {
                const label = formatLabel(link.label);
                const className = `inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-xs font-black transition-all ${
                    link.active
                        ? 'border-blue-500 bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : link.url
                          ? 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                          : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                }`;

                if (!link.url) {
                    return (
                        <span key={`${label}-${index}`} className={className}>
                            {label}
                        </span>
                    );
                }

                return (
                    <Link key={`${label}-${index}`} href={link.url} preserveScroll preserveState className={className}>
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
