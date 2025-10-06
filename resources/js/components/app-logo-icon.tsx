import { SVGAttributes } from 'react';

interface AppLogoIconProps extends SVGAttributes<SVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'login';
  variant?: 'default' | 'minimal' | 'badge' | 'modern' | 'login';
  showText?: boolean;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function AppLogoIcon({
  size = 'md',
  variant = 'default',
  showText = true,
  className = '',
  orientation = 'horizontal',
  ...props
}: AppLogoIconProps) {

  const sizeConfig = {
    sm: { logo: 'w-6 h-6', text: 'text-sm', gap: 'gap-2' },
    md: { logo: 'w-8 h-8', text: 'text-base', gap: 'gap-3' },
    lg: { logo: 'w-12 h-12', text: 'text-xl', gap: 'gap-4' },
    xl: { logo: 'w-16 h-16', text: 'text-2xl', gap: 'gap-4' },
    login: { logo: 'w-24 h-24', text: 'text-3xl', gap: 'gap-6' }
  };

  const variantStyles = {
    default: {
      container: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg',
      text: 'text-gray-800 font-bold'
    },
    minimal: {
      container: 'bg-amber-100 border-2 border-amber-300',
      text: 'text-amber-700 font-semibold'
    },
    badge: {
      container: 'bg-white border-2 border-amber-400 shadow-md',
      text: 'bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#CA8A04] bg-clip-text font-extrabold tracking-wide text-transparent'
    },
    modern: {
      container: '',
      text: 'text-white font-bold'
    },
    login: {
      container: 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl',
      text: 'text-gray-800 font-bold'
    }
  };

  const { logo: logoSize, text: textSize, gap } = sizeConfig[size];
  const { container: containerStyle, text: textStyle } = variantStyles[variant];

  // สำหรับหน้า Login - แนวตั้ง (โลโก้ใหญ่กับข้อความด้านล่าง)
  if (orientation === 'vertical' && (variant === 'login' || size === 'login')) {
    return (
      <div className={`flex flex-col items-center ${gap} ${className}`}>
        {/* Logo ขนาดใหญ่ */}
        <div className={`rounded-3xl flex items-center justify-center ${containerStyle} ${logoSize} shadow-2xl`}>
          <img
            src="/images/isp-touch-icon.png"
            alt="ISANPALM"
            className={`object-contain ${
              logoSize === 'w-6 h-6' ? 'w-4 h-4' :
              logoSize === 'w-8 h-8' ? 'w-6 h-6' :
              logoSize === 'w-12 h-12' ? 'w-8 h-8' :
              logoSize === 'w-16 h-16' ? 'w-12 h-12' :
              'w-20 h-20' // สำหรับ login size
            } ${variant === 'modern' ? 'filter brightness-0 invert' : ''}`}
          />
        </div>

        {/* Text จัดวางแนวตั้ง */}
        {showText && (
          <div className="flex flex-col items-center text-center">
            <span className={`${textStyle} ${textSize} font-bold tracking-wide`}>
              ISANPALM
            </span>
            <span className="text-sm text-white font-medium mt-1">
              Thailand
            </span>
          </div>
        )}
      </div>
    );
  }

  // Icon Only Mode
  if (!showText) {
    return (
      <div className={`inline-flex items-center justify-center rounded-2xl ${containerStyle} ${logoSize} ${className}`}>
        <img
          src="/images/isp-touch-icon.png"
          alt="ISANPALM"
          className={`${variant === 'modern' ? 'filter brightness-0 invert' : ''} object-contain ${
            logoSize === 'w-6 h-6' ? 'w-4 h-4' :
            logoSize === 'w-8 h-8' ? 'w-6 h-6' :
            logoSize === 'w-12 h-12' ? 'w-8 h-8' :
            logoSize === 'w-16 h-16' ? 'w-12 h-12' :
            'w-20 h-20'
          }`}
        />
      </div>
    );
  }

  // แนวนอน (default)
  return (
    <div className={`inline-flex items-center ${gap} ${className}`}>
      {/* Logo */}
      <div className={`rounded-2xl flex items-center justify-center ${containerStyle} ${logoSize}`}>
        <img
          src="/images/isp-touch-icon.png"
          alt="ISANPALM"
          className={`${variant === 'modern' ? 'filter brightness-0 invert' : ''} object-contain ${
            logoSize === 'w-6 h-6' ? 'w-4 h-4' :
            logoSize === 'w-8 h-8' ? 'w-6 h-6' :
            logoSize === 'w-12 h-12' ? 'w-8 h-8' :
            logoSize === 'w-16 h-16' ? 'w-12 h-12' :
            'w-20 h-20'
          }`}
        />
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className={`${textStyle} ${textSize} tracking-tight`}>
          ISANPALM
        </span>
        {size !== 'sm' && (
          <span className="text-xs text-white font-medium ">
            Thailand
          </span>
        )}
      </div>
    </div>
  );
}

