// Marketing mockup uchun brauzer ramkasi (browser chrome)
export default function MockFrame({ url = 'pos.maxpos.uz', children, className = '' }) {
  return (
    <div
      className={`rounded-xl overflow-hidden border border-gray-200 bg-white shadow-[0_40px_80px_-45px_rgba(15,23,42,0.5)] ${className}`}
    >
      <div className="flex items-center gap-1.5 h-9 px-3 bg-gray-50 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
        <div className="ml-2 h-5 flex-1 max-w-[220px] rounded bg-white border border-gray-200 flex items-center px-2 text-[10px] text-gray-400 font-medium">
          {url}
        </div>
      </div>
      {children}
    </div>
  );
}
