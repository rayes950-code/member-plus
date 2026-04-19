/**
 * Member Plus — Salla App Snippet
 * Injected into every store page via Salla App Snippets.
 * Self-contained, no external dependencies, Arabic RTL.
 *
 * Usage:
 *   <script src="snippet-inject.js"
 *     data-store-id="12345"
 *     data-api-base="https://app.memberplus.sa">
 *   </script>
 *
 * Size budget: < 30KB minified (PRD constraint)
 * Safety: full try-catch envelope with kill switch (PRD R-14)
 */
(function MemberPlusSnippet() {
  'use strict';

  try {

    // ─── Configuration ───────────────────────────────────────────
    var scriptTag = document.currentScript || (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    var CONFIG = {
      storeId: scriptTag.getAttribute('data-store-id') || '',
      apiBase: (scriptTag.getAttribute('data-api-base') || '').replace(/\/+$/, ''),
      cacheTTL: 5 * 60 * 1000, // 5 minutes (PRD)
      cacheKey: 'mps_member_state',
      cacheTimeKey: 'mps_member_state_ts'
    };

    if (!CONFIG.storeId || !CONFIG.apiBase) return; // silent exit — misconfigured

    // ─── Customer ID from Salla SDK ──────────────────────────────
    function getCustomerId() {
      try {
        if (window.Salla && window.Salla.user && window.Salla.user.id) return window.Salla.user.id;
        if (window.__SALLA__ && window.__SALLA__.customer && window.__SALLA__.customer.id) return window.__SALLA__.customer.id;
      } catch (_) { /* ignore */ }
      return null;
    }

    // ─── Inject CSS ──────────────────────────────────────────────
    function injectStyles() {
      if (document.getElementById('mps-injected-css')) return;
      var style = document.createElement('style');
      style.id = 'mps-injected-css';
      style.textContent = [
        /* Root container */
        '.mps{position:fixed;bottom:24px;inset-inline-start:24px;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans Arabic",sans-serif;direction:rtl;line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}',
        '.mps *,.mps *::before,.mps *::after{box-sizing:border-box;margin:0;padding:0}',
        '@media(max-width:480px){.mps{bottom:16px;inset-inline-start:16px}}',

        /* Badge */
        '.mps-badge{display:flex;align-items:center;gap:0;background:#fff;border:none;border-radius:999px;padding:0;cursor:pointer;box-shadow:0 2px 12px rgba(0,0,0,.10),0 0 0 1px rgba(0,0,0,.04);transition:all .3s cubic-bezier(.16,1,.3,1);overflow:hidden;height:48px;outline:none}',
        '.mps-badge:hover{box-shadow:0 6px 24px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.06);transform:translateY(-2px)}',
        '.mps-badge:focus-visible{box-shadow:0 0 0 3px rgba(190,82,239,.4)}',
        '.mps-badge__icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}',
        '.mps-badge__icon--gold{background:linear-gradient(135deg,#C9A84C,#E8D5A0)}',
        '.mps-badge__icon--silver{background:linear-gradient(135deg,#B0A898,#D4CFC8)}',
        '.mps-badge__icon--join{background:linear-gradient(135deg,#BE52EF,#9B35D4)}',
        '.mps-badge__icon--soon{background:linear-gradient(135deg,#C9A84C,#E8D5A0)}',
        '.mps-badge__text{padding:0 16px 0 4px;display:flex;flex-direction:column;justify-content:center;line-height:1.25}',
        '[dir="ltr"] .mps-badge__text{padding:0 4px 0 16px}',
        '.mps-badge__sub{font-size:10px;color:#999;font-weight:400}',
        '.mps-badge__main{font-size:13px;font-weight:600;color:#1a1a1a}',

        /* Popup */
        '.mps-popup{position:absolute;bottom:calc(100% + 10px);inset-inline-start:0;width:340px;background:#fff;border-radius:20px;box-shadow:0 16px 48px rgba(0,0,0,.12),0 0 0 1px rgba(0,0,0,.04);transform:translateY(10px) scale(.96);opacity:0;pointer-events:none;transition:all .3s cubic-bezier(.16,1,.3,1);overflow:hidden}',
        '.mps-popup.mps-is-open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto}',
        '@media(max-width:400px){.mps-popup{width:calc(100vw - 32px);inset-inline-start:-8px}}',

        /* Hero */
        '.mps-popup__hero{padding:28px 24px 20px;text-align:center;position:relative}',
        '.mps-popup__hero--gold{background:linear-gradient(160deg,#C9A84C 0%,#E8D5A0 40%,#D4BC6A 100%);color:#1a1a1a}',
        '.mps-popup__hero--silver{background:linear-gradient(160deg,#B0A898 0%,#D4CFC8 40%,#C0B8AE 100%);color:#1a1a1a}',
        '.mps-popup__hero--join{background:linear-gradient(160deg,#BE52EF 0%,#D98EF7 40%,#9B35D4 100%);color:#fff}',
        '.mps-popup__hero--soon{background:linear-gradient(160deg,#1a1a1a 0%,#2a2520 100%);color:#fff}',
        '.mps-popup__emoji{font-size:36px;margin-bottom:10px}',
        '.mps-popup__title{font-size:20px;font-weight:700;letter-spacing:-.01em}',
        '.mps-popup__sub{font-size:12px;opacity:.75;margin-top:4px}',

        /* Close */
        '.mps-popup__close{position:absolute;top:14px;inset-inline-end:14px;background:rgba(255,255,255,.2);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:none;color:inherit;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background .15s;outline:none}',
        '.mps-popup__close:hover{background:rgba(255,255,255,.35)}',
        '.mps-popup__close:focus-visible{box-shadow:0 0 0 2px rgba(255,255,255,.6)}',

        /* Body rows */
        '.mps-popup__body{padding:20px 24px}',
        '.mps-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0}',
        '.mps-row+.mps-row{border-top:1px solid #f0ede8}',
        '.mps-row__label{font-size:13px;color:#7a7570}',
        '.mps-row__val{font-size:14px;font-weight:600}',
        '.mps-row__val--accent{color:#BE52EF}',
        '.mps-row__val--green{color:#047857}',
        '.mps-row__val--gold{color:#C9A84C}',

        /* Actions */
        '.mps-popup__actions{padding:0 24px 20px;display:flex;flex-direction:column;gap:8px}',
        '.mps-btn{display:block;width:100%;padding:12px 16px;border-radius:12px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;text-align:center;text-decoration:none;border:none;transition:all .15s}',
        '.mps-btn--primary{background:#BE52EF;color:#fff;box-shadow:0 2px 8px rgba(190,82,239,.25)}',
        '.mps-btn--primary:hover{background:#9B35D4;box-shadow:0 4px 14px rgba(190,82,239,.3)}',
        '.mps-btn--secondary{background:transparent;color:#BE52EF;border:1px solid #E8D0F8}',
        '.mps-btn--secondary:hover{background:#F7F0FC}',
        '.mps-btn--dark{background:#1a1a1a;color:#C9A84C;border:none}',
        '.mps-btn--dark:hover{background:#2a2520}',
        '.mps-btn:disabled{opacity:.5;cursor:not-allowed}',

        /* Footer */
        '.mps-popup__footer{text-align:center;padding:0 24px 16px;font-size:10px;color:#ccc}',

        /* Savings */
        '.mps-savings{margin:0 24px 16px;padding:14px;background:linear-gradient(135deg,#F7F0FC 0%,#FAF0FF 100%);border-radius:12px;text-align:center}',
        '.mps-savings__val{font-size:22px;font-weight:700;color:#BE52EF}',
        '.mps-savings__label{font-size:11px;color:#7a7570;margin-top:2px}',

        /* Tiers */
        '.mps-tiers{display:flex;gap:8px;margin:0 24px 16px}',
        '.mps-tier{flex:1;padding:14px 12px;border-radius:12px;text-align:center;border:1px solid #f0ede8}',
        '.mps-tier--gold{border-color:#C9A84C;background:rgba(201,168,76,.04)}',
        '.mps-tier__name{font-size:11px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:.06em}',
        '.mps-tier--gold .mps-tier__name{color:#C9A84C}',
        '.mps-tier__price{font-size:18px;font-weight:700;margin-top:4px}',
        '.mps-tier__unit{font-size:10px;color:#999}',

        /* Interest form */
        '.mps-interest{padding:0 24px 20px;text-align:center}',
        '.mps-interest p{font-size:13px;color:#7a7570;margin-bottom:14px;line-height:1.6}',
        '.mps-interest__done{color:#047857;font-size:13px;font-weight:500;margin-top:10px;display:none}',

        /* Animation entrance */
        '@keyframes mps-slide-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}',
        '.mps--entering{animation:mps-slide-in .4s cubic-bezier(.16,1,.3,1) forwards}'
      ].join('\n');
      document.head.appendChild(style);
    }

    // ─── DOM Creation ────────────────────────────────────────────
    function createContainer() {
      var existing = document.getElementById('mps-root');
      if (existing) existing.remove();

      var root = document.createElement('div');
      root.id = 'mps-root';
      root.className = 'mps mps--entering';
      root.setAttribute('dir', 'rtl');

      var popup = document.createElement('div');
      popup.className = 'mps-popup';
      popup.id = 'mps-popup';

      var badge = document.createElement('button');
      badge.className = 'mps-badge';
      badge.id = 'mps-badge';
      badge.type = 'button';
      badge.setAttribute('aria-label', 'Member Plus');
      badge.setAttribute('aria-expanded', 'false');

      root.appendChild(popup);
      root.appendChild(badge);
      document.body.appendChild(root);

      return { root: root, popup: popup, badge: badge };
    }

    // ─── State ───────────────────────────────────────────────────
    var isOpen = false;
    var els = null; // { root, popup, badge }

    function togglePopup(forceClose) {
      if (!els) return;
      if (forceClose === true) {
        isOpen = false;
      } else {
        isOpen = !isOpen;
      }
      if (isOpen) {
        els.popup.classList.add('mps-is-open');
      } else {
        els.popup.classList.remove('mps-is-open');
      }
      els.badge.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    // ─── Helper: build customer page URL ─────────────────────────
    function customerPageURL() {
      return CONFIG.apiBase + '/customer?store=' + encodeURIComponent(CONFIG.storeId);
    }

    function memberPageURL() {
      return CONFIG.apiBase + '/member?store=' + encodeURIComponent(CONFIG.storeId);
    }

    // ─── Escape HTML ─────────────────────────────────────────────
    function esc(str) {
      if (!str) return '';
      var d = document.createElement('div');
      d.appendChild(document.createTextNode(str));
      return d.innerHTML;
    }

    // ─── Render Badge ────────────────────────────────────────────
    function renderBadge(data) {
      if (!els) return;
      var state = data.state; // gold | silver | visitor | soon | former
      var iconClass, emoji, sub, main;

      switch (state) {
        case 'gold':
          iconClass = 'mps-badge__icon--gold'; emoji = '\uD83D\uDC51'; sub = '\u0639\u0636\u0648 \u0630\u0647\u0628\u064A'; main = '\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0630\u0647\u0628\u064A\u0629';
          break;
        case 'silver':
          iconClass = 'mps-badge__icon--silver'; emoji = '\uD83D\uDC8E'; sub = '\u0639\u0636\u0648 \u0641\u0636\u064A'; main = '\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0641\u0636\u064A\u0629';
          break;
        case 'former':
          iconClass = 'mps-badge__icon--join'; emoji = '\uD83D\uDC8E'; sub = '\u0639\u0636\u0648 \u0633\u0627\u0628\u0642'; main = '\u0639\u064F\u062F \u0644\u0644\u0639\u0636\u0648\u064A\u0629';
          break;
        case 'soon':
          iconClass = 'mps-badge__icon--soon'; emoji = '\u2728'; sub = '\u0642\u0631\u064A\u0628\u0627\u064B'; main = '\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0639\u0636\u0648\u064A\u0629';
          break;
        default: // visitor / non-member
          iconClass = 'mps-badge__icon--join'; emoji = '\uD83D\uDC8E'; sub = '\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0639\u0636\u0648\u064A\u0629'; main = '\u0627\u0646\u0636\u0645 \u0627\u0644\u0622\u0646';
          break;
      }

      els.badge.innerHTML =
        '<div class="mps-badge__icon ' + iconClass + '">' + emoji + '</div>' +
        '<div class="mps-badge__text">' +
          '<span class="mps-badge__sub">' + esc(sub) + '</span>' +
          '<span class="mps-badge__main">' + esc(main) + '</span>' +
        '</div>';
    }

    // ─── Render Popup ────────────────────────────────────────────
    function renderPopup(data) {
      if (!els) return;
      var state = data.state;
      var html = '';

      if (state === 'gold' || state === 'silver') {
        var isGold = state === 'gold';
        var discount = (data.discount_percent != null) ? data.discount_percent : (isGold ? 15 : 10);
        var freeShippingUsed = data.free_shipping_used || 0;
        var freeShippingTotal = data.free_shipping_total || (isGold ? 4 : 2);
        var freeShippingRemaining = freeShippingTotal - freeShippingUsed;
        var totalSaved = data.total_saved || (isGold ? '0.00' : '0.00');
        var renewalDate = data.renewal_date || '';
        var giftAvailable = data.gift_available;

        html =
          '<button class="mps-popup__close" data-mps-close aria-label="\u0625\u063A\u0644\u0627\u0642">\u2715</button>' +
          '<div class="mps-popup__hero mps-popup__hero--' + state + '">' +
            '<div class="mps-popup__emoji">' + (isGold ? '\uD83D\uDC51' : '\uD83D\uDC8E') + '</div>' +
            '<div class="mps-popup__title">' + (isGold ? '\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0630\u0647\u0628\u064A\u0629' : '\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0641\u0636\u064A\u0629') + '</div>' +
            '<div class="mps-popup__sub">\u0639\u0636\u0648\u064A\u0629 \u0646\u0634\u0637\u0629</div>' +
          '</div>' +
          '<div class="mps-savings">' +
            '<div class="mps-savings__val">' + esc(String(totalSaved)) + ' \u0631.\u0633</div>' +
            '<div class="mps-savings__label">\u0625\u062C\u0645\u0627\u0644\u064A \u0645\u0627 \u0648\u0641\u0651\u0631\u062A\u0647</div>' +
          '</div>' +
          '<div class="mps-popup__body">' +
            '<div class="mps-row"><span class="mps-row__label">\u0627\u0644\u062E\u0635\u0645 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A</span><span class="mps-row__val mps-row__val--accent">' + esc(String(discount)) + '%</span></div>' +
            '<div class="mps-row"><span class="mps-row__label">\u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u0645\u062C\u0627\u0646\u064A</span><span class="mps-row__val">' + esc(String(freeShippingRemaining)) + ' \u0645\u0646 ' + esc(String(freeShippingTotal)) + ' \u0645\u062A\u0628\u0642\u064A</span></div>' +
            (isGold && giftAvailable !== false ?
              '<div class="mps-row"><span class="mps-row__label">\u0627\u0644\u0647\u062F\u064A\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629</span><span class="mps-row__val mps-row__val--green">' + (giftAvailable ? '\u0645\u062A\u0627\u062D\u0629' : '\u062A\u0645 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645') + '</span></div>' : '') +
            (renewalDate ?
              '<div class="mps-row"><span class="mps-row__label">\u0627\u0644\u062A\u062C\u062F\u064A\u062F \u0627\u0644\u0642\u0627\u062F\u0645</span><span class="mps-row__val">' + esc(renewalDate) + '</span></div>' : '') +
          '</div>' +
          '<div class="mps-popup__actions">' +
            '<a class="mps-btn mps-btn--primary" href="' + memberPageURL() + '">\u0639\u0631\u0636 \u0639\u0636\u0648\u064A\u062A\u064A</a>' +
            (!isGold ? '<a class="mps-btn mps-btn--secondary" href="' + customerPageURL() + '">\u062A\u0631\u0642\u064A\u0629 \u0644\u0644\u0630\u0647\u0628\u064A\u0629</a>' : '') +
          '</div>' +
          '<div class="mps-popup__footer">Member Plus</div>';

      } else if (state === 'visitor') {
        var silverPrice = data.silver_price || '49';
        var goldPrice = data.gold_price || '99';
        var priceUnit = data.price_unit || '\u0631.\u0633/\u0634\u0647\u0631';

        html =
          '<button class="mps-popup__close" data-mps-close aria-label="\u0625\u063A\u0644\u0627\u0642">\u2715</button>' +
          '<div class="mps-popup__hero mps-popup__hero--join">' +
            '<div class="mps-popup__emoji">\uD83D\uDC8E</div>' +
            '<div class="mps-popup__title">\u0627\u0646\u0636\u0645 \u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0639\u0636\u0648\u064A\u0629</div>' +
            '<div class="mps-popup__sub">\u062E\u0635\u0648\u0645\u0627\u062A \u062D\u0635\u0631\u064A\u0629 \u00B7 \u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A \u00B7 \u0647\u062F\u0627\u064A\u0627 \u0634\u0647\u0631\u064A\u0629</div>' +
          '</div>' +
          '<div class="mps-tiers">' +
            '<div class="mps-tier"><div class="mps-tier__name">\u0641\u0636\u064A\u0629</div><div class="mps-tier__price">' + esc(String(silverPrice)) + '</div><div class="mps-tier__unit">' + esc(priceUnit) + '</div></div>' +
            '<div class="mps-tier mps-tier--gold"><div class="mps-tier__name">\u0630\u0647\u0628\u064A\u0629</div><div class="mps-tier__price">' + esc(String(goldPrice)) + '</div><div class="mps-tier__unit">' + esc(priceUnit) + '</div></div>' +
          '</div>' +
          '<div class="mps-popup__body">' +
            '<div class="mps-row"><span class="mps-row__label">\u062E\u0635\u0645 \u062A\u0644\u0642\u0627\u0626\u064A</span><span class="mps-row__val">\u062D\u062A\u0649 15%</span></div>' +
            '<div class="mps-row"><span class="mps-row__label">\u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A</span><span class="mps-row__val">\u062D\u062A\u0649 4 \u0645\u0631\u0627\u062A/\u0634\u0647\u0631</span></div>' +
            '<div class="mps-row"><span class="mps-row__label">\u0647\u062F\u064A\u0629 \u0634\u0647\u0631\u064A\u0629</span><span class="mps-row__val mps-row__val--gold">\u0627\u0644\u0630\u0647\u0628\u064A\u0629 \u0641\u0642\u0637</span></div>' +
          '</div>' +
          '<div class="mps-popup__actions">' +
            '<a class="mps-btn mps-btn--primary" href="' + customerPageURL() + '">\u0639\u0631\u0636 \u0627\u0644\u0628\u0627\u0642\u0627\u062A \u0648\u0627\u0644\u0627\u0646\u0636\u0645\u0627\u0645</a>' +
          '</div>' +
          '<div class="mps-popup__footer">Member Plus</div>';

      } else if (state === 'former') {
        var prevTier = data.previous_tier || '\u0627\u0644\u0630\u0647\u0628\u064A\u0629';
        var prevSaved = data.previous_saved || '0.00';
        var expiredDate = data.expired_date || '';

        html =
          '<button class="mps-popup__close" data-mps-close aria-label="\u0625\u063A\u0644\u0627\u0642">\u2715</button>' +
          '<div class="mps-popup__hero mps-popup__hero--join">' +
            '<div class="mps-popup__emoji">\uD83D\uDD04</div>' +
            '<div class="mps-popup__title">\u0646\u0641\u062A\u0642\u062F\u0643!</div>' +
            '<div class="mps-popup__sub">\u0643\u0646\u062A \u0639\u0636\u0648\u0627\u064B \u0648\u0648\u0641\u0651\u0631\u062A \u0645\u0639\u0646\u0627</div>' +
          '</div>' +
          '<div class="mps-savings">' +
            '<div class="mps-savings__val">' + esc(String(prevSaved)) + ' \u0631.\u0633</div>' +
            '<div class="mps-savings__label">\u0648\u0641\u0651\u0631\u062A\u0647\u0627 \u062E\u0644\u0627\u0644 \u0639\u0636\u0648\u064A\u062A\u0643 \u0627\u0644\u0633\u0627\u0628\u0642\u0629</div>' +
          '</div>' +
          '<div class="mps-popup__body">' +
            '<div class="mps-row"><span class="mps-row__label">\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629</span><span class="mps-row__val mps-row__val--gold">' + esc(prevTier) + '</span></div>' +
            (expiredDate ? '<div class="mps-row"><span class="mps-row__label">\u0627\u0646\u062A\u0647\u062A \u0641\u064A</span><span class="mps-row__val">' + esc(expiredDate) + '</span></div>' : '') +
          '</div>' +
          '<div class="mps-popup__actions">' +
            '<a class="mps-btn mps-btn--primary" href="' + customerPageURL() + '">\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643</a>' +
          '</div>' +
          '<div class="mps-popup__footer">Member Plus</div>';

      } else if (state === 'soon') {
        html =
          '<button class="mps-popup__close" data-mps-close aria-label="\u0625\u063A\u0644\u0627\u0642">\u2715</button>' +
          '<div class="mps-popup__hero mps-popup__hero--soon">' +
            '<div class="mps-popup__emoji">\u2728</div>' +
            '<div class="mps-popup__title">\u0628\u0631\u0646\u0627\u0645\u062C \u0627\u0644\u0639\u0636\u0648\u064A\u0629 \u0642\u0631\u064A\u0628\u0627\u064B</div>' +
            '<div class="mps-popup__sub">\u062E\u0635\u0648\u0645\u0627\u062A \u00B7 \u0634\u062D\u0646 \u0645\u062C\u0627\u0646\u064A \u00B7 \u0647\u062F\u0627\u064A\u0627 \u062D\u0635\u0631\u064A\u0629</div>' +
          '</div>' +
          '<div class="mps-interest">' +
            '<p>\u0633\u062C\u0651\u0644 \u0627\u0647\u062A\u0645\u0627\u0645\u0643 \u0648\u0633\u0646\u0628\u0644\u063A\u0643 \u0641\u0648\u0631 \u0627\u0644\u0625\u0637\u0644\u0627\u0642 \u2014 \u0643\u0646 \u0645\u0646 \u0623\u0648\u0627\u0626\u0644 \u0627\u0644\u0623\u0639\u0636\u0627\u0621!</p>' +
            '<button class="mps-btn mps-btn--dark" data-mps-interest>\u0623\u0646\u0627 \u0645\u0647\u062A\u0645 \u2728</button>' +
            '<div class="mps-interest__done" data-mps-interest-done>\u2713 \u062A\u0645 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u2014 \u0633\u0646\u0628\u0644\u063A\u0643 \u0641\u0648\u0631 \u0627\u0644\u0625\u0637\u0644\u0627\u0642</div>' +
          '</div>' +
          '<div class="mps-popup__footer">Member Plus</div>';
      }

      els.popup.innerHTML = html;
    }

    // ─── Event Binding ───────────────────────────────────────────
    function bindEvents(data) {
      if (!els) return;

      // Badge click
      els.badge.addEventListener('click', function (e) {
        e.stopPropagation();
        togglePopup();
      });

      // Close button (delegated)
      els.popup.addEventListener('click', function (e) {
        var target = e.target;
        if (target.hasAttribute('data-mps-close') || target.closest('[data-mps-close]')) {
          e.stopPropagation();
          togglePopup(true);
          return;
        }

        // Interest registration
        if (target.hasAttribute('data-mps-interest') || target.closest('[data-mps-interest]')) {
          e.stopPropagation();
          handleInterest(target.hasAttribute('data-mps-interest') ? target : target.closest('[data-mps-interest]'));
        }
      });

      // Prevent popup clicks from closing
      els.popup.addEventListener('click', function (e) {
        e.stopPropagation();
      });

      // Outside click closes popup
      document.addEventListener('click', function (e) {
        if (isOpen && els && !els.root.contains(e.target)) {
          togglePopup(true);
        }
      });

      // Escape key closes popup
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) {
          togglePopup(true);
        }
      });
    }

    // ─── Interest Registration ───────────────────────────────────
    function handleInterest(btn) {
      if (!btn || btn.disabled) return;
      btn.disabled = true;
      btn.textContent = '\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u0633\u062C\u064A\u0644...';

      var customerId = getCustomerId();
      var url = CONFIG.apiBase + '/api/v1/member/interest';
      var payload = JSON.stringify({
        store_id: CONFIG.storeId,
        salla_customer_id: customerId
      });

      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 10000;
        xhr.onload = function () { showInterestDone(btn); };
        xhr.onerror = function () { showInterestDone(btn); }; // still show success UI
        xhr.ontimeout = function () { showInterestDone(btn); };
        xhr.send(payload);
      } catch (_) {
        showInterestDone(btn);
      }
    }

    function showInterestDone(btn) {
      if (!btn) return;
      btn.style.display = 'none';
      var done = els.popup.querySelector('[data-mps-interest-done]');
      if (done) done.style.display = 'block';
    }

    // ─── Session Cache ───────────────────────────────────────────
    function getCached() {
      try {
        var raw = sessionStorage.getItem(CONFIG.cacheKey);
        var ts = parseInt(sessionStorage.getItem(CONFIG.cacheTimeKey), 10);
        if (raw && ts && (Date.now() - ts < CONFIG.cacheTTL)) {
          return JSON.parse(raw);
        }
      } catch (_) { /* ignore */ }
      return null;
    }

    function setCache(data) {
      try {
        sessionStorage.setItem(CONFIG.cacheKey, JSON.stringify(data));
        sessionStorage.setItem(CONFIG.cacheTimeKey, String(Date.now()));
      } catch (_) { /* ignore — private browsing may throw */ }
    }

    // ─── API Call ────────────────────────────────────────────────
    function fetchMemberState(callback) {
      var customerId = getCustomerId();
      var url = CONFIG.apiBase + '/api/v1/member/state?store_id=' +
        encodeURIComponent(CONFIG.storeId) +
        (customerId ? '&salla_customer_id=' + encodeURIComponent(customerId) : '');

      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.timeout = 10000;

        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var data = JSON.parse(xhr.responseText);
              callback(null, data);
            } catch (parseErr) {
              callback(parseErr, null);
            }
          } else {
            callback(new Error('HTTP ' + xhr.status), null);
          }
        };

        xhr.onerror = function () { callback(new Error('Network error'), null); };
        xhr.ontimeout = function () { callback(new Error('Timeout'), null); };

        xhr.send();
      } catch (err) {
        callback(err, null);
      }
    }

    // ─── Initialization ──────────────────────────────────────────
    function init() {
      // Check cache first
      var cached = getCached();
      if (cached) {
        mount(cached);
        return;
      }

      // Fetch from API
      fetchMemberState(function (err, data) {
        if (err || !data || !data.state) {
          // Silent failure — never break the store (PRD R-14)
          return;
        }
        setCache(data);
        mount(data);
      });
    }

    function mount(data) {
      if (!data || !data.state) return;

      injectStyles();
      els = createContainer();
      renderBadge(data);
      renderPopup(data);
      bindEvents(data);
    }

    // ─── Start ───────────────────────────────────────────────────
    // Wait for DOM ready, then for Salla SDK availability
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        // Give Salla SDK a moment to initialize
        setTimeout(init, 500);
      });
    } else {
      setTimeout(init, 500);
    }

  } catch (fatalErr) {
    // Kill switch: if anything throws, snippet disappears silently (PRD R-14)
    try {
      var mpsRoot = document.getElementById('mps-root');
      if (mpsRoot) mpsRoot.remove();
      var mpsCSS = document.getElementById('mps-injected-css');
      if (mpsCSS) mpsCSS.remove();
    } catch (_) { /* truly nothing left to do */ }
  }

})();
