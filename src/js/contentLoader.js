/* src/js/contentLoader.js */

const converter = new showdown.Converter();
converter.setFlavor('github');

async function fetchData(fileName) {
    try {
        const response = await fetch(`content/${fileName}.json`); 
        if (!response.ok) return (fileName === 'globals' || fileName === 'pages') ? {} : [];
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${fileName}:`, error);
        return (fileName === 'globals' || fileName === 'pages') ? {} : [];
    }
}

// =======================================================
// RENDERER: EVENTS (With Interactive Calendar)
// =======================================================
let currentCalDate = new Date();

async function loadEventsContent() {
    const rawEvents = await fetchData('events');
    const eventsData = rawEvents.events_list || [];
    window.eventsStore = eventsData;

    renderCalendar(eventsData);

    const eventsGrid = document.getElementById('events-grid');
    const sortedEvents = eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (eventsGrid) {
        if (sortedEvents.length === 0) {
            eventsGrid.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color: #777;">No upcoming events scheduled.</p>`;
        } else {
            eventsGrid.innerHTML = sortedEvents.map(item => createCardHtml(item, 'events')).join('');
        }
    }
}

function changeMonth(offset) {
    currentCalDate.setMonth(currentCalDate.getMonth() + offset);
    renderCalendar(window.eventsStore);
}
window.changeMonth = changeMonth;

function renderCalendar(events) {
    const container = document.getElementById('events-calendar-container');
    if (!container) return;

    const currentMonth = currentCalDate.getMonth();
    const currentYear = currentCalDate.getFullYear();
    
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let html = `
        <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin: 0;"><i class="far fa-calendar-alt" style="color:var(--uh-red); margin-right:10px;"></i> ${monthNames[currentMonth]} ${currentYear}</h3>
            <div class="calendar-controls" style="color: var(--uh-slate); font-size: 1.2rem;">
                <i class="fas fa-chevron-left cal-btn" onclick="changeMonth(-1)" style="cursor: pointer; margin-right: 15px; padding: 5px;" title="Previous Month"></i>
                <i class="fas fa-chevron-right cal-btn" onclick="changeMonth(1)" style="cursor: pointer; padding: 5px;" title="Next Month"></i>
            </div>
        </div>
        <div class="calendar-grid">
            <div class="calendar-day-name">Sun</div>
            <div class="calendar-day-name">Mon</div>
            <div class="calendar-day-name">Tue</div>
            <div class="calendar-day-name">Wed</div>
            <div class="calendar-day-name">Thu</div>
            <div class="calendar-day-name">Fri</div>
            <div class="calendar-day-name">Sat</div>
    `;

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = events.filter(e => {
            const eDate = new Date(e.date);
            const eYear = eDate.getUTCFullYear(); 
            const eMonth = eDate.getUTCMonth();
            const eDay = eDate.getUTCDate();
            return eDay === day && eMonth === currentMonth && eYear === currentYear;
        });

        const hasEvent = dayEvents.length > 0;
        let tooltip = '';

        if (hasEvent) {
            const eventItem = dayEvents[0]; 
            tooltip = `
                <div class="event-tooltip">
                    <h5>${eventItem.title}</h5>
                    <span class="tooltip-meta"><i class="far fa-clock"></i> ${eventItem.time || 'All Day'}</span>
                    <span class="tooltip-meta"><i class="fas fa-map-marker-alt"></i> ${eventItem.location || 'TBA'}</span>
                    <div style="margin-top:5px; font-size:0.7rem; color:#aaa;">Click for details</div>
                </div>
            `;
        }

        html += `
            <div class="calendar-day ${hasEvent ? 'has-event' : ''}" 
                 ${hasEvent ? `onclick="openDetailView(event, '${dayEvents[0].id}', 'events')"` : ''}>
                <span style="position:relative; z-index:2;">${day}</span>
                ${tooltip}
            </div>
        `;
    }
    html += `</div>`; 
    container.innerHTML = html;
}

// =======================================================
// RENDERERS: NEWS & OUTREACH
// =======================================================

