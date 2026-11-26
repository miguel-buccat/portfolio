const prelude = document.querySelector('.prelude');
const words = [...document.querySelectorAll('.prelude__word')];
const portfolio = document.querySelector('.portfolio');
const logo = document.querySelector('.identity__link');
const workspace = document.querySelector('.workspace');
const menu = document.querySelector('.console');
const menuButtons = [...menu.querySelectorAll('button')];
const chapter = document.querySelector('.chapter');
const chapterTitle = document.querySelector('#chapter-title');
const about = document.querySelector('.about');
const aboutText = document.querySelector('.about__text');
const aboutStatus = document.querySelector('.about__status');
const aboutRetry = document.querySelector('.about__retry');
const aboutSkeleton = document.querySelector('.about__skeleton');
let aboutContent = null;
let aboutLoading = false;
let aboutHasRequested = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pages = new Map(menuButtons.map((button) => [button.dataset.page, button.querySelector('.console__label').textContent]));
// Each document load starts the intro afresh, regardless of the previous view.
let activePage = 'menu';
let lastPage = activePage;
const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
let animations = [];
let routeAnimations = [];
let generation = 0;
let ready = false;

function animate(element, frames, options) {
  const animation = element.animate(frames, options);
  animations.push(animation);
  return animation.finished.catch(() => {});
}

function renderPage(focus = false) {
  if (!ready) return;
  routeAnimations.forEach((animation) => animation.cancel());
  routeAnimations = [];
  const title = activePage === 'about-me' && aboutContent ? aboutContent.title : pages.get(activePage);
  chapter.dataset.view = activePage;
  about.hidden = activePage !== 'about-me';
  if (activePage === 'about-me') loadAboutContent();
  menu.hidden = Boolean(title);
  chapter.hidden = !title;
  chapterTitle.textContent = title || '';
  document.title = title ? `${title} — miguel buccat` : 'miguel buccat';
  if (focus) {
    if (title) chapterTitle.focus({ preventScroll: true });
    else (menuButtons.find((button) => button.dataset.page === lastPage) || menuButtons[0]).focus({ preventScroll: true });
  }
  if (title) lastPage = activePage;
  if (!reducedMotion.matches && Element.prototype.animate) {
    const targets = activePage === 'about-me' ? [about] : title ? [chapter] : menuButtons;
    routeAnimations = targets.map((element, index) => element.animate([
      { opacity: 0, transform: `translateY(24px) scaleX(${index % 2 ? 0.88 : 1.04}) scaleY(0.86)`, offset: 0 },
      { opacity: 1, transform: 'translateY(-3px) scaleX(1.015) scaleY(1.025)', offset: 0.65 },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 },
    ], { duration: 700, delay: index * 50, easing: ease, fill: 'backwards' }));
  }
}

async function loadAboutContent() {
  if (aboutContent || aboutLoading) return;
  aboutLoading = true;
  const minimumDelay = aboutHasRequested ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, 1000));
  aboutHasRequested = true;
  aboutSkeleton.hidden = false;
  aboutText.setAttribute('aria-busy', 'true');
  aboutStatus.hidden = false;
  aboutStatus.textContent = 'Putting the story together…';
  aboutRetry.hidden = true;
  try {
    const response = await fetch('config/aboutme.content.json');
    if (!response.ok) throw new Error('Content request failed');
    const content = await response.json();
    if (!content || typeof content.title !== 'string' || typeof content.introduction !== 'string' ||
        typeof content.photoAlt !== 'string' || !Array.isArray(content.paragraphs) ||
        !content.paragraphs.every((text) => typeof text === 'string')) {
      throw new Error('Invalid About Me content');
    }
    // Fetch immediately; keep the first skeleton visible for at least one second.
    await minimumDelay;
    document.querySelector('.about__intro').textContent = content.introduction;
    document.querySelector('.about__portrait img').alt = content.photoAlt;
    const paragraphs = content.paragraphs.map((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    });
    document.querySelectorAll('[data-social]').forEach((link) => {
      const value = content.socialLinks?.[link.dataset.social];
      let url;
      try {
        url = new URL(value);
      } catch { /* Unconfigured profiles remain visibly available as placeholders. */ }
      if (url && url.protocol === 'https:') {
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.removeAttribute('aria-disabled');
        link.title = link.getAttribute('aria-label');
      } else {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
        link.title = `${link.getAttribute('aria-label')} — profile coming soon`;
        link.setAttribute('aria-label', link.title);
      }
    });
    document.querySelector('.about__paragraphs').replaceChildren(...paragraphs);
    aboutContent = content;
    aboutText.hidden = false;
    aboutStatus.hidden = true;
    if (activePage === 'about-me') {
      chapterTitle.textContent = content.title;
      document.title = `${content.title} — miguel buccat`;
      if (!reducedMotion.matches && Element.prototype.animate) {
        routeAnimations.push(aboutText.animate([
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 380, easing: ease }));
      }
    }
  } catch {
    await minimumDelay;
    aboutStatus.textContent = 'The introduction couldn’t be loaded. Please try again.';
    aboutRetry.hidden = false;
  } finally {
    aboutSkeleton.hidden = true;
    aboutText.setAttribute('aria-busy', 'false');
    aboutLoading = false;
  }
}

