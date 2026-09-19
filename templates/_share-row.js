<script>
// Share row: Copy writes the page link to the clipboard; More opens the device
// share sheet and is shown only where the browser has one. Every click fires a
// GA4 `share` event (method = platform, item_id = slug) IF gtag exists on the
// page; without it nothing is sent anywhere.
(function () {
  var rows = document.querySelectorAll('.share-row');
  if (!rows.length) return;
  if (navigator.share) {
    document.querySelectorAll('.share-row [data-native]').forEach(function (b) { b.hidden = false; });
  }
  function track(method, item) {
    // Analytics must never stand between a visitor and the share itself.
    try {
      if (typeof window.gtag === 'function') window.gtag('event', 'share', { method: method, item_id: item });
    } catch (e) {}
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (ok, fail) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done ? ok() : fail();
    });
  }
  rows.forEach(function (row) {
    var status = row.querySelector('.sh-status');
    var item = row.dataset.item || '';
    var say = function (msg) {
      if (!status) return;
      status.textContent = msg;
      clearTimeout(say.t);
      say.t = setTimeout(function () { status.textContent = ''; }, 2400);
    };
    row.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-method]');
      if (!chip) return;
      track(chip.dataset.method, item);
      if (chip.dataset.copy) {
        copyText(chip.dataset.copy).then(function () { say('link copied'); }, function () { say('copy failed'); });
      }
      if (chip.dataset.native) {
        navigator.share({ title: chip.dataset.title, text: chip.dataset.text, url: chip.dataset.native }).catch(function () {});
      }
    });
  });
})();
</script>
