function getApiBase() {
  if (typeof window !== 'undefined') return '';
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
  return url.replace('://localhost', '://127.0.0.1');
}

export async function fetchPublicForm(token) {
  const res = await fetch(`${getApiBase()}/api/public/form/${token}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Form not found');
  return data;
}

export async function submitPublicRequest(token, payload) {
  const res = await fetch(`${getApiBase()}/api/public/add-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Submission failed');
  return data;
}