async function loadNewsContent() {
    const rawNews = await fetchData('news');
    const newsData = rawNews.articles || [];
    window.newsStore = newsData;

    const newsGrid = document.getElementById('news-grid');
    const sortedNews = newsData.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (newsGrid) {
        newsGrid.innerHTML = sortedNews.map(item => createCardHtml(item, 'news')).join('');
    }
}

async function loadOutreachContent() {
    const rawOutreach = await fetchData('outreach');
    const outreachData = rawOutreach.programs || [];
    window.outreachStore = outreachData;

    const outreachGrid = document.getElementById('outreach-grid');
    const sortedOutreach = outreachData.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (outreachGrid) {
        outreachGrid.innerHTML = sortedOutreach.map(item => createCardHtml(item, 'outreach')).join('');
    }
}

function createCardHtml(item, type) {
    let metaIcon = 'calendar-alt';
    let btnText = 'Read Story';
    let metaText = new Date(item.date).toLocaleDateString();
    
    let placeholderLabel = "Update";
    let placeholderIcon = "newspaper"; 

    if (type === 'outreach') {
        metaIcon = 'heart';
        btnText = 'View Report';
        placeholderLabel = "Outreach";
        placeholderIcon = "hand-holding-heart";
        if(item.tags && item.tags.length > 0) metaText = item.tags[0]; 
    } else if (type === 'events') {
        metaIcon = 'clock';
        btnText = 'Event Details';
        placeholderLabel = "Event";
        placeholderIcon = "calendar-check";
        if (item.time) metaText += ` | ${item.time}`;
    } else {
        placeholderLabel = "News";
        placeholderIcon = "newspaper";
    }

    let categoryLabel = item.category || (item.tags && item.tags.length > 0 ? item.tags[0] : 'Update');

    let externalLinkHtml = '';
    if (item.link) {
        externalLinkHtml = `
            <div style="margin-top: 12px; border-top: 1px solid #eee; padding-top: 10px;">
                <a href="${item.link}" target="_blank" class="view-link" style="margin-left: 0;">
                    GO TO WEBSITE <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>
                </a>
            </div>
        `;
    }

    let imageHtml = '';
    if (item.image) {
        imageHtml = `<img src="${item.image}" alt="${item.title}" loading="lazy">`;
    } else {
        imageHtml = `
            <div class="placeholder-img">
                <i class="far fa-${placeholderIcon} placeholder-icon"></i>
                <span class="placeholder-label">${placeholderLabel}</span>
            </div>
        `;
    }

    return `
        <div class="news-card">
            <div class="news-img-wrapper">
                ${imageHtml}
            </div>
            <div class="news-content">
                <div class="news-meta">
                    <i class="far fa-${metaIcon}"></i> ${metaText}
                    <span style="margin:0 5px; opacity:0.5;">|</span> ${categoryLabel}
                </div>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-excerpt">${item.preview}</p>
                <div style="margin-top: auto;">
                    <a href="#" class="news-link" onclick="openDetailView(event, '${item.id}', '${type}')">
                        ${btnText} <i class="fas fa-arrow-right"></i>
                    </a>
                    ${externalLinkHtml}
                </div>
            </div>
        </div>
    `;
}

