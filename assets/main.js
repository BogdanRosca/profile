(() => {
  const root = document.documentElement;

  // Theme: explicit choice wins, otherwise follow the OS.
  const THEME_KEY = "theme";
  const storedTheme = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
  if (storedTheme) root.dataset.theme = storedTheme;

  document.querySelector(".theme-toggle")?.addEventListener("click", () => {
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch {}
  });

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");
  toggle?.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links?.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Header border + active nav link
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

  // Reveal on scroll + count-up stats
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const revealTargets = document.querySelectorAll(".section-head, .card, .principles li, .company, .stack-group, .cert, .quote, .stat, .contact-card");
  if (!reduceMotion && "IntersectionObserver" in window) {
    revealTargets.forEach((el) => el.classList.add("reveal"));
    const revealer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        revealer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => revealer.observe(el));
  }

  // Completion badge popup
  const badgeModal = document.querySelector(".badge-modal");
  if (badgeModal) {
    const img = badgeModal.querySelector(".badge-modal-img");
    document.querySelectorAll(".cert-view").forEach((btn) =>
      btn.addEventListener("click", () => {
        const { badge, pdf, title } = btn.dataset;
        badgeModal.querySelector("h3").textContent = title;
        img.src = badge;
        img.alt = `${title} completion badge`;
        badgeModal.querySelector(".badge-modal-pdf").href = pdf;
        badgeModal.showModal();
      })
    );
    badgeModal.querySelector(".badge-modal-close").addEventListener("click", () => badgeModal.close());
    badgeModal.addEventListener("click", (e) => { if (e.target === badgeModal) badgeModal.close(); });
  }

  // Print-as-CV: expand every role and the learning group so the PDF contains the full history.
  let closedRoles = [];
  addEventListener("beforeprint", () => {
    closedRoles = [...document.querySelectorAll("details.role:not([open]), details.cert-group:not([open])")];
    closedRoles.forEach((d) => (d.open = true));
  });
  addEventListener("afterprint", () => closedRoles.forEach((d) => (d.open = false)));
  document.querySelector("[data-print]")?.addEventListener("click", () => print());

  // Public GitHub repos (section stays hidden if there is nothing to show)
  const repoGrid = document.querySelector("[data-github-user]");
  if (repoGrid) {
    const user = repoGrid.dataset.githubUser;
    fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=12`)
      .then((r) => (r.ok ? r.json() : []))
      .then((repos) => {
        const HIDDEN = ["profile", "replit-project"];
        const shown = repos.filter((r) => !r.fork && !HIDDEN.includes(r.name) && r.description).slice(0, 6);
        if (!shown.length) return;
        repoGrid.replaceChildren(...shown.map((r) => {
          const a = document.createElement("a");
          a.className = "repo";
          a.href = r.html_url;
          a.target = "_blank";
          a.rel = "noopener";
          const h = document.createElement("h3");
          h.textContent = r.name;
          const p = document.createElement("p");
          p.textContent = r.description;
          const meta = document.createElement("div");
          meta.className = "repo-meta";
          meta.textContent = [r.language, r.stargazers_count ? `★ ${r.stargazers_count}` : ""].filter(Boolean).join("  ·  ");
          a.append(h, p, meta);
          return a;
        }));
        repoGrid.closest("section").hidden = false;
      })
      .catch(() => {});
  }

  // Tool marquee: built from the Stack section so the two never drift apart.
  const track = document.querySelector("[data-marquee]");
  if (track) {
    const LOGOS = {
      "Claude Code": "claude", "MCP": "modelcontextprotocol", "GitHub Copilot": "githubcopilot", "Cursor": "cursor",
      "Pytest": "pytest", "Cypress": "cypress", "Appium": "appium", "WebdriverIO": "webdriverio",
      "Robot Framework": "robotframework", "Radish / BDD": "cucumber", "Tricentis": "tricentis",
      "Python": "python", "TypeScript": "typescript", "JavaScript": "javascript",
      "GitHub Actions": "githubactions", "Docker": "docker", "Kubernetes": "kubernetes", "Argo CD": "argo",
      "Jenkins": "jenkins", "RabbitMQ": "rabbitmq", "Postgres": "postgresql", "FastAPI": "fastapi",
      "React": "react", "Postman": "postman", "TestRail": "testrail", "JIRA": "jira", "Confluence": "confluence",
    };
    const names = [...document.querySelectorAll("#stack .tags li")].map((li) => li.textContent.trim());
    const makeItem = (name) => {
      const li = document.createElement("li");
      const icon = document.createElement("span");
      if (LOGOS[name]) {
        icon.className = "tool-logo";
        const url = `url("assets/logos/${LOGOS[name]}.svg")`;
        icon.style.webkitMaskImage = url;
        icon.style.maskImage = url;
      } else {
        icon.className = "tool-logo tool-mono";
        icon.textContent = name.replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 2);
      }
      icon.setAttribute("aria-hidden", "true");
      li.append(icon, name);
      return li;
    };
    // Two identical halves let the track loop seamlessly at -50%.
    const copy = names.map(makeItem);
    const echo = names.map(makeItem);
    echo.forEach((li) => li.setAttribute("aria-hidden", "true"));
    track.replaceChildren(...copy, ...echo);
  }

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
