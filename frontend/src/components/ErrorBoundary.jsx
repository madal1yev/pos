import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Xatolik yuz berdi</h2>
            <p className="text-gray-500 mb-4">Ilova ishlashda xatolik yuz berdi. Qayta urinib ko'ring.</p>
            <p className="text-xs text-gray-400 mb-6 break-all">{this.state.error?.message}</p>
            <button
              onClick={() => {
                localStorage.removeItem('pos_token');
                localStorage.removeItem('pos_user');
                window.location.href = '/login';
              }}
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-all"
            >
              Qayta kirish
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