aboutRetry.addEventListener('click', loadAboutContent);

function finishIntro() {
  ++generation;
  animations.forEach((animation) => animation.cancel());
  animations = [];
  prelude.hidden = true;
  portfolio.hidden = false;
  portfolio.inert = false;
  workspace.style.visibility = '';
  ready = true;
  renderPage();
}

async function startIntro() {
  if (reducedMotion.matches || !Element.prototype.animate || activePage !== 'menu') {
    finishIntro();
    return;
  }
  const current = ++generation;
  portfolio.inert = true;
  prelude.dataset.state = 'playing';
  await Promise.race([
    document.fonts.load('24px "Glacial Indifference"').catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1200)),
  ]);
  if (current !== generation) return;

  await Promise.all(words.map((word, index) => animate(word, [
    { opacity: 0, transform: 'translateY(10px) scale(0.92)', offset: 0 },
    { opacity: 1, transform: 'translateY(0) scale(1.025)', offset: 0.24 },
    { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.38 },
    { opacity: 1, transform: 'translateY(0) scale(1)', offset: 0.72 },
    { opacity: 0, transform: 'translateY(-5px) scale(0.985)', offset: 1 },
  ], { duration: 950, delay: index * 700, easing: 'ease-out', fill: 'both' })));
  if (current !== generation) return;

  prelude.hidden = true;
  prelude.dispatchEvent(new CustomEvent('prelude:complete', { bubbles: true }));
  workspace.style.visibility = 'hidden';
  portfolio.hidden = false;
  // Measure the final layout once, then move only with transforms.
  const bounds = logo.getBoundingClientRect();
  const offset = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
  const centered = `translateY(${offset}px) scale(1.3)`;
  await animate(logo, [
    { opacity: 0, transform: `${centered} scale(0.94)` },
    { opacity: 1, transform: centered, offset: 0.45 },
    { opacity: 1, transform: centered },
  ], { duration: 1100, easing: ease, fill: 'both' });
  if (current !== generation) return;

  await animate(logo, [
    { transform: centered },
    { transform: 'translateY(0) scale(1)' },
  ], { duration: 950, easing: ease, fill: 'both' });
  if (current !== generation) return;
  finishIntro();
}

function switchPage(page, { record = true } = {}) {
  if (page !== 'menu' && !pages.has(page)) return;
  if (page === activePage) return;
  activePage = page;
  if (record) {
    window.history.pushState({ ...window.history.state, portfolioPage: page }, '');
  }
  if (!ready) finishIntro();
  else renderPage(true);
}

// Preserve Back/Forward behavior while leaving the URL unchanged.
window.history.replaceState({ ...window.history.state, portfolioPage: activePage }, '');
document.querySelectorAll('button[data-page]').forEach((button) => {
  button.addEventListener('click', () => switchPage(button.dataset.page));
});
window.addEventListener('popstate', (event) => {
  switchPage(event.state?.portfolioPage || 'menu', { record: false });
});
reducedMotion.addEventListener('change', () => {
  if (!ready) finishIntro();
  else renderPage();
});
startIntro();
