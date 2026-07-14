export function getErrorMessage(err, fallback = 'Xatolik yuz berdi') {
  const data = err?.response?.data;
  if (typeof data?.error === 'string') return data.error;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data === 'string') return data;
  if (typeof err?.message === 'string') return err.message;
  return fallback;
}
