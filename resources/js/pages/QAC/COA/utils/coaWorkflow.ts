import axios from 'axios';

type CoaSortable = {
    coa_no?: string;
    created_at?: string;
};

export const getCoaErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        return data?.message || error.message;
    }

    return error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
};

const getCoaSortKey = (coaNo?: string) => {
    const normalized = (coaNo || '').trim().toUpperCase();
    if (!normalized || normalized === '-') {
        return null;
    }

    const match = normalized.match(/^[A-Z]*\s*(\d+)\s*\/\s*(\d{4})$/);
    if (!match) {
        return null;
    }

    return {
        sequence: Number(match[1]),
        year: Number(match[2]),
    };
};

export const sortByCoaNumberDesc = <T extends CoaSortable>(items: T[]) =>
    [...items].sort((a, b) => {
        const aKey = getCoaSortKey(a.coa_no);
        const bKey = getCoaSortKey(b.coa_no);

        if (aKey && bKey) {
            if (bKey.year !== aKey.year) return bKey.year - aKey.year;
            if (bKey.sequence !== aKey.sequence) return bKey.sequence - aKey.sequence;
        } else if (aKey) {
            return -1;
        } else if (bKey) {
            return 1;
        }

        return (b.created_at || '').localeCompare(a.created_at || '');
    });

export const getSignaturePath = (identity?: string | number) => {
    const id = identity ? identity.toString().trim() : '';
    const base = typeof window !== 'undefined' ? window.location.origin : '';

    if (id === '1149' || id.includes('ประสิทธิ์ชัย')) return `${base}/images/signature/prasitchai.png`;
    if (id === '1143' || id.includes('ประภาพร')) return `${base}/images/signature/prapaporn.png`;
    if (id === '1177' || id.includes('ยุพา')) return `${base}/images/signature/yapha.png`;
    if (id === '1183' || id.includes('สุกัญญา')) return `${base}/images/signature/sukanya.png`;
    if (id === '1434' || id.includes('ธัญ')) return `${base}/images/signature/than.png`;
    if (id === '1476' || id.includes('วีระยุทธ')) return `${base}/images/signature/veerayut.png`;

    return `${base}/images/signature/sukanya.png`;
};
