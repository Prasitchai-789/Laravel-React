// import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            {/* <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div> */}
            <img src="./images/isp-touch-icon.png" alt="" className='h-12 w-12' />
            <div className="ml-1 grid flex-1 text-left text-sm mt-3">
                <span className="mb-0.5 truncate leading-tight font-semibold text-yellow-600 text-2xl">ISANPALM</span>
            </div>

        </>
    );
}
