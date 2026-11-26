const prelude = document.querySelector('.prelude');
const words = [...document.querySelectorAll('.prelude__word')];
const portfolio = document.querySelector('.portfolio');
const logo = document.querySelector('.identity__link');
const workspace = document.querySelector('.workspace');
const menu = document.querySelector('.menu');
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
const education = document.querySelector('.education');
const educationJourney = document.querySelector('.education__journey');
const educationTimeline = document.querySelector('.education__timeline');
const educationPanel = document.querySelector('.education__panel');
const educationTabTemplate = document.querySelector('#education-tab');
const educationCompact = window.matchMedia('(max-width: 700px)');
let educationTabs = [];
let educationSelectedIndex = -1;
let educationSelectionAnimation = null;
const educationPanels = new Map();
const educationSkeleton = document.querySelector('.education__skeleton');
const educationStatus = document.querySelector('.education__status');
const educationRetry = document.querySelector('.education__retry');
const educationEmpty = document.querySelector('.education__empty');
const educationTemplate = document.querySelector('#education-entry');
let educationContent = null;
let educationLoading = false;
let educationHasRequested = false;
const achievements = document.querySelector('.achievements');
const achievementsList = document.querySelector('.achievements__list');
const achievementsSkeleton = document.querySelector('.achievements__skeleton');
const achievementsStatus = document.querySelector('.achievements__status');
const achievementsRetry = document.querySelector('.achievements__retry');
const achievementsEmpty = document.querySelector('.achievements__empty');
const achievementTemplate = document.querySelector('#achievement-entry');
let achievementsContent = null;
let achievementsLoading = false;
let achievementsHasRequested = false;
const purpose = document.querySelector('.purpose');
const reflectionPages = ['values-principles', 'strengths-weaknesses'].map((key) => {
  const root = document.querySelector(`[data-reflection="${key}"]`);
  return {
    key, root, content: null, loading: false, hasRequested: false,
    body: root.querySelector('.reflection__body'),
    skeleton: root.querySelector('.reflection__skeleton'),
    status: root.querySelector('.reflection__status'),
    retry: root.querySelector('.reflection__retry'),
    file: key === 'values-principles' ? 'values' : 'strengths',
  };
});
const purposeParts = ['vision', 'mission'].map((key) => {
  const panel = document.querySelector(`.purpose__${key}`);
  return {
    key, panel, content: null, loading: false, hasRequested: false,
    heading: panel.querySelector('.purpose__heading'),
    body: panel.querySelector('.purpose__body'),
    skeleton: panel.querySelector('.purpose__skeleton'),
    status: panel.querySelector('.purpose__status'),
    retry: panel.querySelector('.purpose__retry'),
  };
});
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

// Animate layout itself so copy stays crisp and surrounding content moves with it.
const sizeAnimations = new Map();
function settleSizes() {
  sizeAnimations.forEach((animation) => animation.cancel());
  sizeAnimations.clear();
}

function transitionSize(elements, update, { animate = true } = {}) {
  const targets = new Set(elements);
  // Rebase any moving ancestors/children too, including rapid consecutive changes.
  let expanded;
  do {
    expanded = false;
    for (const element of sizeAnimations.keys()) {
      if (!targets.has(element) && [...targets].some((target) =>
        target.contains(element) || element.contains(target))) {
        targets.add(element);
        expanded = true;
      }
    }
  } while (expanded);
  const before = new Map([...targets].map((element) => [element, element.offsetHeight]));
  targets.forEach((element) => {
    sizeAnimations.get(element)?.cancel();
    sizeAnimations.delete(element);
  });
  update();
  if (!animate || reducedMotion.matches || !Element.prototype.animate) return;
  // Read all natural end heights before starting any animation.
  const after = new Map([...targets].map((element) => [element, element.offsetHeight]));
  targets.forEach((element) => {
    const from = before.get(element);
    const to = after.get(element);
    if (!(from > 0 && to > 0) || Math.abs(from - to) < 1) return;
    const frames = [from, to].map((height) => ({ height: `${height}px` }));
    // Keep outer shadows visible; clip arriving copy only inside its card.
    if (element !== workspace) frames.forEach((frame) => { frame.overflow = 'clip'; });
    const animation = element.animate(frames, { duration: 420, easing: ease });
    sizeAnimations.set(element, animation);
    animation.finished.catch(() => {}).then(() => {
      if (sizeAnimations.get(element) === animation) sizeAnimations.delete(element);
    });
  });
}
window.addEventListener('resize', settleSizes);

