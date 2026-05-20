// import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="ml-1 grid flex-1 text-left text-sm mt-3">
                {/* แบบที่ 1: Logo + Text */}
                <div className="flex items-center gap-2">
                    <img
                        src="/images/logo R.png"
                        alt="ISANPALM Logo"
                        className="w-5 h-6 object-contain"
                        onError={(e) => {
                            const image = e.currentTarget;
                            const fallback = image.nextElementSibling as HTMLElement | null;

                            image.style.display = 'none';
                            if (fallback) {
                                fallback.style.display = 'block';
                            }
                        }}
                    />
                    <div className="w-4 h-4 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm hidden">
                        IP
                    </div>
                    <span className="mb-0 truncate leading-tight font-semibold text-yellow-600 text-2xl">
                        ISANPALM
                    </span>
                </div>
            </div>

        </>
    );
}
