/* src/js/contentLoader.js */

// Initialize Markdown Converter
const converter = new showdown.Converter();
converter.setFlavor('github');

// Global Constants
const PLACEHOLDER_IMG_HUMAN = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00LTJ6Ii8+PC9zdmc+";

/**
 * Utility: Fetch JSON content with Error Handling
 */
async function fetchData(fileName) {
    try {
        const response = await fetch(`content/${fileName}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`[ContentLoader] Failed to fetch ${fileName}:`, error);
        return ['globals', 'pages'].includes(fileName) ? {} : [];
    }
}

// =======================================================
// RENDERER: TEAM
// =======================================================
async function loadTeamContent() {
    const rawTeam = await fetchData('team');
    const teamData = rawTeam.members || [];

    const pis = teamData.filter(m => m.is_pi);
    // SORT FIX: Alphabetical sort for students
    const groupMembers = teamData.filter(m => !m.is_pi).sort((a, b) => a.name.localeCompare(b.name));

    const renderMembers = (members, isPI) => members.map(member => `
        <div class="profile-card">
            ${member.image ? `<div class="profile-img-container"><img src="${member.image}" alt="${member.name}" class="profile-img" loading="lazy"></div>` : ''}
            <div class="profile-info">
                <h4 class="profile-name">${member.name}</h4>
                
                ${/* USE CSS CLASS */ ''}
                ${isPI && member.role === 'Center Director' ? `<div class="profile-role pi-director-label">${member.role}</div>` : ''}
                
                ${isPI && member.title_detail ? `<p class="pi-title-detail">${member.title_detail.replace(/\n/g, '<br>')}</p>` : ''}
                
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
// 2. EVENTS RENDERER (Calendar System)
// =======================================================
let currentCalDate = new Date();

async function loadEventsContent() {
    const rawEvents = await fetchData('events');
    const eventsData = rawEvents.events_list || [];
    window.eventsStore = eventsData; // Global store for detail view

    renderCalendar(eventsData);

    const eventsGrid = document.getElementById('events-grid');
    if (eventsGrid) {
        const sortedEvents = eventsData.sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedEvents.length === 0) {
            eventsGrid.innerHTML = `<p class="empty-state-msg">No upcoming events scheduled.</p>`;
        } else {
            eventsGrid.innerHTML = sortedEvents.map(item => createCardHtml(item, 'events')).join('');
        }
    }
}

window.changeMonth = function(offset) {
    currentCalDate.setMonth(currentCalDate.getMonth() + offset);
    renderCalendar(window.eventsStore || []);
};

// =======================================================
// 6. CALENDAR WIDGET RENDERER (Updated for Recurrence)
// =======================================================
function renderCalendar(events) {
    const container = document.getElementById('events-calendar-container');
    if (!container) return;

    // Use global currentCalDate (make sure this is initialized in your code)
    const currentMonth = currentCalDate.getMonth();
    const currentYear = currentCalDate.getFullYear();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let calendarHtml = `
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

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        calendarHtml += `<div class="calendar-day empty"></div>`;
    }

    // Days with events
    for (let day = 1; day <= daysInMonth; day++) {
        // Create a precise date object for this specific grid cell
        const cellDate = new Date(currentYear, currentMonth, day);

        const dayEvents = events.filter(e => {
            // Force local time to prevent timezone issues (e.g., "2026-06-01" -> "2026-06-01T00:00:00")
            const eDate = new Date(e.date + 'T00:00:00');

            // 1. Skip if the event hasn't started yet
            if (cellDate < eDate) return false;

            // 2. Exact Match (One-time event)
            // Note: We use .toDateString() to compare dates ignoring time
            if (eDate.toDateString() === cellDate.toDateString()) return true;

            // 3. Weekly Recurrence
            if (e.recurrence === 'weekly') {
                return eDate.getDay() === cellDate.getDay();
            }

            // 4. Monthly Recurrence
            if (e.recurrence === 'monthly') {
                return eDate.getDate() === day;
            }

            // 5. Yearly Recurrence
            if (e.recurrence === 'yearly') {
                return eDate.getMonth() === currentMonth && eDate.getDate() === day;
            }

            return false;
        });

        const hasEvent = dayEvents.length > 0;
        let tooltip = '';

        if (hasEvent) {
            const evt = dayEvents[0];
            const extraCount = dayEvents.length - 1;
            
            tooltip = `
                <div class="event-tooltip">
                    <h5>${evt.title}</h5>
                    <span class="tooltip-meta"><i class="far fa-clock"></i> ${evt.time || 'All Day'}</span>
                    <span class="tooltip-meta"><i class="fas fa-map-marker-alt"></i> ${evt.location || 'TBA'}</span>
                    ${extraCount > 0 ? `<div style="margin-top:4px; font-weight:bold; color:var(--uh-red);">+${extraCount} more</div>` : ''}
                    <div style="margin-top:5px; font-size:0.7rem; color:#aaa;">Click for details</div>
                </div>`;
        }

        calendarHtml += `
            <div class="calendar-day ${hasEvent ? 'has-event' : ''}" 
                 ${hasEvent ? `onclick="openDetailView(event, '${dayEvents[0].id}', 'events')"` : ''}>
                <span style="position:relative; z-index:2;">${day}</span>
                ${tooltip}
            </div>`;
    }
    
    calendarHtml += `</div>`;
    container.innerHTML = calendarHtml;
}

// =======================================================
// 3. RESEARCH RENDERER (Optimized)
// =======================================================
async function loadResearchContent() {
    // Load Pages AND Team data simultaneously for faculty linking
    const [pageData, teamData] = await Promise.all([
        fetchData('pages'),
        fetchData('team')
    ]);
    
    const aims = pageData.research_aims || [];
    const container = document.getElementById('research-aims-container');
    const members = teamData.members || [];
    const SHOW_AIM_NUMBERS = false;

    if (container) {
        container.innerHTML = aims.map(aim => {
            // Media Logic
            let mediaHtml = '';
            if (aim.gallery && aim.gallery.length > 0) {
                const galleryItems = aim.gallery.map(item => {
                    const isVideo = item.src.endsWith('.mp4') || item.src.endsWith('.webm');
                    const mediaTag = isVideo 
                        ? `<video src="${item.src}" class="aim-media" autoplay loop muted playsinline></video>`
                        : `<img src="${item.src}" alt="${item.caption || 'Visual'}" class="aim-media" loading="lazy">`;
                    
                    return `
                        <div class="aim-image-card">
                            <div class="aim-media-stage">${mediaTag}</div>
                            <div class="aim-img-caption">${item.caption || ''}</div>
                        </div>`;
                }).join('');
                mediaHtml = `<div class="aim-image-grid">${galleryItems}</div>`;
            } else if (aim.image) {
                mediaHtml = `<img src="${aim.image}" style="width:100%; border-radius:4px; margin-bottom:15px;" loading="lazy">`;
            }

            // Faculty Matching Logic
            let facultyHtml = '';
            if (aim.faculty) {
                const associatedFaculty = aim.faculty.split(',').map(nameStr => {
                    const cleanName = nameStr.trim();
                    const member = members.find(m => m.name.includes(cleanName));
                    if (member) {
                        return `<li>
                                    <span>${member.name}</span>
                                    ${member.website ? `<a href="${member.website}" target="_blank" title="Visit Lab Website" style="color:var(--uh-red); margin-left:5px;"><i class="fas fa-globe"></i></a>` : ''}
                                </li>`;
                    }
                    return `<li>${cleanName}</li>`;
                }).join('');

                facultyHtml = `
                    <div style="margin-top: 20px;">
                        <strong style="color:var(--uh-red); display:block; margin-bottom:10px;">Associated PIs:</strong>
                        <ul class="aim-faculty-list">${associatedFaculty}</ul>
                    </div>`;
            }

            return `
                <div class="aim-card" id="aim-${aim.number}">
                    ${SHOW_AIM_NUMBERS ? `<span class="aim-number">${aim.number}</span>` : ''}
                    <h3>${aim.title}</h3>
                    ${mediaHtml}
                    <div class="aim-description">
                        ${converter.makeHtml(aim.description)}
                        ${facultyHtml}
                    </div>
                    <div class="aim-tags-block">
                        ${(aim.tags || []).map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// =======================================================
// 4. NEWS & OUTREACH RENDERER
// =======================================================
async function loadNewsContent() {
    const rawNews = await fetchData('news');
    const newsData = rawNews.articles || [];
    window.newsStore = newsData;

    const newsGrid = document.getElementById('news-grid');
    if (newsGrid) {
        newsGrid.innerHTML = newsData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(item => createCardHtml(item, 'news'))
            .join('');
    }
}

async function loadOutreachContent() {
    const rawOutreach = await fetchData('outreach');
    const outreachData = rawOutreach.programs || [];
    window.outreachStore = outreachData;

    const outreachGrid = document.getElementById('outreach-grid');
    if (outreachGrid) {
        outreachGrid.innerHTML = outreachData
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(item => createCardHtml(item, 'outreach'))
            .join('');
    }
}

function createCardHtml(item, type) {
    let config = { icon: 'calendar-alt', btnText: 'Read Story', phLabel: 'News', phIcon: 'newspaper' };
    if (type === 'outreach') config = { icon: 'heart', btnText: 'View Report', phLabel: 'Outreach', phIcon: 'hand-holding-heart' };
    if (type === 'events') config = { icon: 'clock', btnText: 'Event Details', phLabel: 'Event', phIcon: 'calendar-check' };

    let metaDisplay = new Date(item.date).toLocaleDateString();
    if (type === 'events' && item.time) metaDisplay += ` | ${item.time}`;
    if (type === 'outreach' && item.tags && item.tags.length) metaDisplay = item.tags[0];

    const categoryLabel = item.category || (item.tags && item.tags.length > 0 ? item.tags[0] : 'Update');

    const imageHtml = item.image 
        ? `<img src="${item.image}" alt="${item.title}" loading="lazy">`
        : `<div class="placeholder-img">
             <i class="far fa-${config.phIcon} placeholder-icon"></i>
             <span class="placeholder-label">${config.phLabel}</span>
           </div>`;

    return `
        <div class="news-card">
            <div class="news-img-wrapper">${imageHtml}</div>
            <div class="news-content">
                <div class="news-meta">
                    <i class="far fa-${config.icon}"></i> ${metaDisplay}
                    <span style="margin:0 5px; opacity:0.5;">|</span> ${categoryLabel}
                </div>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-excerpt">${item.preview}</p>
                <div style="margin-top: auto;">
                    <a href="#" class="news-link" onclick="openDetailView(event, '${item.id}', '${type}')">
                        ${config.btnText} <i class="fas fa-arrow-right"></i>
                    </a>
                    ${item.link && type !== 'events' ? `
                        <div style="margin-top: 12px; border-top: 1px solid #eee; padding-top: 10px;">
                            <a href="${item.link}" target="_blank" class="view-link" style="margin-left: 0;">
                                GO TO WEBSITE <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>
                            </a>
                        </div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// =======================================================
// 5. DETAIL VIEW (Popup/Page Switch)
// =======================================================
window.openDetailView = async function(e, itemId, type) {
    if (e) e.preventDefault();

    // 1. LAZY LOAD DATA
    if (!window[`${type}Store`]) {
        try {
            const raw = await fetchData(type);
            window[`${type}Store`] = raw.events_list || raw.articles || raw.programs || [];
        } catch (err) {
            console.error("Failed to load data for detail view", err);
            return;
        }
    }

    // 2. FIND THE ITEM
    const item = window[`${type}Store`].find(n => n.id == itemId); 
    if (!item) return console.error("Item not found:", itemId);

    const containerId = `${type}-detail-content`;
    const detailContainer = document.getElementById(containerId);
    if (!detailContainer) return;

    // 3. PARSE CONTENT BLOCKS
    let contentHtml = '';
    
    // Helper to safely convert Markdown if the converter exists
    const safeMarkdown = (text) => (typeof converter !== 'undefined' ? converter.makeHtml(text || '') : text);

    if (typeof item.body === 'object' && item.body !== null) {
        const b = item.body;
        
        // A. Lead Text
        if (b.lead_text) {
            contentHtml += `<p class="article-lead">${b.lead_text}</p>`;
        }
        
        // B. Loop through Blocks
        if (Array.isArray(b.content_blocks)) {
            contentHtml += b.content_blocks.map(block => {
                
                // --- BLOCK: PEOPLE GRID (Images, Videos & Custom Columns) ---
                if (block.type === 'people_grid') {
                    const gridItems = block.items.map(person => {
                        let mediaHtml = '';
                        
                        // 1. Video (Controls enabled, no autoplay)
                        if (person.video) {
                            const posterAttr = person.image ? `poster="${person.image}"` : '';
                            mediaHtml = `
                                <video 
                                    src="${person.video}" 
                                    class="person-media" 
                                    controls 
                                    preload="metadata" 
                                    playsinline 
                                    ${posterAttr}>
                                </video>`;
                        } 
                        // 2. Image Only
                        else if (person.image) {
                            mediaHtml = `<img src="${person.image}" alt="${person.name}" class="person-media" loading="lazy">`;
                        } 
                        // 3. Fallback Placeholder
                        else {
                            mediaHtml = `<div class="person-placeholder"><i class="fas fa-user"></i></div>`;
                        }

                        return `
                            <div class="person-mini-card">
                                <div class="person-img-wrapper">
                                    ${mediaHtml}
                                </div>
                                <div class="person-info">
                                    <h4 class="person-name">${person.name}</h4>
                                    <div class="person-role">${person.role}</div>
                                    ${person.caption ? `<p class="person-caption">${person.caption}</p>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('');

                    // Logic to check if user wants a specific number of columns
                    const customStyle = block.columns 
                        ? `style="grid-template-columns: repeat(${block.columns}, 1fr);"` 
                        : ''; 

                    return `
                        <div class="people-grid-section">
                            ${block.title ? `<h3 class="text-uh-red" style="margin-bottom:0.5rem; border:none; padding-left:0;">${block.title}</h3>` : ''}
                            ${block.description ? `<p style="margin-bottom:1.5rem; font-style:italic; color:#666;">${block.description}</p>` : ''}
                            
                            <div class="people-grid-container" ${customStyle}>
                                ${gridItems}
                            </div>
                        </div>`;
                }

                // --- BLOCK: STANDALONE VIDEO ---
                if (block.type === 'video') {
                    return `
                        <figure class="article-video-wrapper">
                            <video 
                                src="${block.src}" 
                                controls 
                                preload="metadata" 
                                playsinline 
                                ${block.poster ? `poster="${block.poster}"` : ''}>
                                Your browser does not support the video tag.
                            </video>
                            ${block.caption ? `<figcaption><i class="fas fa-play-circle"></i> ${block.caption}</figcaption>` : ''}
                        </figure>
                    `;
                }

                // --- BLOCK: QUOTE ---
                if (block.type === 'quote') {
                    return `
                        <div class="article-quote">
                            <p>"${block.content}"</p>
                            ${block.author ? `<span>— ${block.author}</span>` : ''}
                        </div>`;
                }

                // --- BLOCK: HIGHLIGHT BOX ---
                if (block.type === 'highlight_box') {
                    return `
                        <div class="highlight-box">
                            <h3>${block.title}</h3>
                            <ul>${block.items.map(i => `<li>${i}</li>`).join('')}</ul>
                        </div>`;
                }

                // --- BLOCK: LIST (Bullet Points) ---
                if (block.type === 'list') {
                    const listItems = block.items.map(li => `<li>${li}</li>`).join('');
                    return `
                        <div class="highlight-box" style="border-left-color: var(--uh-slate); background: #fff; border: 1px solid #eee; border-left: 4px solid var(--uh-slate);">
                            <ul>${listItems}</ul>
                        </div>`;
                }

                // --- BLOCK: SECTION HEADER ---
                if (block.type === 'header') {
                    return `<h3 class="text-uh-red" style="margin-top: 2.5rem; border-left: none; padding-left: 0;">${block.content}</h3>`;
                }

                // --- BLOCK: STANDARD TEXT ---
                if (block.type === 'text') {
                    return `<div class="article-text">${safeMarkdown(block.content)}</div>`;
                }

                return '';
            }).join('');
        }
    } else {
        // Fallback for simple string bodies
        contentHtml = safeMarkdown(item.body || '');
    }

    // 4. PREPARE TEMPLATE VARIABLES
    const heroImageHtml = item.image 
        ? `<img src="${item.image}" alt="${item.title}">` 
        : `<div class="placeholder-img" style="height:300px"><span class="placeholder-label">${type.toUpperCase()}</span></div>`;

    const captionHtml = (item.body && item.body.image_caption)
        ? `<div class="article-category-badge" style="bottom:0; left:0; width:100%; padding:10px; background:rgba(0,0,0,0.7); font-size:0.8rem; text-transform:none;">${item.body.image_caption}</div>`
        : `<span class="article-category-badge">${item.category || type}</span>`;

    const displayTitle = (item.body && item.body.full_title) ? item.body.full_title : item.title;

    // 5. INJECT HTML
    detailContainer.innerHTML = `
        <article class="article-container">
            <div class="article-hero">
                 ${heroImageHtml}
                 ${captionHtml}
            </div>
            
            <header class="article-header">
                <div class="article-meta-row">
                    <span><i class="far fa-calendar-alt"></i> ${new Date(item.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <h1 class="article-title text-uh-red">${displayTitle}</h1>
                
                ${type === 'events' ? `
                    <div style="background: var(--uh-light-gray); padding: 15px; border-radius: 4px; margin-top: 20px; border-left: 4px solid var(--uh-red);">
                        <div><strong><i class="far fa-clock text-uh-red"></i> Time:</strong> ${item.time || 'TBA'}</div>
                        <div><strong><i class="fas fa-map-marker-alt text-uh-red"></i> Location:</strong> ${item.location || 'TBA'}</div>
                    </div>` : ''}
                
                ${item.link ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0,0,0,0.1);">
                        <a href="${item.link}" target="_blank" class="btn" style="background-color: var(--uh-red); color: white;">GO TO WEBSITE <i class="fas fa-external-link-alt"></i></a>
                    </div>` : ''}
            </header>
            
            <div class="article-body">
                ${contentHtml}
            </div>
            
            <div class="article-footer">
                 <a href="#" onclick="switchPage('${type}')" class="btn">Back to ${type.charAt(0).toUpperCase() + type.slice(1)}</a>
            </div>
        </article>
    `;

    // 6. SWITCH PAGE & SCROLL
    if (typeof switchPage === 'function') switchPage(`${type}-detail`);
    window.scrollTo({ top: 0, behavior: 'auto' });
};

// =======================================================
// 6. ADVISORY BOARD & OUTPUTS
// =======================================================
async function loadAdvisoryContent() {
    const globals = await fetchData('globals');
    let board = globals.advisory_board || [];
    
    board.sort((a, b) => {
        const lastA = a.name.trim().split(' ').pop();
        const lastB = b.name.trim().split(' ').pop();
        return lastA.localeCompare(lastB);
    });

    const container = document.getElementById('advisory-board-grid');
    if (container) {
        const cardsHtml = board.map(m => `
            <div class="profile-card text-center">
                 <div class="profile-img-container">
                    <img src="${m.image}" class="profile-img" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG_HUMAN}'">
                 </div>
                 <div class="profile-info">
                      <h4 class="profile-name">${m.name}</h4>
                      <p class="profile-role">${m.role}</p>
                      ${m.company_icon ? `<img src="${m.company_icon}" style="height:30px; margin:10px auto; opacity:0.8;" alt="Company Logo">` : ''}
                 </div>
            </div>
        `).join(''); // SAFE JOIN

        let fullHtml = cardsHtml;
        if (globals.advisory_group_image) {
            fullHtml += `<div class="advisory-group-wrapper">
                <h3 class="category-title" style="border-left:none; padding-left:0; text-align:center;">Center's Advisory Board and Principal Investigators</h3>
                <img src="${globals.advisory_group_image}" style="width:100%; border-radius:4px; box-shadow: var(--shadow-card);" alt="Advisory Board Group Photo">
            </div>`;
        }
        container.innerHTML = fullHtml;
    }
}

async function loadOutputsContent() {
    const rawPubs = await fetchData('publications');
    const pubHeader = document.getElementById('publications-heading');
    if(pubHeader) pubHeader.textContent = "Publications";
    
    renderAccordion(rawPubs.papers || [], 'publications-list', 'journal', true);

    const rawPatents = await fetchData('patents');
    renderAccordion(rawPatents.patents || [], 'patents-list', 'inventors', true);

    const rawPres = await fetchData('presentations');
    renderAccordion(rawPres.talks || [], 'presentations-list', 'conference', true);

    const rawAwards = await fetchData('awards');
    renderAccordion(rawAwards.awards || [], 'awards-list', 'recipient', true);
}

// =======================================================
// 7. ACCORDION UTILITIES
// =======================================================
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
        // USE CSS CLASS
        container.innerHTML = '<p class="empty-state-msg">No results found.</p>';
        return;
    }

    years.forEach((year, index) => {
        let items = grouped[year];
        
        // FEATURED SORT
        items.sort((a, b) => {
            const aFeatured = a.featured === true;
            const bFeatured = b.featured === true;
            if (aFeatured && !bFeatured) return -1;
            if (!aFeatured && bFeatured) return 1;
            return 0;
        });

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
                if(item.presenter) extraInfo += `<p class="pub-authors">${item.presenter}</p>`;
            } else {
                if(item.recipient) extraInfo += `<p class="pub-authors" style="color:var(--uh-red); font-weight:700;">${item.recipient}</p>`;
            }

            let linkHtml = '';
            if (item.link) {
                linkHtml = `<a href="${item.link}" target="_blank" class="view-link">VIEW</a>`;
            }

            let journalLineParts = [];
            
            if (!isAward && subField !== 'inventors' && item[subField]) {
                journalLineParts.push(item[subField]);
            }
            
            if (item.status) {
                journalLineParts.push(item.status);
            }
            
            const journalText = journalLineParts.join(' | ');

            // USE CSS CLASS 'featured-pub' instead of inline style
            return `
            <div class="pub-item ${item.featured ? 'featured-pub' : ''}">
                <div class="pub-details">
                    <h4>${item.title} ${item.featured ? '<span></span>' : ''}</h4>
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
                        <button class="toggle-btn" onclick="toggleMore(this)" data-count="${items.length}">View All (${items.length}) <i class="fas fa-plus"></i></button>
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
    const icon = header.querySelector('i');
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        icon.className = 'fas fa-chevron-down';
    } else {
        content.classList.add('show');
        icon.className = 'fas fa-chevron-up';
    }
};

window.toggleMore = function(btn) {
    const hiddenList = btn.previousElementSibling;
    if (!hiddenList) return;

    if (hiddenList.style.display === 'none') {
        hiddenList.style.display = 'block';
        btn.innerHTML = 'Show Less <i class="fas fa-minus"></i>';
    } else {
        hiddenList.style.display = 'none';
        const count = btn.getAttribute('data-count') || '';
        btn.innerHTML = `View All (${count}) <i class="fas fa-plus"></i>`;
    }
};

// =======================================================
// 8. MASTER LOADER (Home & General)
// =======================================================
async function loadHomePageContent() {
    const pageData = await fetchData('pages');
    const home = pageData.home || {};
    
    const heroContent = document.getElementById('hero-content');
    if (heroContent && home.hero_title) {
        heroContent.innerHTML = `
            <div class="hero-text-overlay">
                <h2>${home.hero_title}</h2>
                <p>${home.hero_text}</p>
                <button class="btn" style="background: white; color: var(--uh-red); border-color: white;" onclick="switchPage('research')">Explore Our Research</button>
            </div>`;
    }

    const sliderContainer = document.getElementById('hero-slider-container');
    const indicatorContainer = document.getElementById('slider-indicators');
    if (sliderContainer && indicatorContainer && home.slides) {
        sliderContainer.innerHTML = home.slides.map((slide, index) => `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image}');">
                <img src="${slide.image}" alt="${slide.alt}" loading="${index===0?'eager':'lazy'}">
            </div>`).join('');
        indicatorContainer.innerHTML = home.slides.map((slide, index) => `
            <div class="indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`).join('');
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
            </div>`;
    }
    
    // Events Preview
    const rawEvents = await fetchData('events');
    const eventsData = rawEvents.events_list || [];
    window.eventsStore = eventsData;
    
    const eventPreview = document.getElementById('event-preview-grid');
    if (eventPreview) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const futureEvents = eventsData.filter(e => new Date(e.date) >= today).slice(0, 4); 

        if (futureEvents.length === 0) {
             eventPreview.innerHTML = `<p class="empty-state-msg">No upcoming events scheduled at this time.</p>`;
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
                    <a href="#" onclick="openDetailView(event, '${item.id}', 'events')" class="text-uh-red" style="font-weight:700; font-size:0.9rem;">Event Details &rarr;</a>
                </div>`).join('');
        }
    }
}

// IMPACT STATS & CONTACT (Placeholders to prevent errors)
async function loadImpactStats() {
    const globals = await fetchData('globals');
    const stats = globals.impact_stats || [];
    const container = document.getElementById('impact-stats-grid');
    if (container) container.innerHTML = stats.map(stat => `
        <div><h2 style="font-size: 3rem; color: ${stat.color || '#F4D03F'};">${stat.value}</h2><p>${stat.label}</p></div>
    `).join('');
}
async function loadContactContent() {
    const globals = await fetchData('globals');
    const contact = globals.contact || {};
    const container = document.getElementById('contact-info-grid');
    const aboutContactPreview = document.getElementById('about-contact-preview');
    if (container) {
        // USE CSS CLASS (contact-map-container)
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
            <div class="contact-map-container">
                <iframe src="${contact.map_embed_url}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
        `;
    }
    if (aboutContactPreview) {
         aboutContactPreview.innerHTML = `<p style="font-size: 0.9rem;">${contact.address_line1}<br>${contact.address_line2}<br>${contact.address_line3}<br>${contact.address_line4}</p>`;
    }
}

async function loadAboutContent() {
    const pageData = await fetchData('pages');
    const about = pageData.about || {};
    const container = document.getElementById('about-main-content');

    if (container && about.overview) {
        const ov = about.overview;
        // Format body text
        const formattedBody = ov.body
            ? ov.body.split('\n\n').map(p => `<p style="margin-bottom: 1.5rem;">${p}</p>`).join('')
            : '';

        container.innerHTML = `
            <h3 style="margin-top:0;">${ov.title}</h3>
            <p style="font-size: 1.2rem; font-weight: 500; color: var(--uh-red); margin-bottom: 1.5rem; line-height: 1.4;">
                ${ov.lead}
            </p>
            <div style="color: var(--text-main); font-size: 1rem; line-height: 1.7;">
                ${formattedBody}
            </div>
            <img src="${ov.image}" alt="${ov.image_alt}" 
                 style="width: 100%; border-radius: 4px; margin-top: 30px; box-shadow: var(--shadow-card);" 
                 loading="lazy">
        `;
    }
}
// MAIN EXPORT
window.loadContent = function(pageId) {
    if (typeof loadImpactStats === 'function') loadImpactStats();
    if (typeof loadContactContent === 'function') loadContactContent(); 
    
    if (pageId === 'home') loadHomePageContent();
    else if (pageId === 'about') loadAboutContent(); // ADDED THIS
    else if (pageId === 'team') loadTeamContent();
    else if (pageId === 'outputs') loadOutputsContent(); 
    else if (pageId === 'research') loadResearchContent();
    else if (pageId === 'advisory') loadAdvisoryContent();
    else if (pageId === 'news') loadNewsContent();
    else if (pageId === 'outreach') loadOutreachContent();
    else if (pageId === 'events') loadEventsContent(); 
};