// Only the surface under a mouse tilts; touch and reduced motion stay still.
const depthPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const depthSurfaces = [...menuButtons, document.querySelector('.about__portrait')];
let depthSurface = null;
let depthBounds = null;
let depthFrame = 0;
let depthX = 0;
let depthY = 0;

function resetDepth() {
  if (depthFrame) cancelAnimationFrame(depthFrame);
  depthFrame = 0;
  if (depthSurface) {
    depthSurface.style.removeProperty('--tilt-x');
    depthSurface.style.removeProperty('--tilt-y');
  }
  depthSurface = null;
  depthBounds = null;
}

depthSurfaces.forEach((surface) => {
  surface.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse' || !depthPointer.matches || reducedMotion.matches) return;
    resetDepth();
    depthSurface = surface;
    depthBounds = surface.getBoundingClientRect();
  });
  surface.addEventListener('pointermove', (event) => {
    if (depthSurface !== surface || !depthBounds || reducedMotion.matches || !depthPointer.matches) return;
    depthX = Math.max(-1, Math.min(1, (event.clientX - depthBounds.left) / depthBounds.width * 2 - 1));
    depthY = Math.max(-1, Math.min(1, (event.clientY - depthBounds.top) / depthBounds.height * 2 - 1));
    if (depthFrame) return;
    depthFrame = requestAnimationFrame(() => {
      depthFrame = 0;
      surface.style.setProperty('--tilt-x', `${(-depthY * 3.5).toFixed(2)}deg`);
      surface.style.setProperty('--tilt-y', `${(depthX * 3.5).toFixed(2)}deg`);
    });
  });
  surface.addEventListener('pointerleave', resetDepth);
  surface.addEventListener('pointercancel', resetDepth);
  surface.addEventListener('pointerdown', resetDepth);
});
depthPointer.addEventListener('change', resetDepth);
window.addEventListener('resize', resetDepth);
window.addEventListener('scroll', resetDepth, { passive: true, capture: true });
window.addEventListener('blur', resetDepth);

function animate(element, frames, options) {
  const animation = element.animate(frames, options);
  animations.push(animation);
  return animation.finished.catch(() => {});
}

function renderPage(focus = false) {
  if (!ready) return;
  transitionSize([workspace], () => renderPageContent(focus));
}