// ตัวอย่างการใช้งานหน้า Login
export function LoginPageExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        {/* Logo สำหรับหน้า Login - แนวตั้ง */}
        <div className="flex flex-col items-center mb-8">
          <AppLogoIcon
            size="login"
            variant="login"
            orientation="vertical"
            className="mb-2"
          />
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Welcome Back</h1>
          <p className="text-gray-600 text-center mt-2">
            Sign in to your ISANPALM account
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center mb-4">
            <AppLogoIcon
              size="sm"
              variant="minimal"
              showText={false}
            />
          </div>
          <p className="text-xs text-gray-500">
            © 2024 ISANPALM Thailand. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// ตัวอย่างการใช้งานทั้งหมด
export function LogoShowcase() {
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">ISANPALM Logo System</h1>
        <p className="text-gray-600">Multiple variants for different use cases</p>
      </div>

      {/* Login Variant */}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Login Page Variant</h2>
        <div className="flex justify-center">
          <AppLogoIcon
            size="login"
            variant="login"
            orientation="vertical"
          />
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            พิเศษสำหรับหน้า Login - ขนาดใหญ่ จัดวางแนวตั้ง
          </p>
        </div>
      </div>

      {/* Main Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {/* Default */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AppLogoIcon size="lg" variant="default" className="justify-center" />
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-800">Default</h3>
            <p className="text-sm text-gray-600">สำหรับใช้งานทั่วไป</p>
          </div>
        </div>

        {/* Minimal */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AppLogoIcon size="lg" variant="minimal" className="justify-center" />
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-800">Minimal</h3>
            <p className="text-sm text-gray-600">แบบเรียบง่าย</p>
          </div>
        </div>

        {/* Badge */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AppLogoIcon size="lg" variant="badge" className="justify-center" />
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-800">Badge</h3>
            <p className="text-sm text-gray-600">แบบมีกรอบ</p>
          </div>
        </div>

        {/* Modern */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 text-center">
          <AppLogoIcon size="lg" variant="modern" className="justify-center" />
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-gray-800">Modern</h3>
            <p className="text-sm text-gray-600">แบบทันสมัย</p>
          </div>
        </div>
      </div>

      {/* Size Variants */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Size Variants</h2>
        <div className="flex items-center justify-around flex-wrap gap-8">
          <div className="text-center">
            <AppLogoIcon size="sm" />
            <p className="text-xs text-gray-600 mt-2">Small</p>
          </div>
          <div className="text-center">
            <AppLogoIcon size="md" />
            <p className="text-xs text-gray-600 mt-2">Medium</p>
          </div>
          <div className="text-center">
            <AppLogoIcon size="lg" />
            <p className="text-xs text-gray-600 mt-2">Large</p>
          </div>
          <div className="text-center">
            <AppLogoIcon size="xl" />
            <p className="text-xs text-gray-600 mt-2">X-Large</p>
          </div>
          <div className="text-center">
            <AppLogoIcon size="login" orientation="vertical" />
            <p className="text-xs text-gray-600 mt-2">Login</p>
          </div>
        </div>
      </div>
    </div>
  );
}
