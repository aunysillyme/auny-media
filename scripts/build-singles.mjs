#!/usr/bin/env node
// Generates static HTML for /singles/ and /singles/<slug>/ from src/data/singles.js + templates/

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { SINGLES, COLOR_SERIES, COLOR_SERIES_ORDER, COLOR_TYPE_INFO, colorSeriesMembers } from '../src/data/singles.js';
import { SINGLE_NOTES } from '../src/data/singles-notes.js';
import { navFor, esc, jsonLd, NAV_CSS, PLAYER_CSS, FOOTER_CSS, FOOTER_HTML, COLOR_CHIPS_CSS, LISTEN_ROW_CSS, SHARE_ROW_CSS, SHARE_ROW_JS, shareRowFor, GA_HEAD, SERIES_CARD_CSS, SIGNUP_HTML, SIGNUP_CSS, SIGNUP_JS, RECENT_STRIP_CSS, coverDimensions, isUpcoming, presaveRowFor, todayISO, playerFor, footerFor, colorChipsFor, recentStripFor, registerColorTypeInfo, singleCoverPath, seriesBadge, singleGenreHead, listenRowFor, platformUrls, coverPicture, CHARACTER_CSS, characterSectionFor , ogImage} from './_lib.mjs';

registerColorTypeInfo(COLOR_TYPE_INFO);

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = (name) => readFileSync(join(root, 'templates', name), 'utf8');

const SINGLE_TPL = tpl('single.html');
const LIST_TPL = tpl('singles-list.html');

// One date for the whole run, so a build that straddles midnight cannot render
// one page as upcoming and the next as released.
const TODAY_ISO = todayISO();

// ─── Helpers ────────────────────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escAttr(s) { return escHtml(s); }