function renderPageContent(focus) {
  educationSelectionAnimation?.cancel();
  educationSelectionAnimation = null;
  resetDepth();
  routeAnimations.forEach((animation) => animation.cancel());
  routeAnimations = [];
  const contentTitle = activePage === 'about-me' ? aboutContent?.title
    : activePage === 'educational-background' ? educationContent?.title
    : activePage === 'achievements-milestones' ? achievementsContent?.title
    : reflectionPages.find((page) => page.key === activePage)?.content?.title;
  const title = contentTitle || pages.get(activePage);
  chapter.dataset.view = activePage;
  about.hidden = activePage !== 'about-me';
  education.hidden = activePage !== 'educational-background';
  achievements.hidden = activePage !== 'achievements-milestones';
  purpose.hidden = activePage !== 'vision-mission';
  reflectionPages.forEach((page) => {
    page.root.hidden = activePage !== page.key;
    if (!page.root.hidden) loadReflectionContent(page);
  });
  if (activePage === 'about-me') loadAboutContent();
  if (activePage === 'educational-background') loadEducationContent();
  if (activePage === 'achievements-milestones') loadAchievementsContent();
  if (activePage === 'vision-mission') purposeParts.forEach(loadPurposePart);
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
    const targets = activePage === 'about-me' ? [about]
      : activePage === 'educational-background' ? [education]
      : activePage === 'achievements-milestones' ? [achievements]
      : activePage === 'vision-mission' ? purposeParts.map((part) => part.panel)
      : reflectionPages.some((page) => page.key === activePage) ? [reflectionPages.find((page) => page.key === activePage).root]
      : title ? [chapter] : menuButtons;
    routeAnimations = targets.map((element, index) => element.animate(activePage === 'vision-mission' ? [
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ] : [
      { opacity: 0, transform: `translateY(24px) scaleX(${index % 2 ? 0.88 : 1.04}) scaleY(0.86)`, offset: 0 },
      { opacity: 1, transform: 'translateY(-3px) scaleX(1.015) scaleY(1.025)', offset: 0.65 },
      { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 },
    ], { duration: activePage === 'vision-mission' ? 520 : 700, delay: index * (activePage === 'vision-mission' ? 70 : 50), easing: ease, fill: 'backwards' }));
  }
}

async function loadAboutContent() {
  if (aboutContent || aboutLoading) return;
  aboutLoading = true;
  const minimumDelay = aboutHasRequested ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, 1000));
  aboutHasRequested = true;
  transitionSize([about], () => {
    aboutSkeleton.hidden = false;
    aboutText.setAttribute('aria-busy', 'true');
    aboutStatus.hidden = false;
    aboutStatus.classList.add('sr-only');
    aboutStatus.textContent = 'Loading introduction…';
    aboutRetry.hidden = true;
  });
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
    transitionSize([about], () => {
      about.dataset.contentReady = 'true';
      aboutText.hidden = false;
      aboutStatus.hidden = true;
    });
    if (activePage === 'about-me') {
      chapterTitle.textContent = content.title;
      document.title = `${content.title} — miguel buccat`;
      if (!reducedMotion.matches && Element.prototype.animate) {
        // Overlay both states so the skeleton dissolves into the arriving copy.
        aboutText.inert = true;
        const skeletonExit = aboutSkeleton.animate([
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-6px)' },
        ], { duration: 240, easing: ease, fill: 'forwards' });
        const pieces = [
          document.querySelector('.about__intro'),
          ...paragraphs,
          ...document.querySelectorAll('.about__social'),
        ];
        const revealAnimations = [skeletonExit, ...pieces.map((element, index) => element.animate([
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 480, delay: 80 + Math.min(index * 50, 250), easing: ease, fill: 'backwards' }))];
        routeAnimations.push(...revealAnimations);
        // Cancellation on navigation or reduced motion also settles the final state.
        await Promise.all(revealAnimations.map((animation) => animation.finished.catch(() => {})));
        aboutSkeleton.hidden = true;
        revealAnimations.forEach((animation) => animation.cancel());
      }
    }
  } catch {
    await minimumDelay;
    transitionSize([about], () => {
      aboutSkeleton.hidden = true;
      aboutStatus.hidden = false;
      aboutStatus.classList.remove('sr-only');
      aboutStatus.textContent = 'The introduction couldn’t be loaded. Please try again.';
      aboutRetry.hidden = false;
    });
  } finally {
    aboutSkeleton.hidden = true;
    aboutText.inert = false;
    aboutText.setAttribute('aria-busy', 'false');
    aboutLoading = false;
  }
}

aboutRetry.addEventListener('click', loadAboutContent);

function validateEducationContent(content) {
  const text = (value) => typeof value === 'string';
  return content && text(content.title) && content.title.trim() &&
    Array.isArray(content.institutions) && content.institutions.every((item) =>
      item && ['institution', 'level', 'period', 'program', 'description', 'logo', 'logoAlt'].every((key) => text(item[key])) &&
      item.institution.trim() && Array.isArray(item.organizations) && item.organizations.every((organization) =>
        organization && text(organization.name) && Array.isArray(organization.positions) && organization.positions.every(text)));
}

