/* ═══════════════════════════════════════════════════
   script.js — Portfolio JS
   Handles: loading projects.json, carousel, archive
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── HELPERS ──────────────────────────────────────

  function slugify(tag) {
    return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  function statusClass(status) {
    return status === 'Completed' ? 'completed' : 'in-progress';
  }

  function buildCard(project) {
    const tagsHTML = project.tags
      .map(t => `<span class="card-tag">${t}</span>`)
      .join('');

    return `
      <div class="project-card" data-tags="${project.tags.map(slugify).join(' ')}">
        <div class="card-header">
          <span class="card-year">${project.year}</span>
          <span class="card-status ${statusClass(project.status)}">${project.status}</span>
        </div>
        <h3 class="card-title">${project.title}</h3>
        <p class="card-subtitle">${project.subtitle}</p>
        <p class="card-desc">${project.description}</p>
        <div class="card-tags">${tagsHTML}</div>
        <div class="card-links">
          ${project.link && project.link !== '#' ? `<a href="${project.link}" target="_blank" rel="noopener">View Project →</a>` : ''}
          ${project.github && project.github !== '#' ? `<a href="${project.github}" target="_blank" rel="noopener">GitHub →</a>` : ''}
          ${(!project.link || project.link === '#') && (!project.github || project.github === '#') ? '<span style="color:var(--text-dim);font-style:italic;">Coming soon</span>' : ''}
        </div>
      </div>
    `;
  }

  // ── LOAD PROJECTS ─────────────────────────────────

  async function loadProjects() {
    try {
      if (typeof projectsData !== 'undefined') {
        return projectsData;
      } else {
        throw new Error('projectsData is not defined.');
      }
    } catch (e) {
      console.warn('Could not load projects:', e);
      return [];
    }
  }

  // ── CAROUSEL (index.html) ─────────────────────────

  function initCarousel(projects) {
    const track  = document.getElementById('carouselTrack');
    const prev   = document.getElementById('prevBtn');
    const next   = document.getElementById('nextBtn');
    const dots   = document.getElementById('carouselDots');

    if (!track) return; // not on index page

    // How many cards visible at once (responsive)
    function visibleCount() {
      return window.innerWidth <= 480 ? 1 : window.innerWidth <= 700 ? 1 : 3;
    }

    // Populate cards
    track.innerHTML = projects.map(buildCard).join('');

    let current = 0;
    const total = projects.length;

    function maxIndex() {
      return Math.max(0, total - visibleCount());
    }

    // Build dots
    function buildDots() {
      if (!dots) return;
      dots.innerHTML = '';
      const pages = maxIndex() + 1;
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('button');
        d.className = 'dot' + (i === current ? ' active' : '');
        d.setAttribute('aria-label', `Go to slide ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dots.appendChild(d);
      }
    }

    function updateDots() {
      if (!dots) return;
      [...dots.querySelectorAll('.dot')].forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    function goTo(index) {
      current = Math.max(0, Math.min(index, maxIndex()));
      const cardWidth = track.querySelector('.project-card').offsetWidth;
      track.style.transform = `translateX(-${current * cardWidth}px)`;
      prev.disabled = current === 0;
      next.disabled = current >= maxIndex();
      updateDots();
    }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));

    // Rebuild on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        current = 0;
        buildDots();
        goTo(0);
      }, 150);
    });

    // Touch/swipe support
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? goTo(current + 1) : goTo(current - 1);
      }
    });

    buildDots();
    goTo(0);
  }

  // ── ARCHIVE (projects.html) ───────────────────────

  function initArchive(projects) {
    const grid    = document.getElementById('archiveGrid');
    const filterBar = document.getElementById('filterBar');

    if (!grid) return; // not on archive page

    // Collect all unique tags
    const allTags = [...new Set(projects.flatMap(p => p.tags))].sort();

    // Build tag filters
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-tag active';
    allBtn.textContent = 'All';
    allBtn.dataset.tag = 'all';
    filterBar.appendChild(allBtn);

    allTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'filter-tag';
      btn.textContent = tag;
      btn.dataset.tag = slugify(tag);
      filterBar.appendChild(btn);
    });

    // Render all cards
    grid.innerHTML = projects.map(buildCard).join('');

    // Filter logic
    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.filter-tag');
      if (!btn) return;

      [...filterBar.querySelectorAll('.filter-tag')].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const tag = btn.dataset.tag;
      [...grid.querySelectorAll('.project-card')].forEach(card => {
        if (tag === 'all') {
          card.classList.remove('hidden');
        } else {
          card.classList.toggle('hidden', !card.dataset.tags.includes(tag));
        }
      });
    });
  }

  // ── MAIN INIT ─────────────────────────────────────

  document.addEventListener('DOMContentLoaded', async () => {
    const projects = await loadProjects();

    if (projects.length === 0) {
      // Fallback: show a message in both possible containers
      ['carouselTrack', 'archiveGrid'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.innerHTML = '<p style="padding:2rem;color:var(--text-muted);font-style:italic;">No projects found. Make sure projects.json is in the same folder.</p>';
        }
      });
      return;
    }

    initCarousel(projects);
    initArchive(projects);
  });

})();