function lyricsToStanzas(text, anchor) {
  const stanzas = text.trim().split(/\n\s*\n/).map((stanza) => stanza.split('\n'));
  // mark the anchor line (case-insensitive contains match on a normalized version) with .accent
  const anchorNorm = anchor.replace(/[—–-]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
  return stanzas.map((lines) => {
    const html = lines.map((line) => {
      const norm = line.replace(/[—–-]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
      const isAnchor = anchorNorm.length > 6 && norm.includes(anchorNorm.split(' ').slice(0, 5).join(' '));
      const esc = escHtml(line);
      return isAnchor ? `<span class="accent">${esc}</span>` : esc;
    }).join('<br>');
    return `    <p>${html}</p>`;
  }).join('\n');
}

function lyricsToJsonText(text) {
  return jsonLd(text);
}

// Per-single background hue rotation off the source PNG (which is already blue-violet)
function bgHueFor(single) {
  if (single.colorSeries === 'member') {
    const map = { black: 200, blue: 200, yellow: 30, red: 340, pink: 320, orange: 20, cyan: 180 };
    return map[single.slug] ?? 200;
  }
  return 200;
}

// An optional authored note under the hero. It exists for Perfect World, whose
// release date and minute are a deliberate choice rather than a schedule slot,
// and the page has to say so in Auny's own words or not at all. Paragraphs come
// from the data layer so the copy is reviewable as copy, never buried in markup.
function dedicationFor(single) {
  const d = single.dedication;
  if (!d || !Array.isArray(d.body) || d.body.length === 0) return '';
  const paras = d.body.map((line) => `      <p>${escHtml(line)}</p>`).join('\n');
  return `<section class="dedication" aria-label="A note from Auny">
    <div class="dedication-inner">
      <p class="dedication-eyebrow">a note from auny</p>
      <h2 class="dedication-heading">${escHtml(d.heading || '')}</h2>
${paras}
      <p class="dedication-sig">Auny</p>
    </div>
  </section>`;
}

function heroLabelFor(single, upcoming = false) {
  // A pre-release page must never read like a released one. The suffix is the
  // only thing separating "single" from "single, out in two days" in the hero.
  const suffix = upcoming ? ' \u00b7 coming soon' : '';
  if (single.colorSeries === 'member') {
    const meta = COLOR_SERIES.find((c) => c.slug === single.slug);
    const tag = meta?.type === 'outlier' ? 'outlier' : 'rainbow';
    return `${single.emoji} &nbsp; single · color series · ${tag}${suffix}`;
  }
  return `✦ &nbsp; single${suffix}`;
}

function seriesBlockFor(single) {
  if (single.colorSeries !== 'member') return '';
  const meta = COLOR_SERIES.find((c) => c.slug === single.slug);
  return colorChipsFor({
    colors: COLOR_SERIES,
    currentSlug: single.slug,
    currentType: meta?.type,
  });
}

function titleHtml(single) {
  // Allow two-line titles for long ones
  if (single.title.length > 14) {
    const words = single.title.split(' ');
    if (words.length >= 2) {
      const mid = Math.ceil(words.length / 2);
      return escHtml(words.slice(0, mid).join(' ')) + '<br>' + escHtml(words.slice(mid).join(' '));
    }
  }
  return escHtml(single.title);
}

// ─── Single page render ─────────────────────────────────────────────────────

function renderSingle(single) {
  // Opt-in enrichment: Tempo meta-row + production note, rendered only when
  // src/data/singles-notes.js carries an entry for this slug.
  const notes = SINGLE_NOTES[single.slug] || {};
  const tempoMetaRow = notes.bpm
    ? `\n      <div class="meta-row"><span class="meta-key">Tempo</span><span class="meta-val">${notes.bpm} BPM</span></div>`
    : '';
  const prodNoteBlock = notes.note
    ? `    <div class="prod-note"><span class="pn-label">Note</span><span class="pn-text">${escHtml(notes.note)}</span></div>\n`
    : '';
  const tempoSchema = notes.bpm
    ? `\n  "additionalProperty": { "@type": "PropertyValue", "name": "Tempo", "value": "${notes.bpm} BPM" },`
    : '';
  const noteSchema = notes.note
    ? `\n  "description": ${jsonLd(notes.note)},`
    : '';
  const upcoming = isUpcoming(single, TODAY_ISO);
  const replacements = {
    // ─── Pre-release ────────────────────────────────────────────────────
    // Until today, only ALBUM pages could render a coming-soon state; a
    // future-dated single rendered exactly like a released one, with a dead
    // player and an empty chip row and nothing saying why. releaseStatus() was
    // always generic, the singles builder just never asked it.
    UPCOMING_BANNER: upcoming
      ? `<p class="upcoming-banner"><span class="dot"></span> Out ${escHtml(single.releaseDisplay)}${single.releaseTime ? ` · ${escHtml(single.releaseTime)}` : ''}</p>`
      : '',
    DEDICATION: dedicationFor(single),
    // "Released September 11" on a page for a track that is not out is a plain
    // factual error, and it appeared in the meta row AND the meta description.
    RELEASE_KEY: upcoming ? 'Releases' : 'Released',
    RELEASE_SENTENCE: upcoming
      ? `Out ${escHtml(single.releaseDisplay)}${single.releaseTime ? ` at ${escHtml(single.releaseTime)}` : ''}.`
      : `Released ${escHtml(single.releaseDisplay)}.`,

    CHARACTER_SECTION: characterSectionFor(single),
    CHARACTER_CSS,
    TEMPO_META_ROW: tempoMetaRow,
    PROD_NOTE_BLOCK: prodNoteBlock,
    TEMPO_SCHEMA: tempoSchema,
    NOTE_SCHEMA: noteSchema,
    TITLE: escHtml(single.title),
    TITLE_HTML: titleHtml(single),
    YEAR: String(single.year),
    SLUG: single.slug,
    COVER_EXT: singleCoverPath(single.slug).endsWith('.jpg') ? 'jpg' : 'svg',
    // Read from the file, not assumed: 640 was hardcoded here and is wrong for
    // any cover that is not 640, which is now two of them.
    OG_IMAGE_W: String(coverDimensions(singleCoverPath(single.slug)).width),
    OG_IMAGE_H: String(coverDimensions(singleCoverPath(single.slug)).height),
    RELEASE_DISPLAY: escHtml(single.releaseDisplay),
    RELEASE_ISO: single.releaseDate,
    GENRE: escHtml(single.genre),
    GENRE_HEAD: escHtml(singleGenreHead(single.genre)),
    HERO_PICTURE: coverPicture({ base: singleCoverPath(single.slug).replace(/\.jpg$/, ''), alt: `${escAttr(single.title)} cover art by Auny`, sizes: '(max-width:760px) 80vw, 420px', eager: true }),
    SPOTIFY_TRACK_ID: single.spotifyTrackId,
    // Omitted entirely until the id exists, rather than linking to ".../track/".

    HYPERFOLLOW_SLUG: single.hyperfollowSlug,
    // Pre-release the ONLY control is the pre-save; a chip row of platforms
    // that cannot play it yet is worse than no row.
    LISTEN_ROW: upcoming
      ? presaveRowFor(single.hyperfollowSlug, { label: 'pre-save on spotify' })
      : listenRowFor(single, {
          spotifyUrl: single.spotifyTrackId ? `https://open.spotify.com/track/${single.spotifyTrackId}` : '',
          hyperfollowSlug: single.hyperfollowSlug,
        }),
    // Same rule as albums: no link against an empty id. Singles get released
    // immediately, which is exactly when the Spotify id does not exist yet, so
    // this is the likeliest place to reproduce the flatline dead-link bug.
    SAMEAS_JSONLD: jsonLd([
      single.spotifyTrackId ? `https://open.spotify.com/track/${single.spotifyTrackId}` : null,
      ...platformUrls(single),
      `https://distrokid.com/hyperfollow/auny1/${single.hyperfollowSlug}`,
    ].filter(Boolean)),
    THEMES: escHtml(single.themes),
    ANCHOR_LYRIC: escHtml(single.anchorLyric),
    ACCENT_COLOR: single.accent.color,
    ACCENT_RGB: single.accent.rgb,
    BG_HUE: String(bgHueFor(single)),
    HERO_LABEL: heroLabelFor(single, upcoming),
    SERIES_BLOCK: seriesBlockFor(single),
    LYRICS_HTML: lyricsToStanzas(single.lyrics, single.anchorLyric),
    LYRICS_JSON: lyricsToJsonText(single.lyrics),
    NAV: navFor('singles'),
    NAV_CSS: NAV_CSS,
    PLAYER_CSS: PLAYER_CSS,
    // Disabled facade until the id exists — an empty id yields ".../embed/track/?"
    // which renders a Spotify error inside the page.
    // Nothing to play before release: omit the facade rather than ship a
    // disabled one, which reads as broken rather than as forthcoming.
    PLAYER_HTML: upcoming ? '' : playerFor({ kind: 'track', id: single.spotifyTrackId || '', title: single.title, cover: singleCoverPath(single.slug).replace(/\.jpg$/, '-640.webp'), disabled: !single.spotifyTrackId }),
    FOOTER_CSS: FOOTER_CSS,
    FOOTER_HTML: footerFor({ releaseDisplay: single.releaseDisplay }),
    COLOR_CHIPS_CSS: COLOR_CHIPS_CSS,
    LISTEN_ROW_CSS: LISTEN_ROW_CSS,
    SHARE_ROW: shareRowFor({
      slug: single.slug,
      title: single.title, kind: 'single', upcoming, releaseDisplay: single.releaseDisplay,
    }),
    SHARE_ROW_CSS, SHARE_ROW_JS, GA_HEAD,
    SIGNUP_HTML, SIGNUP_CSS, SIGNUP_JS,
    RECENT_STRIP_CSS,
    RECENT_STRIP_HTML: recentStripFor({ all: SINGLES, currentSlug: single.slug, kind: 'single' }),
  };
  return Object.entries(replacements).reduce(
    (html, [key, val]) => html.replaceAll(`{{${key}}}`, () => val),
    SINGLE_TPL
  );
}

// ─── List page render ───────────────────────────────────────────────────────

function cardHtml(single, opts = {}) {
  const hasAccent = single.colorSeries === 'member' || single.slug === 'pink';
  const cls = hasAccent ? 'card series' : 'card';
  const accentStyle = hasAccent ? ` style="--card-accent:${single.accent.color}"` : '';
  const badge = opts.badgeText ? `      ${seriesBadge(opts.badgeText)}\n` : '';
  return `      <a class="${cls}" href="/singles/${single.slug}"${accentStyle}>
${badge}        <div class="cover">${coverPicture({ base: singleCoverPath(single.slug).replace(/\.jpg$/, ''), alt: `${escAttr(single.title)} cover`, sizes: '(max-width:720px) 45vw, 240px' })}</div>
        <div class="body">
          <div class="card-title">${escHtml(single.title)}</div>
          <div class="card-meta">${isUpcoming(single, TODAY_ISO) ? `Coming ${escHtml(single.releaseDisplay)}` : escHtml(single.releaseDisplay)}</div>
        </div>
      </a>`;
}

function pinkCard() {
  const p = SINGLES.find((s) => s.slug === 'pink');
  if (!p) return '';
  return `      <a class="card series" href="/singles/${p.slug}" style="--card-accent:${p.accent.color}">
        ${seriesBadge(p.emoji)}
        <div class="cover">${coverPicture({ base: singleCoverPath(p.slug).replace(/\.jpg$/, ''), alt: `${escAttr(p.title)} cover`, sizes: '(max-width:720px) 45vw, 240px' })}</div>
        <div class="body">
          <div class="card-title">${escHtml(p.title)}</div>
          <div class="card-meta">${escHtml(p.releaseDisplay)}</div>
        </div>
      </a>`;
}

function renderList() {
  const series = colorSeriesMembers();
  const seriesCards = [
    pinkCard(),
    ...series.filter((s) => s.slug !== 'pink').map((s) => cardHtml(s, { badgeText: s.emoji })),
  ].join('\n');
  const allCards = SINGLES.map((s) => cardHtml(s)).join('\n');
  const listJsonLd = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Singles — Auny',
    'url': 'https://www.auny.media/singles',
    'description': `All ${SINGLES.length} vocal singles by Auny.`,
    'isPartOf': { '@id': 'https://www.auny.media/#website' },
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': SINGLES.length,
      'itemListElement': SINGLES.map((s, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'item': {
          '@type': 'MusicRecording',
          'name': s.title,
          'url': `https://www.auny.media/singles/${s.slug}`,
          'image': `https://www.auny.media${singleCoverPath(s.slug)}`,
          'datePublished': s.releaseDate,
          'genre': s.genre,
          'byArtist': { '@type': 'MusicGroup', '@id': 'https://www.auny.media/#artist' },
          'sameAs': s.spotifyTrackId ? `https://open.spotify.com/track/${s.spotifyTrackId}` : undefined,
        },
      })),
    },
  }, null, 2);

  return LIST_TPL
    .replaceAll('{{OG_IMAGE}}', ogImage('singles'))
    .replaceAll('{{GA_HEAD}}', () => GA_HEAD)
    .replaceAll('{{SERIES_CARDS}}', seriesCards)
    .replaceAll('{{ALL_CARDS}}', allCards)
    .replaceAll('{{TOTAL_SINGLES}}', String(SINGLES.length))
    .replaceAll('{{LIST_JSONLD}}', listJsonLd)
    .replaceAll('{{NAV}}', navFor('singles'))
    .replaceAll('{{NAV_CSS}}', NAV_CSS)
    .replaceAll('{{SERIES_CARD_CSS}}', SERIES_CARD_CSS)
    .replaceAll('{{SIGNUP_HTML}}', SIGNUP_HTML)
    .replaceAll('{{SIGNUP_CSS}}', SIGNUP_CSS)
    .replaceAll('{{SIGNUP_JS}}', SIGNUP_JS)
    .replaceAll('{{FOOTER_HTML}}', FOOTER_HTML)
    .replaceAll('{{FOOTER_CSS}}', FOOTER_CSS);
}

// ─── Write files ─────────────────────────────────────────────────────────────

function writeFile(relPath, content) {
  const full = join(root, 'public', relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
}

let count = 0;
for (const single of SINGLES) {
  writeFile(join('singles', `${single.slug}.html`), renderSingle(single));
  count++;
}
writeFile(join('singles.html'), renderList());

console.log(`✓ generated ${count} single pages → public/singles/*.html + listing → public/singles.html`);