function createEducationEntry(item, index) {
  const entry = educationTemplate.content.firstElementChild.cloneNode(true);
  const find = (selector) => entry.querySelector(selector);
  const heading = find('.education__institution');
  heading.id = `education-institution-${index + 1}`;
  heading.textContent = item.institution;
  entry.setAttribute('aria-labelledby', heading.id);
  find('.education__level').textContent = item.level;
  find('.education__period').textContent = item.period;
  find('.education__period').hidden = !item.period;
  find('.education__program').textContent = item.program;
  find('.education__description').textContent = item.description;
  find('.education__description').hidden = !item.description;
  const image = find('.education__logo');
  const fallback = find('.education__logo-fallback');
  const showFallback = () => { image.hidden = true; fallback.hidden = false; };
  image.alt = item.logoAlt || `${item.institution} logo`;
  image.addEventListener('error', showFallback, { once: true });
  if (item.logo) image.src = item.logo;
  else showFallback();

  const involvement = find('.education__involvement');
  const count = item.organizations.length;
  find('.education__counts').textContent = 'Organizations / Clubs / Societies';
  involvement.hidden = count === 0;
  let organizationsRendered = false;
  function revealOrganizations() {
    if (organizationsRendered) return;
    const rows = item.organizations.map((organization) => {
      const row = document.createElement('li');
      row.className = 'education__organization';
      const name = document.createElement('p');
      name.className = 'education__organization-name';
      name.textContent = organization.name;
      const positions = document.createElement('ul');
      positions.className = 'education__positions';
      positions.setAttribute('role', 'list');
      organization.positions.forEach((position) => {
        const role = document.createElement('li');
        role.textContent = position;
        positions.append(role);
      });
      row.append(name, positions);
      return row;
    });
    find('.education__organizations').replaceChildren(...rows);
    organizationsRendered = true;
  }
  find('.education__disclosure').addEventListener('click', (event) => {
    event.preventDefault();
    transitionSize([educationPanel], () => {
      if (!involvement.open) revealOrganizations();
      involvement.open = !involvement.open;
    });
  });
  involvement.addEventListener('toggle', () => {
    if (involvement.open) revealOrganizations();
  });
  return entry;
}