// =======================================================
// SHARED DETAIL VIEWER
// =======================================================
function openDetailView(e, itemId, type) {
    if (e) e.preventDefault();

    let dataStore;
    if (type === 'news') dataStore = window.newsStore;
    else if (type === 'outreach') dataStore = window.outreachStore;
    else if (type === 'events') dataStore = window.eventsStore;

    const item = dataStore ? dataStore.find(n => n.id === itemId || n.id == itemId) : null;
    if (!item) return;

    const containerId = `${type}-detail-content`;
    const detailContainer = document.getElementById(containerId);
    if (!detailContainer) return;

    let contentHtml = '';
    let heroImageHtml = '';
    
    if (item.image) {
        heroImageHtml = `<img src="${item.image}" alt="${item.title}">`;
    } else {
        let phIcon = 'newspaper';
        let phLabel = 'News';
        if (type === 'events') { phIcon = 'calendar-check'; phLabel = 'Event'; }
        if (type === 'outreach') { phIcon = 'hand-holding-heart'; phLabel = 'Outreach'; }

        heroImageHtml = `
            <div class="placeholder-img">
                <i class="far fa-${phIcon} placeholder-icon" style="font-size: 5rem; margin-bottom: 1rem;"></i>
                <span class="placeholder-label" style="font-size: 3rem;">${phLabel}</span>
            </div>
        `;
    }

    let fullTitle = item.title;
    let category = type.charAt(0).toUpperCase() + type.slice(1); 
    if (item.category) category = item.category;

    if (typeof item.body === 'object' && item.body !== null) {
        const b = item.body;
        if(b.full_title) fullTitle = b.full_title;
        if(b.category) category = b.category;
        if (b.lead_text) contentHtml += `<p class="article-lead">${b.lead_text}</p>`;

        if (b.content_blocks && Array.isArray(b.content_blocks)) {
            contentHtml += b.content_blocks.map(block => {
                if (block.type === 'quote') return `<div class="article-quote"><p>"${block.content}"</p>${block.author ? `<span>— ${block.author}</span>` : ''}</div>`;
                else if (block.type === 'highlight_box') return `<div class="highlight-box"><h3><i class="fas fa-info-circle"></i> ${block.title || 'Key Details'}</h3><ul>${block.items.map(li => `<li>${li}</li>`).join('')}</ul></div>`;
                else if (block.type === 'text') return `<div class="article-text">${converter.makeHtml(block.content || '')}</div>`;
                return '';
            }).join('');
        }
    } else {
        contentHtml = converter.makeHtml(item.body || '');
    }

    let extraMetaHtml = '';
    let linkSection = '';
    
    if (item.link) {
        linkSection = `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,0,0,0.1);">
                <a href="${item.link}" target="_blank" class="btn" style="background-color: var(--uh-red); color: white; text-decoration: none; display: inline-block;">
                    GO TO WEBSITE <i class="fas fa-external-link-alt" style="margin-left:8px;"></i>
                </a>
            </div>
        `;
    }

    if (type === 'events') {
        extraMetaHtml = `
            <div style="background: var(--uh-light-gray); padding: 15px; border-radius: 4px; margin-top: 20px; border-left: 4px solid var(--uh-red);">
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <div><strong><i class="far fa-clock text-uh-red"></i> Time:</strong> ${item.time || 'TBA'}</div>
                    <div><strong><i class="fas fa-map-marker-alt text-uh-red"></i> Location:</strong> ${item.location || 'TBA'}</div>
                </div>
                ${linkSection}
            </div>
        `;
    } else if (linkSection) {
        extraMetaHtml = `
            <div style="background: var(--uh-light-gray); padding: 15px; border-radius: 4px; margin-top: 20px; border-left: 4px solid var(--uh-red);">
                ${linkSection}
            </div>
        `;
    }

    detailContainer.innerHTML = `
        <article class="article-container">
            <div class="article-hero">
                 ${heroImageHtml}
                 <span class="article-category-badge">${category}</span>
            </div>
            <header class="article-header">
                <div class="article-meta-row">
                    <span><i class="far fa-calendar-alt"></i> ${new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <h1 class="article-title text-uh-red">${fullTitle}</h1>
                ${extraMetaHtml}
            </header>
            <div class="article-body">${contentHtml}</div>
            <div class="article-footer">
                 <a href="#" onclick="switchPage('${type}')" class="btn">Back to ${type.charAt(0).toUpperCase() + type.slice(1)}</a>
            </div>
        </article>
    `;
    switchPage(type + '-detail');
    window.scrollTo(0,0);
}
window.openDetailView = openDetailView;

// =======================================================
// RENDERER: OUTPUTS
// =======================================================

async function loadOutputsContent() {
    const rawPubs = await fetchData('publications');
    const publications = rawPubs.papers || [];
    renderAccordion(publications, 'publications-list', 'journal', true);

    const rawPatents = await fetchData('patents');
    const patents = rawPatents.patents || [];
    renderAccordion(patents, 'patents-list', 'inventors', true);

    const rawPres = await fetchData('presentations');
    const presentations = rawPres.talks || [];
    renderAccordion(presentations, 'presentations-list', 'conference', true);

    const rawAwards = await fetchData('awards');
    const awards = rawAwards.awards || [];
    renderAccordion(awards, 'awards-list', 'recipient', true);
}

