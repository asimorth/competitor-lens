'use client';

export function StablexLogoHome() {
  return (
    <div className="flex items-center space-x-2">
      <div className="text-right">
        <p className="text-xs text-gray-500">Powered by</p>
        <p className="text-sm font-semibold text-gray-900">Stablex</p>
      </div>
      <img 
        src="/stablex-logo.png" 
        alt="Stablex" 
        className="h-10 w-auto"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

export function StablexFooterLogo() {
  return (
    <img 
      src="/stablex-logo.png" 
      alt="Stablex" 
      className="h-8 w-auto"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