function selectEducation(index, { animate = true } = {}) {
  const item = educationContent?.institutions[index];
  if (!item || index === educationSelectedIndex) return;
  educationSelectionAnimation?.cancel();
  educationSelectionAnimation = null;
  educationSelectedIndex = index;
  educationTabs.forEach((button, tabIndex) => {
    const selected = tabIndex === index;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  if (!educationPanels.has(index)) educationPanels.set(index, createEducationEntry(item, index));
  transitionSize([educationPanel], () => {
    educationPanel.replaceChildren(educationPanels.get(index));
    educationPanel.setAttribute('aria-labelledby', educationTabs[index].id);
  }, { animate });
  if (animate && activePage === 'educational-background' && !reducedMotion.matches && Element.prototype.animate) {
    educationSelectionAnimation = educationPanel.animate([
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 280, easing: ease });
    educationSelectionAnimation.finished.catch(() => {});
  }
}

function createEducationTab(item, index) {
  const button = educationTabTemplate.content.firstElementChild.cloneNode(true);
  button.id = `education-tab-${index + 1}`;
  button.setAttribute('aria-label', `${item.level}: ${item.institution}${item.period ? `, ${item.period}` : ''}`);
  button.querySelector('.education__tab-number').textContent = String(index + 1).padStart(2, '0');
  button.querySelector('.education__tab-level').textContent = item.level || item.institution;
  button.querySelector('.education__tab-institution').textContent = item.institution;
  button.querySelector('.education__tab-period').textContent = item.period;
  button.querySelector('.education__tab-period').hidden = !item.period;
  button.addEventListener('click', () => selectEducation(index));
  button.addEventListener('keydown', (event) => {
    const forward = educationCompact.matches ? 'ArrowRight' : 'ArrowDown';
    const backward = educationCompact.matches ? 'ArrowLeft' : 'ArrowUp';
    let next;
    if (event.key === forward) next = (index + 1) % educationTabs.length;
    else if (event.key === backward) next = (index - 1 + educationTabs.length) % educationTabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = educationTabs.length - 1;
    else return;
    event.preventDefault();
    selectEducation(next);
    educationTabs[next].focus();
  });
  return button;
}

function updateEducationOrientation() {
  educationTimeline.setAttribute('aria-orientation', educationCompact.matches ? 'horizontal' : 'vertical');
}
educationCompact.addEventListener('change', updateEducationOrientation);
updateEducationOrientation();

async function loadEducationContent() {
  if (educationContent || educationLoading) return;
  educationLoading = true;
  const minimumDelay = educationHasRequested ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, 1000));
  educationHasRequested = true;
  transitionSize([education], () => {
    educationSkeleton.hidden = false;
    educationJourney.setAttribute('aria-busy', 'true');
    educationStatus.classList.add('sr-only');
    educationStatus.textContent = 'Loading educational background…';
    educationStatus.hidden = false;
    educationRetry.hidden = true;
    educationEmpty.hidden = true;
  });
  const revealAnimations = [];
  try {
    const response = await fetch('config/education.content.json');
    if (!response.ok) throw new Error('Content request failed');
    const content = await response.json();
    if (!validateEducationContent(content)) throw new Error('Invalid education content');
    const tabs = content.institutions.map(createEducationTab);
    await minimumDelay;
    transitionSize([education], () => {
      education.dataset.contentReady = 'true';
      educationContent = content;
      educationTabs = tabs;
      educationTimeline.replaceChildren(...tabs);
      educationJourney.hidden = tabs.length === 0;
      educationEmpty.hidden = tabs.length !== 0;
      if (tabs.length) selectEducation(0, { animate: false });
      educationStatus.hidden = true;
    });
    if (activePage === 'educational-background') {
      chapterTitle.textContent = content.title;
      document.title = `${content.title} — miguel buccat`;
      if (!reducedMotion.matches && Element.prototype.animate) {
        revealAnimations.push(educationSkeleton.animate([
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-6px)' },
        ], { duration: 240, easing: ease, fill: 'forwards' }));
        const pieces = tabs.length ? [educationJourney] : [educationEmpty];
        revealAnimations.push(...pieces.map((entry, index) => entry.animate([
          { opacity: 0, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 480, delay: 80 + Math.min(index * 50, 250), easing: ease, fill: 'backwards' })));
        routeAnimations.push(...revealAnimations);
        await Promise.all(revealAnimations.map((animation) => animation.finished.catch(() => {})));
      }
    }
  } catch {
    await minimumDelay;
    transitionSize([education], () => {
      educationSkeleton.hidden = true;
      educationStatus.classList.remove('sr-only');
      educationStatus.hidden = false;
      educationStatus.textContent = 'My educational background couldn’t be loaded. Please try again.';
      educationRetry.hidden = false;
    });
  } finally {
    educationSkeleton.hidden = true;
    revealAnimations.forEach((animation) => animation.cancel());
    educationJourney.setAttribute('aria-busy', 'false');
    educationLoading = false;
  }
}

educationRetry.addEventListener('click', loadEducationContent);

function validateAchievementsContent(content) {
  const text = (value) => typeof value === 'string';
  return content && text(content.title) && content.title.trim() &&
    Array.isArray(content.achievements) && content.achievements.every((item) =>
      item && ['title', 'category', 'institution'].every((key) => text(item[key]) && item[key].trim()) &&
      ['level', 'year'].every((key) => text(item[key])) &&
      (item.description === undefined || text(item.description)) &&
      (item.icon === undefined || text(item.icon)) && (item.color === undefined || text(item.color)));
}

