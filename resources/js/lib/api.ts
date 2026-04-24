import axios from 'axios';
import Swal from 'sweetalert2';

/**
 * Configure global axios instance
 */
const api = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    withCredentials: true, // For Sanctum / session cookies
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        // CSRF Token is typically managed by Laravel automatically via cookies, 
        // but we can ensure it's attached if needed from the meta tag
        const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
        if (csrfToken && config.headers) {
            config.headers['X-CSRF-TOKEN'] = csrfToken.getAttribute('content');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            
            // Extract error message from response if available
            const message = data?.message || 'เกิดข้อผิดพลาดบางอย่าง';

            if (status === 401) {
                // Unauthorized
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
                
                // Redirect to login if needed
                window.location.href = '/login';
            } else if (status === 403) {
                // Forbidden
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
            } else if (status === 419) {
                // CSRF Token Mismatch
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'warning',
                    title: 'ข้อมูลเซสชั่นหมดอายุ กรุณารีเฟรชหน้าเว็บ',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
            } else if (status >= 500) {
                // Server Error
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
                    text: message !== 'เกิดข้อผิดพลาดบางอย่าง' ? message : undefined,
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true,
                });
            }
            // Note: 422 (Validation Error) is usually handled by the specific form component,
            // so we skip global toast for it to avoid double alerts.
        } else {
            // Network Error or Server Unreachable
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        }

        return Promise.reject(error);
    }
);

export default api;
