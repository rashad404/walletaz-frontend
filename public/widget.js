/**
 * Kimlik.az Login Widget
 * Embeddable login button for partner sites
 *
 * Usage:
 * <script src="https://kimlik.az/widget.js" data-client-id="YOUR_CLIENT_ID" data-redirect-uri="YOUR_CALLBACK_URL"></script>
 * <div id="kimlik-login"></div>
 *
 * Or programmatically:
 * KimlikWidget.init({
 *   clientId: 'YOUR_CLIENT_ID',
 *   redirectUri: 'YOUR_CALLBACK_URL',
 *   containerId: 'kimlik-login',
 *   scopes: ['profile:read', 'profile:email'],
 *   theme: 'light', // 'light' | 'dark' | 'auto'
 *   size: 'medium', // 'small' | 'medium' | 'large'
 *   locale: 'az', // 'az' | 'en' | 'ru'
 * });
 */

(function (window, document) {
  'use strict';

  const KIMLIK_BASE_URL = 'https://kimlik.az';
  const KIMLIK_API_URL = KIMLIK_BASE_URL + '/api';

  // Default configuration
  const defaultConfig = {
    containerId: 'kimlik-login',
    scopes: ['profile:read'],
    theme: 'auto',
    size: 'medium',
    locale: 'az',
    popup: true,
    popupWidth: 500,
    popupHeight: 600,
    buttonText: null, // Will be set based on locale
  };

  // Translations
  const translations = {
    az: {
      loginWith: 'Kimlik.az ilə daxil ol',
      continueWith: 'Kimlik.az ilə davam et',
      signingIn: 'Daxil olunur...',
    },
    en: {
      loginWith: 'Login with Kimlik.az',
      continueWith: 'Continue with Kimlik.az',
      signingIn: 'Signing in...',
    },
    ru: {
      loginWith: 'Войти через Kimlik.az',
      continueWith: 'Продолжить с Kimlik.az',
      signingIn: 'Входим...',
    },
  };

  // Button styles
  const styles = {
    small: {
      padding: '8px 16px',
      fontSize: '14px',
      iconSize: '18px',
      borderRadius: '6px',
    },
    medium: {
      padding: '12px 24px',
      fontSize: '16px',
      iconSize: '22px',
      borderRadius: '8px',
    },
    large: {
      padding: '16px 32px',
      fontSize: '18px',
      iconSize: '26px',
      borderRadius: '10px',
    },
  };

  // PKCE helpers
  function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    return result;
  }

  async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  }

  function base64UrlEncode(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function generatePKCE() {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(hashed);
    return { codeVerifier, codeChallenge };
  }

  // Detect user's preferred theme
  function getPreferredTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Widget class
  class KimlikWidgetClass {
    constructor() {
      this.config = null;
      this.button = null;
      this.popup = null;
      this.codeVerifier = null;
      this.state = null;
    }

    init(userConfig) {
      // Get config from script tag data attributes if not provided
      const scriptTag = document.querySelector('script[src*="widget.js"]');
      const dataConfig = {};

      if (scriptTag) {
        if (scriptTag.dataset.clientId) dataConfig.clientId = scriptTag.dataset.clientId;
        if (scriptTag.dataset.redirectUri) dataConfig.redirectUri = scriptTag.dataset.redirectUri;
        if (scriptTag.dataset.scopes) dataConfig.scopes = scriptTag.dataset.scopes.split(',');
        if (scriptTag.dataset.theme) dataConfig.theme = scriptTag.dataset.theme;
        if (scriptTag.dataset.size) dataConfig.size = scriptTag.dataset.size;
        if (scriptTag.dataset.locale) dataConfig.locale = scriptTag.dataset.locale;
        if (scriptTag.dataset.containerId) dataConfig.containerId = scriptTag.dataset.containerId;
      }

      this.config = { ...defaultConfig, ...dataConfig, ...userConfig };

      // Validate required fields
      if (!this.config.clientId) {
        console.error('[Kimlik Widget] clientId is required');
        return;
      }

      if (!this.config.redirectUri) {
        console.error('[Kimlik Widget] redirectUri is required');
        return;
      }

      // Resolve theme
      if (this.config.theme === 'auto') {
        this.config.theme = getPreferredTheme();
      }

      // Set button text based on locale
      if (!this.config.buttonText) {
        const t = translations[this.config.locale] || translations.az;
        this.config.buttonText = t.loginWith;
      }

      this.render();
      this.setupMessageListener();
    }

    render() {
      const container = document.getElementById(this.config.containerId);
      if (!container) {
        console.error(`[Kimlik Widget] Container #${this.config.containerId} not found`);
        return;
      }

      // Create button
      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.id = 'kimlik-login-button';

      // Apply styles
      const sizeStyles = styles[this.config.size] || styles.medium;
      const isDark = this.config.theme === 'dark';

      this.button.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: ${sizeStyles.padding};
        font-size: ${sizeStyles.fontSize};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 600;
        border: none;
        border-radius: ${sizeStyles.borderRadius};
        cursor: pointer;
        transition: all 0.2s ease;
        background: ${isDark ? 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' : 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'};
        color: white;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
      `;

      // Add hover effect
      this.button.onmouseover = () => {
        this.button.style.transform = 'translateY(-2px)';
        this.button.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
      };
      this.button.onmouseout = () => {
        this.button.style.transform = 'translateY(0)';
        this.button.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.3)';
      };

      // Create icon
      const icon = document.createElement('span');
      icon.innerHTML = `
        <svg width="${sizeStyles.iconSize}" height="${sizeStyles.iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';

      // Create text
      const text = document.createElement('span');
      text.textContent = this.config.buttonText;

      this.button.appendChild(icon);
      this.button.appendChild(text);

      // Add click handler
      this.button.onclick = () => this.startLogin();

      container.appendChild(this.button);
    }

    async startLogin() {
      // Disable button
      this.setLoading(true);

      try {
        // Generate PKCE
        const pkce = await generatePKCE();
        this.codeVerifier = pkce.codeVerifier;
        this.state = generateRandomString(32);

        // Store for callback
        sessionStorage.setItem('kimlik_code_verifier', this.codeVerifier);
        sessionStorage.setItem('kimlik_state', this.state);

        // Build auth URL
        const params = new URLSearchParams({
          client_id: this.config.clientId,
          redirect_uri: this.config.redirectUri,
          response_type: 'code',
          scope: this.config.scopes.join(' '),
          state: this.state,
          code_challenge: pkce.codeChallenge,
          code_challenge_method: 'S256',
        });

        const authUrl = `${KIMLIK_API_URL}/oauth/authorize?${params.toString()}`;

        if (this.config.popup) {
          this.openPopup(authUrl);
        } else {
          window.location.href = authUrl;
        }
      } catch (error) {
        console.error('[Kimlik Widget] Error starting login:', error);
        this.setLoading(false);
      }
    }

    openPopup(url) {
      const width = this.config.popupWidth;
      const height = this.config.popupHeight;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      this.popup = window.open(
        url,
        'kimlik_login',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no`
      );

      if (!this.popup) {
        alert('Please allow popups for this site to use Kimlik.az login');
        this.setLoading(false);
        return;
      }

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (this.popup && this.popup.closed) {
          clearInterval(checkClosed);
          this.setLoading(false);
        }
      }, 500);
    }

    setupMessageListener() {
      window.addEventListener('message', (event) => {
        // Only accept messages from Kimlik.az
        if (!event.origin.includes('kimlik.az') && !event.origin.includes('localhost')) {
          return;
        }

        const data = event.data;

        if (data.type === 'kimlik_callback') {
          if (this.popup) {
            this.popup.close();
          }
          this.setLoading(false);

          if (data.error) {
            console.error('[Kimlik Widget] Auth error:', data.error);
            this.dispatchEvent('error', { error: data.error, description: data.error_description });
          } else {
            this.dispatchEvent('success', { code: data.code, state: data.state });
          }
        }
      });
    }

    setLoading(loading) {
      if (!this.button) return;

      const t = translations[this.config.locale] || translations.az;

      if (loading) {
        this.button.disabled = true;
        this.button.style.opacity = '0.7';
        this.button.style.cursor = 'not-allowed';
        this.button.querySelector('span:last-child').textContent = t.signingIn;
      } else {
        this.button.disabled = false;
        this.button.style.opacity = '1';
        this.button.style.cursor = 'pointer';
        this.button.querySelector('span:last-child').textContent = this.config.buttonText;
      }
    }

    dispatchEvent(type, detail) {
      const event = new CustomEvent(`kimlik:${type}`, { detail });
      window.dispatchEvent(event);

      // Also dispatch on container
      const container = document.getElementById(this.config.containerId);
      if (container) {
        container.dispatchEvent(event);
      }
    }

    // Static helper to handle callback
    static async handleCallback(code, codeVerifier, config) {
      if (!codeVerifier) {
        codeVerifier = sessionStorage.getItem('kimlik_code_verifier');
        sessionStorage.removeItem('kimlik_code_verifier');
        sessionStorage.removeItem('kimlik_state');
      }

      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      const response = await fetch(`${KIMLIK_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: config.clientId,
          code: code,
          redirect_uri: config.redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Token exchange failed');
      }

      return data;
    }

    // Static helper to get user info
    static async getUser(accessToken) {
      const response = await fetch(`${KIMLIK_API_URL}/oauth/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error_description || data.error || 'Failed to get user');
      }

      return data.data || data;
    }
  }

  // Create singleton instance
  const KimlikWidget = new KimlikWidgetClass();

  // Expose static methods
  KimlikWidget.handleCallback = KimlikWidgetClass.handleCallback;
  KimlikWidget.getUser = KimlikWidgetClass.getUser;

  // Auto-initialize if script has data attributes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const scriptTag = document.querySelector('script[src*="widget.js"][data-client-id]');
      if (scriptTag) {
        KimlikWidget.init({});
      }
    });
  } else {
    const scriptTag = document.querySelector('script[src*="widget.js"][data-client-id]');
    if (scriptTag) {
      KimlikWidget.init({});
    }
  }

  // Expose globally
  window.KimlikWidget = KimlikWidget;
})(window, document);
