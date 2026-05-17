(function () {
  const CONSENT_STORAGE_KEY = 'agrupCookieConsent';
  const CONSENT_VERSION = '1.0';
  const GOOGLE_ANALYTICS_ID = 'G-677GY84PM7'; // Hier die echte Google Analytics Measurement-ID eintragen
  const GOOGLE_ADS_CONVERSION_ID = 'AW-XXXXXXXXXX'; // Hier später Google Ads Conversion-ID eintragen
  const GOOGLE_ADS_CONVERSION_LABEL = 'CONVERSION_LABEL_XXXXXXXXXX'; // Hier später Conversion Label eintragen

  let googleAnalyticsLoaded = false;
  let googleAdsLoaded = false;
  let statisticsConsentActive = false;
  let marketingConsentActive = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  // Google Consent Mode v2: Basic Consent Mode. Google-Tags werden erst nach aktiver Einwilligung geladen.
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  function getConsentSettings() {
    try {
      const savedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!savedConsent) return null;
      const parsedConsent = JSON.parse(savedConsent);
      if (parsedConsent.version !== CONSENT_VERSION) return null;
      return {
        necessary: true,
        statistics: Boolean(parsedConsent.statistics),
        marketing: Boolean(parsedConsent.marketing),
        timestamp: parsedConsent.timestamp,
        version: parsedConsent.version
      };
    } catch (error) {
      return null;
    }
  }

  function saveConsentSettings(settings) {
    const consentSettings = {
      necessary: true,
      statistics: Boolean(settings.statistics),
      marketing: Boolean(settings.marketing),
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION
    };

    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentSettings));
    return consentSettings;
  }

  function updateGoogleConsent(settings) {
    const statisticsGranted = Boolean(settings && settings.statistics);
    const marketingGranted = Boolean(settings && settings.marketing);

    window.gtag('consent', 'update', {
      analytics_storage: statisticsGranted ? 'granted' : 'denied',
      ad_storage: marketingGranted ? 'granted' : 'denied',
      ad_user_data: marketingGranted ? 'granted' : 'denied',
      ad_personalization: marketingGranted ? 'granted' : 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    });
  }

  function loadGoogleAnalytics() {
    if (googleAnalyticsLoaded || !GOOGLE_ANALYTICS_ID) {
      return false;
    }

    googleAnalyticsLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GOOGLE_ANALYTICS_ID);
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_ANALYTICS_ID, {
      anonymize_ip: true,
      send_page_view: true
    });

    return true;
  }

  function sendGoogleAnalyticsPageview() {
    if (!googleAnalyticsLoaded || !statisticsConsentActive) {
      return;
    }

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  function loadGoogleAds() {
    if (googleAdsLoaded || !GOOGLE_ADS_CONVERSION_ID || GOOGLE_ADS_CONVERSION_ID === 'AW-XXXXXXXXXX') {
      return false;
    }

    googleAdsLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GOOGLE_ADS_CONVERSION_ID);
    document.head.appendChild(script);

    window.gtag('config', GOOGLE_ADS_CONVERSION_ID, {
      send_page_view: false
    });

    return true;
  }

  function trackGoogleAdsConversion() {
    if (!marketingConsentActive || !googleAdsLoaded || GOOGLE_ADS_CONVERSION_LABEL === 'CONVERSION_LABEL_XXXXXXXXXX') {
      return;
    }

    window.gtag('event', 'conversion', {
      send_to: GOOGLE_ADS_CONVERSION_ID + '/' + GOOGLE_ADS_CONVERSION_LABEL
    });
  }

  function applyConsentSettings(settings) {
    const hadStatisticsConsent = statisticsConsentActive;
    statisticsConsentActive = Boolean(settings && settings.statistics);
    marketingConsentActive = Boolean(settings && settings.marketing);

    updateGoogleConsent(settings);

    if (statisticsConsentActive) {
      const loadedAnalyticsNow = loadGoogleAnalytics();
      if (hadStatisticsConsent === false && !loadedAnalyticsNow) {
        sendGoogleAnalyticsPageview();
      }
    }

    if (marketingConsentActive) {
      loadGoogleAds();
    }
  }

  function closeCookieSettings() {
    const banner = document.querySelector('[data-cookie-banner]');
    const modal = document.querySelector('[data-cookie-modal]');
    if (banner) banner.hidden = true;
    if (modal) modal.hidden = true;
  }

  function openCookieSettings() {
    const modal = document.querySelector('[data-cookie-modal]');
    if (!modal) return;

    const settings = getConsentSettings() || { statistics: false, marketing: false };
    const statisticsInput = modal.querySelector('[data-cookie-statistics]');
    const marketingInput = modal.querySelector('[data-cookie-marketing]');
    if (statisticsInput) statisticsInput.checked = Boolean(settings.statistics);
    if (marketingInput) marketingInput.checked = Boolean(settings.marketing);

    const banner = document.querySelector('[data-cookie-banner]');
    if (banner) banner.hidden = true;
    modal.hidden = false;
  }

  function acceptAllCookies() {
    const settings = saveConsentSettings({ statistics: true, marketing: true });
    applyConsentSettings(settings);
    closeCookieSettings();
  }

  function rejectAllCookies() {
    const settings = saveConsentSettings({ statistics: false, marketing: false });
    applyConsentSettings(settings);
    closeCookieSettings();
  }

  function saveCustomCookieSelection() {
    const modal = document.querySelector('[data-cookie-modal]');
    const statisticsInput = modal ? modal.querySelector('[data-cookie-statistics]') : null;
    const marketingInput = modal ? modal.querySelector('[data-cookie-marketing]') : null;
    const settings = saveConsentSettings({
      statistics: Boolean(statisticsInput && statisticsInput.checked),
      marketing: Boolean(marketingInput && marketingInput.checked)
    });

    applyConsentSettings(settings);
    closeCookieSettings();
  }

  function createConsentInterface() {
    if (document.querySelector('[data-cookie-banner]')) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-consent';
    banner.dataset.cookieBanner = '';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cookie-consent-title');
    banner.innerHTML = [
      '<div class="cookie-consent__panel">',
      '<p class="cookie-consent__eyebrow">Privatsphäre</p>',
      '<h2 id="cookie-consent-title">Cookie-Einstellungen</h2>',
      '<p>Wir verwenden essenzielle Technologien, damit unsere Website funktioniert. Mit Ihrer Einwilligung nutzen wir außerdem Google Analytics zur statistischen Auswertung und bereiten Google Ads / Conversion Tracking für Marketingzwecke vor. Sie können selbst entscheiden, welchen Kategorien Sie zustimmen.</p>',
      '<div class="cookie-consent__actions">',
      '<button class="cookie-btn cookie-btn--primary" type="button" data-cookie-accept>Alle akzeptieren</button>',
      '<button class="cookie-btn cookie-btn--ghost" type="button" data-cookie-reject>Ablehnen</button>',
      '<button class="cookie-btn" type="button" data-cookie-open-settings>Einstellungen</button>',
      '</div>',
      '</div>'
    ].join('');

    const modal = document.createElement('div');
    modal.className = 'cookie-modal';
    modal.dataset.cookieModal = '';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cookie-modal-title');
    modal.innerHTML = [
      '<div class="cookie-modal__panel">',
      '<p class="cookie-modal__eyebrow">Einwilligung verwalten</p>',
      '<h2 id="cookie-modal-title">Cookie-Einstellungen</h2>',
      '<p>Statistik- und Marketing-Technologien bleiben deaktiviert, bis Sie aktiv zustimmen. Ihre Auswahl können Sie jederzeit ändern.</p>',
      '<section class="cookie-category">',
      '<div><h3>Essenziell<span class="cookie-category__status">Immer aktiv</span></h3><p>Diese Technologien sind notwendig, damit die Website technisch funktioniert. Sie können nicht deaktiviert werden.</p></div>',
      '<label class="cookie-switch" aria-label="Essenziell immer aktiv"><input type="checkbox" checked disabled><span></span></label>',
      '</section>',
      '<section class="cookie-category">',
      '<div><h3>Statistik<span class="cookie-category__service">Google Analytics</span></h3><p>Erlaubt uns, die Nutzung der Website statistisch auszuwerten, zum Beispiel Seitenaufrufe, Verweildauer, verwendete Geräte und Interaktionen.</p></div>',
      '<label class="cookie-switch" aria-label="Statistik erlauben"><input type="checkbox" data-cookie-statistics><span></span></label>',
      '</section>',
      '<section class="cookie-category">',
      '<div><h3>Marketing<span class="cookie-category__service">Google Ads / Conversion Tracking</span></h3><p>Erlaubt uns, spätere Werbeanzeigen und Kontaktanfragen besser auszuwerten, zum Beispiel ob nach dem Klick auf eine Anzeige eine Anfrage gestellt wurde.</p></div>',
      '<label class="cookie-switch" aria-label="Marketing erlauben"><input type="checkbox" data-cookie-marketing><span></span></label>',
      '</section>',
      '<div class="cookie-modal__actions">',
      '<button class="cookie-btn cookie-btn--primary" type="button" data-cookie-save>Auswahl speichern</button>',
      '<button class="cookie-btn" type="button" data-cookie-accept>Alle akzeptieren</button>',
      '<button class="cookie-btn cookie-btn--ghost" type="button" data-cookie-reject>Ablehnen</button>',
      '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);
    document.body.appendChild(modal);

    if (getConsentSettings()) {
      banner.hidden = true;
    }
  }

  document.addEventListener('click', function (event) {
    const settingsLink = event.target.closest('[data-cookie-settings], [data-cookie-open-settings]');
    if (settingsLink) {
      event.preventDefault();
      openCookieSettings();
      return;
    }

    if (event.target.closest('[data-cookie-accept]')) {
      acceptAllCookies();
      return;
    }

    if (event.target.closest('[data-cookie-reject]')) {
      rejectAllCookies();
      return;
    }

    if (event.target.closest('[data-cookie-save]')) {
      saveCustomCookieSelection();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    createConsentInterface();
    const savedSettings = getConsentSettings();

    if (savedSettings) {
      applyConsentSettings(savedSettings);
    }
  });

  window.agrupConsent = {
    getConsentSettings,
    saveConsentSettings,
    openCookieSettings,
    closeCookieSettings,
    updateGoogleConsent,
    loadGoogleAnalytics,
    loadGoogleAds,
    acceptAllCookies,
    rejectAllCookies,
    saveCustomCookieSelection,
    trackGoogleAdsConversion
  };
}());
