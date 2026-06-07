const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export function isRecaptchaEnabled() {
  return Boolean(SITE_KEY);
}

export async function getRecaptchaToken(action = 'signup') {
  if (!SITE_KEY || typeof window === 'undefined') return null;

  return new Promise((resolve, reject) => {
    const run = () => {
      if (!window.grecaptcha?.execute) {
        reject(new Error('reCAPTCHA not loaded'));
        return;
      }
      window.grecaptcha
        .execute(SITE_KEY, { action })
        .then(resolve)
        .catch(reject);
    };

    if (window.grecaptcha?.execute) {
      run();
    } else {
      const existing = document.querySelector('script[src*="recaptcha"]');
      if (existing) {
        existing.addEventListener('load', run);
      } else {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
        script.async = true;
        script.onload = run;
        script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
        document.head.appendChild(script);
      }
    }
  });
}