function renderAccordion(data, containerId, subField, enableSearch = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const existingSearch = document.getElementById(`search-container-${containerId}`);
    if (existingSearch) existingSearch.remove();

    if (enableSearch) {
         const searchHTML = `
            <div id="search-container-${containerId}" class="search-container">
                <input type="text" id="search-${containerId}" class="search-input" placeholder="Search by title, name or keyword...">
                <i class="fas fa-search search-icon"></i>
            </div>
        `;
         const wrapper = document.createElement('div');
         wrapper.innerHTML = searchHTML;
         container.parentNode.insertBefore(wrapper, container);
         
         document.getElementById(`search-${containerId}`).addEventListener('input', (e) => {
             const term = e.target.value.toLowerCase();
             const filtered = data.filter(item => 
                 (item.title && item.title.toLowerCase().includes(term)) ||
                 (item.tags && item.tags.some(t => t.toLowerCase().includes(term))) ||
                 (item.authors && item.authors.toLowerCase().includes(term)) ||
                 (item.inventors && item.inventors.toLowerCase().includes(term)) ||
                 (item.presenter && item.presenter.toLowerCase().includes(term)) ||
                 (item.recipient && item.recipient.toLowerCase().includes(term)) ||
                 (item[subField] && item[subField].toLowerCase().includes(term)) ||
                 (item.year && item.year.toString().includes(term)) ||
                 (item.location && item.location.toLowerCase().includes(term))
             );
             renderAccordionList(filtered, container, subField, containerId);
         });
    }
    renderAccordionList(data, container, subField, containerId);
}