function createAchievement(item, index) {
  const entry = achievementTemplate.content.firstElementChild.cloneNode(true);
  const find = (selector) => entry.querySelector(selector);
  const heading = find('.achievement__title');
  heading.id = `achievement-title-${index + 1}`;
  heading.textContent = item.title;
  find('.achievement__card').setAttribute('aria-labelledby', heading.id);
  ['category', 'institution', 'level', 'year'].forEach((key) => {
    find(`.achievement__${key}`).textContent = item[key];
    find(`.achievement__${key}`).hidden = !item[key].trim();
  });
  find('.achievement__description').textContent = item.description || '';
  find('.achievement__description').hidden = !item.description;
  const icon = ['medal', 'trophy', 'flag', 'sparkles'].includes(item.icon) ? item.icon : 'medal';
  find('.achievement__icon use').setAttribute('href', `#achievement-icon-${icon}`);
  entry.dataset.color = ['gold', 'mint', 'rose', 'lavender'].includes(item.color) ? item.color : 'gold';
  return entry;
}

async function loadAchievementsContent() {
  if (achievementsContent || achievementsLoading) return;
  achievementsLoading = true;
  const minimumDelay = achievementsHasRequested ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, 1000));
  achievementsHasRequested = true;
  transitionSize([achievements], () => {
    achievementsSkeleton.hidden = false;
    achievementsList.setAttribute('aria-busy', 'true');
    achievementsStatus.classList.add('sr-only');
    achievementsStatus.textContent = 'Loading achievements…';
    achievementsStatus.hidden = false;
    achievementsRetry.hidden = true;
    achievementsEmpty.hidden = true;
  });
  const revealAnimations = [];
  try {
    const response = await fetch('config/achievements.content.json');
    if (!response.ok) throw new Error('Content request failed');
    const content = await response.json();
    if (!validateAchievementsContent(content)) throw new Error('Invalid achievements content');
    const entries = content.achievements.map(createAchievement);
    await minimumDelay;
    transitionSize([achievements], () => {
      achievements.dataset.contentReady = 'true';
      achievementsList.replaceChildren(...entries);
      achievementsContent = content;
      achievementsList.hidden = entries.length === 0;
      achievementsEmpty.hidden = entries.length !== 0;
      achievementsStatus.hidden = true;
    });
    if (activePage === 'achievements-milestones') {
      chapterTitle.textContent = content.title;
      document.title = `${content.title} — miguel buccat`;
      if (!reducedMotion.matches && Element.prototype.animate) {
        revealAnimations.push(achievementsSkeleton.animate([
          { opacity: 1 }, { opacity: 0 },
        ], { duration: 220, easing: ease, fill: 'forwards' }));
        const targets = entries.length ? entries : [achievementsEmpty];
        revealAnimations.push(...targets.map((entry, index) => entry.animate([
          { opacity: 0, transform: 'translateY(16px) scale(0.985)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ], { duration: 480, delay: 80 + Math.min(index * 50, 250), easing: ease, fill: 'backwards' })));
        routeAnimations.push(...revealAnimations);
        await Promise.all(revealAnimations.map((animation) => animation.finished.catch(() => {})));
      }
    }
  } catch {
    await minimumDelay;
    transitionSize([achievements], () => {
      achievementsSkeleton.hidden = true;
      achievementsStatus.classList.remove('sr-only');
      achievementsStatus.textContent = 'Achievements couldn’t be loaded. Please try again.';
      achievementsStatus.hidden = false;
      achievementsRetry.hidden = false;
    });
  } finally {
    achievementsSkeleton.hidden = true;
    revealAnimations.forEach((animation) => animation.cancel());
    achievementsList.setAttribute('aria-busy', 'false');
    achievementsLoading = false;
  }
}

achievementsRetry.addEventListener('click', loadAchievementsContent);

function validatePurposeContent(content) {
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  if (!content || !['heading', 'eyebrow', 'statement'].every((field) => text(content[field])) ||
      typeof content.detail !== 'string' ||
      (content.example !== undefined && typeof content.example !== 'boolean')) return false;
  return true;
}

function renderPurposeContent(part, content) {
  part.heading.textContent = content.heading;
  part.panel.querySelector('.purpose__eyebrow').textContent = content.eyebrow;
  part.panel.querySelector('.purpose__statement').textContent = content.statement;
  const detail = part.panel.querySelector('.purpose__detail');
  detail.textContent = content.detail;
  detail.hidden = !content.detail.trim();

}

async function loadPurposePart(part) {
  if (part.content || part.loading) return;
  part.loading = true;
  const restoreFocus = document.activeElement === part.retry;
  const minimumDelay = part.hasRequested ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, 1000));
  part.hasRequested = true;
  transitionSize([part.panel], () => {
    part.panel.dataset.state = 'loading';
    part.skeleton.hidden = false;
    part.body.setAttribute('aria-busy', 'true');
    part.status.classList.add('sr-only');
    part.status.textContent = `Loading ${part.key}…`;
    part.status.hidden = false;
    part.retry.hidden = true;
  });
  const revealAnimations = [];
  try {
    const response = await fetch(`config/${part.key}.content.json`);
    if (!response.ok) throw new Error('Content request failed');
    const content = await response.json();
    if (!validatePurposeContent(content)) throw new Error('Invalid purpose content');
    await minimumDelay;
    transitionSize([part.panel], () => {
      renderPurposeContent(part, content);
      part.content = content;
      part.panel.dataset.state = 'ready';
      part.body.hidden = false;
      part.status.hidden = true;
    });
    if (activePage === 'vision-mission' && !reducedMotion.matches && Element.prototype.animate) {
      revealAnimations.push(part.skeleton.animate([
        { opacity: 1 }, { opacity: 0 },
      ], { duration: 200, easing: ease, fill: 'forwards' }));
      revealAnimations.push(part.body.animate([
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 480, delay: part.key === 'vision' ? 50 : 120, easing: ease, fill: 'backwards' }));
      routeAnimations.push(...revealAnimations);
      await Promise.all(revealAnimations.map((animation) => animation.finished.catch(() => {})));
    }
  } catch {
    await minimumDelay;
    transitionSize([part.panel], () => {
      part.skeleton.hidden = true;
      part.panel.dataset.state = 'error';
      part.status.classList.remove('sr-only');
      part.status.textContent = `My ${part.key} couldn’t be loaded. Please try again.`;
      part.status.hidden = false;
      part.retry.hidden = false;
    });
  } finally {
    part.skeleton.hidden = true;
    revealAnimations.forEach((animation) => animation.cancel());
    part.body.setAttribute('aria-busy', 'false');
    part.loading = false;
    if (restoreFocus && activePage === 'vision-mission') {
      (part.content ? part.heading : part.retry).focus({ preventScroll: true });
    }
  }
}

purposeParts.forEach((part) => part.retry.addEventListener('click', () => loadPurposePart(part)));

function validateReflectionContent(content, key) {
  const text = (value) => typeof value === 'string' && value.trim().length > 0;
  const items = (list) => Array.isArray(list) && list.every((item) =>
    item && text(item.title) && text(item.description));
  if (!content || !['title', 'statement', 'introduction'].every((field) => text(content[field]))) return false;
  if (key === 'values-principles') return items(content.items);
  return ['strengths', 'weaknesses'].every((group) =>
    content[group] && text(content[group].heading) && items(content[group].items));
}

function renderReflectionContent(page, content) {
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const intro = node('header', 'reflection__intro');
  intro.append(node('p', 'reflection__statement', content.statement),
    node('p', 'reflection__description', content.introduction));
  const values = page.key === 'values-principles';
  const layout = node(values ? 'ol' : 'div', values ? 'reflection__values' : 'reflection__columns');
  if (values) layout.setAttribute('role', 'list');
  const addItems = (list, items, headingTag, numbered = false) => {
    items.forEach((item, index) => {
      const row = node('li', numbered ? 'reflection__value' : 'reflection__item');
      if (numbered) {
        const number = node('span', 'reflection__number', String(index + 1).padStart(2, '0'));
        number.setAttribute('aria-hidden', 'true');
        row.append(number);
      }
      const copy = node('div', 'reflection__copy');
      copy.append(node(headingTag, 'reflection__item-title', item.title),
        node('p', 'reflection__detail', item.description));
      row.append(copy);
      list.append(row);
    });
    if (!items.length) list.append(node('li', 'reflection__empty', 'More reflections to come.'));
  };
  if (values) addItems(layout, content.items, 'h2', true);
  else ['strengths', 'weaknesses'].forEach((key) => {
    const section = node('section', `reflection__group reflection__group--${key}`);
    const heading = node('h2', 'reflection__group-title', content[key].heading);
    heading.id = `reflection-${key}-title`;
    section.setAttribute('aria-labelledby', heading.id);
    const list = node('ul', 'reflection__items');
    list.setAttribute('role', 'list');
    addItems(list, content[key].items, 'h3');
    section.append(heading, list);
    layout.append(section);
  });
  page.body.replaceChildren(intro, layout);
}

async function loadReflectionContent(page) {
  if (page.content || page.loading) return;
  page.loading = true;
  const restoreFocus = document.activeElement === page.retry;
  const minimumDelay = page.hasRequested ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, 1000));
  page.hasRequested = true;
  transitionSize([page.root], () => {
    page.root.dataset.state = 'loading';
    page.skeleton.hidden = false;
    page.body.setAttribute('aria-busy', 'true');
    page.status.classList.add('sr-only');
    page.status.textContent = 'Loading reflections…';
    page.status.hidden = false;
    page.retry.hidden = true;
  });
  const reveals = [];
  try {
    const response = await fetch(`config/${page.file}.content.json`);
    if (!response.ok) throw new Error('Content request failed');
    const content = await response.json();
    if (!validateReflectionContent(content, page.key)) throw new Error('Invalid reflection content');
    await minimumDelay;
    transitionSize([page.root], () => {
      renderReflectionContent(page, content);
      page.content = content;
      page.root.dataset.state = 'ready';
      page.body.hidden = false;
      page.status.hidden = true;
      if (activePage === page.key) {
        chapterTitle.textContent = content.title;
        document.title = `${content.title} — miguel buccat`;
      }
    });
    if (activePage === page.key && !reducedMotion.matches && Element.prototype.animate) {
      reveals.push(page.skeleton.animate([{ opacity: 1 }, { opacity: 0 }],
        { duration: 200, easing: ease, fill: 'forwards' }));
      reveals.push(page.body.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 480, delay: 60, easing: ease, fill: 'backwards' }));
      routeAnimations.push(...reveals);
      await Promise.all(reveals.map((animation) => animation.finished.catch(() => {})));
    }
  } catch {
    await minimumDelay;
    transitionSize([page.root], () => {
      page.skeleton.hidden = true;
      page.root.dataset.state = 'error';
      page.status.classList.remove('sr-only');
      page.status.textContent = 'These reflections couldn’t be loaded. Please try again.';
      page.status.hidden = false;
      page.retry.hidden = false;
    });
  } finally {
    page.skeleton.hidden = true;
    reveals.forEach((animation) => animation.cancel());
    page.body.setAttribute('aria-busy', 'false');
    page.loading = false;
    if (restoreFocus && activePage === page.key) {
      (page.content ? chapterTitle : page.retry).focus({ preventScroll: true });
    }
  }
}
reflectionPages.forEach((page) => page.retry.addEventListener('click', () => loadReflectionContent(page)));

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
  settleSizes();
  if (!ready) finishIntro();
  else renderPage();
});
startIntro();
