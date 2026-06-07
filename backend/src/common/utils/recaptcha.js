async function verifyRecaptcha(token, secret) {
  if (!secret) return true;
  if (!token) return false;

  const params = new URLSearchParams({
    secret,
    response: token,
  });

  const res = await fetch(`https://www.google.com/recaptcha/api/siteverify?${params}`, {
    method: 'POST',
  });

  const data = await res.json();
  return data.success && (data.score === undefined || data.score >= 0.5);
}

module.exports = { verifyRecaptcha };