function renderAccordionList(data, container, subField, containerId) {
    const grouped = data.reduce((acc, item) => {
        let year = item.year;
        if (!year && item.date) year = new Date(item.date).getFullYear();
        if (!year) year = "Other";

        if (!acc[year]) acc[year] = [];
        acc[year].push(item);
        return acc;
    }, {});

    const years = Object.keys(grouped).sort((a, b) => b - a);
    let html = '';
    
    if (years.length === 0) {
        container.innerHTML = '<p style="padding:1rem; font-style:italic; color:#777;">No results found.</p>';
        return;
    }

    years.forEach((year, index) => {
        const items = grouped[year];
        const isOpen = index === 0 ? 'active' : ''; 
        const isShow = index === 0 ? 'show' : '';
        const icon = index === 0 ? 'fa-chevron-up' : 'fa-chevron-down';

        const limit = 5;
        const visibleItems = items.slice(0, limit);
        const hiddenItems = items.slice(limit);
        const hasHidden = hiddenItems.length > 0;

        const renderItem = (item) => {
            let extraInfo = '';
            const isAward = containerId === 'awards-list';

            if (!isAward) {
                if(item.authors) extraInfo += `<p class="pub-authors">Authors: ${item.authors}</p>`;
                if(item.inventors) extraInfo += `<p class="pub-authors">Inventors: ${item.inventors}</p>`;
                if(item.presenter) extraInfo += `<p class="pub-authors">Presenter: ${item.presenter}</p>`;
            } else {
                if(item.recipient) extraInfo += `<p class="pub-authors" style="color:var(--uh-red); font-weight:700;">${item.recipient}</p>`;
            }

            let linkHtml = '';
            if (item.link) {
                linkHtml = `<a href="${item.link}" target="_blank" class="view-link">VIEW</a>`;
            }

            // Logic: Don't show the "Inventors" list in the middle line for Patents
            // Because it's already shown in the 'extraInfo' block below.
            // We create an array of parts and join them to avoid leading/trailing pipes.
            let journalLineParts = [];
            
            // Part 1: Journal Name or Conference (Hidden for Patents)
            if (!isAward && subField !== 'inventors' && item[subField]) {
                journalLineParts.push(item[subField]);
            }
            
            // Part 2: Status
            if (item.status) {
                journalLineParts.push(item.status);
            }
            
            const journalText = journalLineParts.join(' | ');

            return `
            <div class="pub-item">
                <div class="pub-details">
                    <h4>${item.title} ${item.featured ? '<span class="tag" style="background: var(--uh-red); color: white;">Featured</span>' : ''}</h4>
                    <p class="pub-journal">
                        ${journalText}
                        ${linkHtml}
                    </p>
                    ${extraInfo}
                </div>
            </div>
            `;
        };

        html += `
            <div class="accordion-year-group">
                <div class="accordion-header ${isOpen}" onclick="toggleAccordion(this)">
                    <span>${year}</span>
                    <i class="fas ${icon}"></i>
                </div>
                <div class="accordion-content ${isShow}">
                    <div class="visible-list">
                        ${visibleItems.map(renderItem).join('')}
                    </div>
                    ${hasHidden ? `
                        <div class="hidden-list" style="display:none;">
                            ${hiddenItems.map(renderItem).join('')}
                        </div>
                        <button class="toggle-btn" onclick="toggleMore(this)">View All (${items.length}) <i class="fas fa-plus"></i></button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.toggleAccordion = function(header) {
    header.classList.toggle('active');
    const content = header.nextElementSibling;
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        header.querySelector('i').className = 'fas fa-chevron-down';
    } else {
        content.classList.add('show');
        header.querySelector('i').className = 'fas fa-chevron-up';
    }
}

window.toggleMore = function(btn) {
    const hiddenDiv = btn.previousElementSibling;
    const isHidden = hiddenDiv.style.display === 'none';
    hiddenDiv.style.display = isHidden ? 'block' : 'none';
    btn.innerHTML = isHidden ? 'Show Less <i class="fas fa-minus"></i>' : `View All <i class="fas fa-plus"></i>`;
}

// =======================================================
// RENDERER: TEAM
// =======================================================
async function loadTeamContent() {
    const rawTeam = await fetchData('team');
    const teamData = rawTeam.members || [];

    const pis = teamData.filter(m => m.is_pi);
    const groupMembers = teamData.filter(m => !m.is_pi);

    const renderMembers = (members, isPI) => members.map(member => `
        <div class="profile-card">
            ${member.image ? `<div class="profile-img-container"><img src="${member.image}" alt="${member.name}" class="profile-img" loading="lazy"></div>` : ''}
            <div class="profile-info">
                <h4 class="profile-name">${member.name}</h4>
                ${isPI && member.title_detail ? `<div class="profile-role" style="font-weight: 700;">${member.role}</div><p style="font-size: 0.9rem; color: var(--uh-slate); margin-top: 5px; margin-bottom: 10px; line-height: 1.3;">${member.title_detail.replace(/\n/g, '<br>')}</p>` : ''}
                ${!isPI ? `
                    <div class="profile-role" style="font-weight: 700; margin-bottom: 0;">${member.role}</div>
                    ${member.advisor ? `
                        <div class="student-advisor">
                            <span class="advisor-label">Advisor:</span> <span class="advisor-name">${member.advisor}</span>
                        </div>` : ''}
                    <p style="font-size: 0.8rem; color: var(--uh-slate); margin-top: 5px; line-height: 1.3;">${member.department || ''}<br>${member.university || ''}</p>
                ` : ''}
                <p style="font-size: ${isPI ? '0.9rem' : '0.85rem'}; margin-top: ${isPI ? '10px' : '10px'};">${member.bio || ''}</p>
                ${member.tags && member.tags.length > 0 ? `<div class="profile-tags">${member.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                <div style="margin-top: 15px; display: flex; gap: 15px; align-items: center;">
                    ${member.email ? `<a href="mailto:${member.email}" title="Email"><i class="fas fa-envelope text-uh-red fa-lg"></i></a>` : ''}
                    ${member.website ? `<a href="${member.website}" target="_blank" title="Lab Website"><i class="fas fa-globe text-uh-red fa-lg"></i></a>` : ''}
                    ${member.scholar ? `<a href="${member.scholar}" target="_blank" title="Google Scholar"><i class="fas fa-graduation-cap text-uh-red fa-lg"></i></a>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    const piGrid = document.getElementById('team-pis');
    if (piGrid) piGrid.innerHTML = renderMembers(pis, true);

    const groupGrid = document.getElementById('team-group');
    if (groupGrid) {
        groupGrid.innerHTML = groupMembers.map(s => `
            <div class="student-card">
                <div class="student-img-container">
                    <img src="${s.image || 'public/images/default-placeholder.jpg'}" class="student-img" alt="${s.name}" loading="lazy">
                </div>
                <div class="student-info">
                    <div class="student-name">${s.name}</div>
                    <div class="student-role">${s.role}</div>
                    ${s.advisor ? `
                        <div class="student-advisor">
                            <span class="advisor-label">Advisor:</span> <span class="advisor-name">${s.advisor}</span>
                        </div>
                    ` : ''}
                    <div class="student-bio">${s.bio || ''}</div>
                </div>
            </div>
        `).join('');
    }
}

// =======================================================
// RENDERERS: GENERAL
// =======================================================
async function loadHomePageContent() {
    const pageData = await fetchData('pages');
    const home = pageData.home || {};
    
    const heroContent = document.getElementById('hero-content');
    if (heroContent && home.hero_title) {
        heroContent.innerHTML = `
            <h2>${home.hero_title}</h2>
            <p>${home.hero_text}</p>
            <button class="btn" style="background: white; color: var(--uh-red); border-color: white;" onclick="switchPage('research')">Explore Our Research</button>
        `;
    }

    const sliderContainer = document.getElementById('hero-slider-container');
    const indicatorContainer = document.getElementById('slider-indicators');
    if (sliderContainer && indicatorContainer && home.slides) {
        sliderContainer.innerHTML = home.slides.map((slide, index) => `
            <div class="hero-slide ${index === 0 ? 'active' : ''}">
                <img src="${slide.image}" alt="${slide.alt}" loading="lazy">
            </div>
        `).join('');

        indicatorContainer.innerHTML = home.slides.map((slide, index) => `
            <div class="indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
        `).join('');
        if (typeof initializeSlider === 'function') initializeSlider();
    }

    const directorSection = document.getElementById('director-message-section');
    if (directorSection && home.director) {
        directorSection.innerHTML = `
            <div><img src="${home.director.photo}" alt="${home.director.name}" class="director-img" loading="lazy"></div>
            <div>
                <h3 class="text-uh-red">Director's Message</h3>
                <p class="mission-text" style="margin: 20px 0;">${home.director.message}</p>
                <p><strong>${home.director.name}</strong><br>${home.director.role}</p>
            </div>
        `;
    }

    const rawEvents = await fetchData('events');
    const eventsData = rawEvents.events_list || [];
    const eventPreview = document.getElementById('event-preview-grid');
    if (eventPreview) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const futureEvents = eventsData
            .filter(e => new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        if (futureEvents.length === 0) {
             eventPreview.innerHTML = `<p class="text-center" style="grid-column: 1/-1; opacity: 0.7;">No upcoming events scheduled at this time.</p>`;
        } else {
            eventPreview.innerHTML = futureEvents.map(item => `
                <div class="aim-card">
                    <div style="background: var(--uh-red); color: white; display: inline-block; padding: 5px 15px; font-weight: bold; margin-bottom: 10px;">
                        ${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric'}).toUpperCase()}
                    </div>
                    <h4>${item.title}</h4>
                    <p>${item.preview}</p>
                    <div style="font-size:0.85rem; color:var(--uh-slate); margin-bottom:10px;">
                        <i class="far fa-clock"></i> ${item.time || 'TBA'}
                    </div>
                    <a href="#" onclick="switchPage('events')" class="text-uh-red" style="font-weight:700; font-size:0.9rem;">View Calendar &rarr;</a>
                </div>
            `).join('');
        }
    }
}

async function loadResearchContent() {
    const pageData = await fetchData('pages');
    const aims = pageData.research_aims || [];
    const container = document.getElementById('research-aims-container');
    
    if (container) {
        container.innerHTML = aims.map(aim => `
            <div class="aim-card">
                <span class="aim-number">${aim.number}</span>
                <h3>${aim.title}</h3>
                ${aim.images && aim.images.length > 0 ? `<div class="aim-gallery-scroll">${aim.images.map(img => `<img src="${img}" alt="Research Visual" loading="lazy">`).join('')}</div>` : (aim.image ? `<img src="${aim.image}" style="width:100%; border-radius:4px; margin-bottom:15px;" loading="lazy">` : '')}
                <div class="aim-description">
                    ${converter.makeHtml(aim.description)}
                    ${aim.faculty ? `<p style="margin-top:15px; font-size:1rem; line-height:1.6;"><strong style="color:var(--uh-red);">Associated faculty members:</strong><br>${aim.faculty}</p>` : ''}
                </div>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee;">
                    ${aim.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                </div>
            </div>
        `).join('');
    }
}

async function loadAdvisoryContent() {
    const globals = await fetchData('globals');
    const board = globals.advisory_board || [];
    const container = document.getElementById('advisory-board-grid');
    if (container) {
        let html = board.map(m => `
            <div class="profile-card text-center">
                 <div class="profile-img-container"><img src="${m.image}" class="profile-img" loading="lazy"></div>
                 <div class="profile-info">
                     <h4 class="profile-name">${m.name}</h4>
                     <p class="profile-role">${m.role}</p>
                     ${m.company_icon ? `<img src="${m.company_icon}" style="height:30px; margin:10px auto; opacity:0.8;" alt="Company Logo">` : ''}
                 </div>
            </div>
        `).join('');
        if (globals.advisory_group_image) {
            html += `<div style="grid-column: 1 / -1; margin-top: 4rem;">
                <h3 class="category-title" style="border-left:none; padding-left:0; text-align:center;">Advisory Board Group</h3>
                <img src="${globals.advisory_group_image}" style="width:100%; border-radius:4px; box-shadow: var(--shadow-card);" alt="Advisory Board Group Photo">
            </div>`;
        }
        container.innerHTML = html;
    }
}

async function loadImpactStats() {
    const globals = await fetchData('globals');
    const stats = globals.impact_stats || [];
    const container = document.getElementById('impact-stats-grid');
    if (container) {
        container.innerHTML = stats.map(stat => `
            <div>
                <h2 style="font-size: 3rem; color: ${stat.color || '#F4D03F'};">${stat.value}</h2>
                <p>${stat.label}</p>
            </div>
        `).join('');
    }
}

async function loadContactContent() {
    const globals = await fetchData('globals');
    const contact = globals.contact || {};
    const container = document.getElementById('contact-info-grid');
    const aboutContactPreview = document.getElementById('about-contact-preview');
    if (container) {
        container.innerHTML = `
            <div>
                <h4>Mailing Address</h4>
                <p>${contact.address_line1}<br>${contact.address_line2}<br>${contact.address_line3}<br>${contact.address_line4}</p>
                <h4 style="margin-top: 20px;">Email</h4>
                <p>${contact.email}</p>
                <h4 style="margin-top: 20px;">Phone</h4>
                <p>${contact.phone}</p>
                ${contact.linkedin ? `<h4 style="margin-top:20px;">Social</h4><a href="${contact.linkedin}" target="_blank" class="social-link"><i class="fab fa-linkedin"></i></a>` : ''}
            </div>
            <div style="background: #eee; height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 4px; overflow: hidden;">
                <iframe src="${contact.map_embed_url}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        `;
    }
    if (aboutContactPreview) {
         aboutContactPreview.innerHTML = `<p style="font-size: 0.9rem;">${contact.address_line1}<br>${contact.address_line2}<br>${contact.address_line3}<br>${contact.address_line4}</p>`;
    }
}

function loadContent(pageId) {
    if (typeof loadImpactStats === 'function') loadImpactStats();
    if (typeof loadContactContent === 'function') loadContactContent(); 
    if (pageId === 'home') loadHomePageContent();
    else if (pageId === 'team') loadTeamContent();
    else if (pageId === 'outputs') loadOutputsContent(); 
    else if (pageId === 'research') loadResearchContent();
    else if (pageId === 'advisory') loadAdvisoryContent();
    else if (pageId === 'news') loadNewsContent();
    else if (pageId === 'outreach') loadOutreachContent();
    else if (pageId === 'events') loadEventsContent(); 
}
window.loadContent = loadContent;