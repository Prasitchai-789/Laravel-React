// ฟังก์ชันจัดรูปแบบวันที่
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        return '';
    }
};

// ฟังก์ชันจัดรูปแบบวันที่แบบไทย (ปี พ.ศ.)
export const formatDateThai = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        return '';
    }
};

// ฟังก์ชันจัดรูปแบบวันที่แบบเต็ม (ไทย)
export const formatDateThaiLong = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return '';
    }
};