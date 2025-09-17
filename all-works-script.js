// All Works Page JavaScript
class AllWorks {
    constructor() {
        this.works = [];
        this.filteredWorks = [];
        this.currentFilter = 'all';
        this.allTags = new Set();
        this.init();
    }

    init() {
        this.loadWorks();
        this.extractAllTags();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.renderTagButtons();
        this.handleUrlParams();
        this.renderWorks();
    }

    loadWorks() {
        console.log('portfolioData available:', typeof portfolioData !== 'undefined');
        if (typeof portfolioData === 'undefined') {
            console.error('portfolioData is not defined!');
            this.works = [];
        } else {
            console.log('portfolioData:', portfolioData);
            this.works = portfolioData.works || [];
        }
        this.filteredWorks = [...this.works];
        console.log('Loaded works:', this.works.length);
        console.log('Works data:', this.works);
    }

    extractAllTags() {
        this.works.forEach(work => {
            if (Array.isArray(work.tags)) {
                work.tags.forEach(tag => this.allTags.add(tag));
            }
        });
    }

    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tagParam = urlParams.get('tag');

        if (tagParam && this.allTags.has(tagParam)) {
            this.filterWorks(tagParam);
            // Update the active button
            setTimeout(() => {
                const activeButton = document.querySelector(`[data-tag="${tagParam}"]`);
                if (activeButton) {
                    this.updateFilterButtons(activeButton);
                }
            }, 100);
        } else {
            // No tag parameter, show all works
            this.filterWorks('all');
        }
    }

    setupEventListeners() {
        // Tag filter buttons and card tags
        document.addEventListener('click', (e) => {
            console.log('Click event detected on:', e.target);
            if (e.target.classList.contains('filter-btn')) {
                const tag = e.target.dataset.tag;
                console.log('Filter button clicked, tag:', tag);
                this.filterWorks(tag);
                this.updateFilterButtons(e.target);
            } else if (e.target.classList.contains('clickable-tag')) {
                const tag = e.target.dataset.tag;
                console.log('Card tag clicked, tag:', tag);
                this.filterWorks(tag);
                // Update the corresponding filter button
                const filterButton = document.querySelector(`[data-tag="${tag}"]`);
                if (filterButton) {
                    this.updateFilterButtons(filterButton);
                }
            }
        });
    }

    filterWorks(tag) {
        this.currentFilter = tag;
        console.log('Filtering by tag:', tag);
        console.log('Total works:', this.works.length);

        if (tag === 'all') {
            this.filteredWorks = [...this.works];
        } else {
            this.filteredWorks = this.works.filter(work => {
                return Array.isArray(work.tags) && work.tags.includes(tag);
            });
        }

        console.log('Filtered works:', this.filteredWorks.length);
        this.renderWorks();
    }

    updateFilterButtons(activeButton) {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        activeButton.classList.add('active');
    }

    renderTagButtons() {
        const tagButtonsContainer = document.getElementById('tagButtons');
        const sortedTags = Array.from(this.allTags).sort();

        tagButtonsContainer.innerHTML = sortedTags.map(tag => `
            <button class="filter-btn" data-tag="${tag}">${tag}</button>
        `).join('');

        // Set All button as active by default
        const allButton = document.querySelector('[data-tag="all"]');
        if (allButton) {
            allButton.classList.add('active');
        }
    }

    renderWorks() {
        const worksGrid = document.getElementById('worksGrid');
        console.log('Rendering works, filtered count:', this.filteredWorks.length);
        console.log('Works grid element:', worksGrid);

        if (!worksGrid) {
            console.error('worksGrid element not found!');
            return;
        }

        if (this.filteredWorks.length === 0) {
            console.log('No works to display, showing no-works message');
            worksGrid.innerHTML = '<p class="no-works">No works found for this tag.</p>';
            return;
        }

        console.log('Rendering work cards...');
        const html = this.filteredWorks.map((work, index) => `
            <div class="work-card" style="animation-delay: ${index * 0.1}s">
                <div class="work-image-container">
                    <img src="${work.images[0]}" alt="${work.title}" class="work-card-image" loading="lazy">
                    <div class="work-overlay">
                        <a href="work${work.id}.html" class="work-link">View Project →</a>
                    </div>
                </div>
                <div class="work-card-content">
                    <h3 class="work-card-title">${work.title}</h3>
                    <p class="work-card-client">${work.client}</p>
                    <p class="work-card-role">role: ${this.getRoleDisplay(work.role)}</p>
                    <div class="work-card-tags">${this.renderWorkTags(work.tags)}</div>
                </div>
            </div>
        `).join('');

        console.log('Generated HTML length:', html.length);
        worksGrid.innerHTML = html;
        console.log('HTML inserted into worksGrid');
    }

    getRoleDisplay(role) {
        const roles = {
            'designer': 'Designer',
            'art-director': 'Art Director',
            'illustrator': 'Illustrator',
            'engineer': 'Engineer'
        };
        return roles[role] || role;
    }

    renderWorkTags(tags) {
        if (!Array.isArray(tags)) return '';
        return tags.map(tag => `<span class="work-tag clickable-tag" data-tag="${tag}">${tag}</span>`).join('');
    }

    setupScrollAnimations() {
        // Disable scroll animations for now to ensure cards are visible
        console.log('Scroll animations disabled for debugging');

        // Just ensure all cards are visible immediately
        setTimeout(() => {
            const workCards = document.querySelectorAll('.work-card');
            console.log('Found work cards:', workCards.length);
            workCards.forEach(card => {
                card.classList.add('animate');
                console.log('Card made visible:', card);
            });
        }, 100);
    }
}

// Back to Top functionality
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    if (!backToTopBtn) {
        console.log('Back to top button not found');
        return;
    }

    console.log('Back to top button found, initializing...');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const threshold = window.innerHeight * 2; // 200vh
        console.log('Scroll position:', scrollY, 'Threshold:', threshold);

        if (scrollY > threshold) {
            backToTopBtn.classList.add('visible');
            console.log('Button should be visible');
        } else {
            backToTopBtn.classList.remove('visible');
            console.log('Button should be hidden');
        }
    });

    // Smooth scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        console.log('Back to top clicked');
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AllWorks...');
    try {
        new AllWorks();
        initBackToTop();
        console.log('AllWorks initialized successfully');
    } catch (error) {
        console.error('Error initializing AllWorks:', error);
    }
});
