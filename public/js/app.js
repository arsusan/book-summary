// DOM Elements
const homePage = document.getElementById('homePage');
const bookDetailPage = document.getElementById('bookDetailPage');
const bookList = document.getElementById('bookList');
const bookDetail = document.getElementById('bookDetail');
const chaptersList = document.getElementById('chaptersList');
const backButton = document.getElementById('backButton');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const themeToggle = document.getElementById('themeToggle');
const loadingIndicator = document.getElementById('loadingIndicator');
const currentYear = document.getElementById('currentYear');

// State
let currentBookId = null;
let allBooks = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    // Set current year
    currentYear.textContent = new Date().getFullYear();
    
    // Initialize Netlify Identity
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('init', user => {
            if (!user) {
                window.netlifyIdentity.on('login', () => {
                    document.location.href = '/admin/';
                });
            }
        });
        window.netlifyIdentity.init();
    }

    // Load books data
    await loadBooksData();
    
    // Set up event listeners
    setupEventListeners();
});
// Helper function to load scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
// Fetch books data from Netlify CMS
async function loadBooksData() {
    showLoading(true);
    
    try {
        const response = await fetch('/content/books/data.json');
        if (!response.ok) throw new Error('Failed to load books');
        
        const data = await response.json();
        allBooks = data.books || [];
        
        if (allBooks.length === 0) {
            showNoBooksMessage();
        } else {
            renderBookList(allBooks);
        }
    } catch (error) {
        console.error('Error loading books:', error);
        showErrorState(error);
    } finally {
        showLoading(false);
    }
}

// Set up all event listeners
function setupEventListeners() {
    backButton.addEventListener('click', showHomePage);
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    filterSelect.addEventListener('change', handleFilter);
    themeToggle.addEventListener('click', toggleDarkMode);
    
    // Handle back/forward navigation
    window.addEventListener('popstate', handlePopState);
    
    // Check for dark mode preference
    checkDarkModePreference();
}

// Render book list
function renderBookList(books) {
    bookList.innerHTML = '';
    
    if (books.length === 0) {
        showNoBooksMessage();
        return;
    }
    
    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all';
        bookCard.innerHTML = `
            <div class="h-48 overflow-hidden ${book.cover ? '' : 'placeholder-cover flex items-center justify-center'}">
                ${book.cover ? 
                    `<img src="${book.cover}" alt="${book.title}" class="w-full h-full object-cover" loading="lazy">` :
                    `<i class="fas fa-book text-5xl text-gray-400 dark:text-gray-600"></i>`
                }
            </div>
            <div class="p-6">
                <span class="inline-block px-3 py-1 text-xs font-semibold text-accent bg-orange-100 dark:bg-orange-900/30 rounded-full mb-2">
                    ${book.category}
                </span>
                <h3 class="text-xl font-bold text-secondary dark:text-white mb-2">${book.title}</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-3">by ${book.author}</p>
                <p class="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">${book.description}</p>
                <button onclick="window.showBookDetail(${book.id})" class="w-full mt-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
                    View Chapters <i class="fas fa-arrow-right ml-2 text-sm"></i>
                </button>
            </div>
        `;
        bookList.appendChild(bookCard);
    });
}

// Show book details
window.showBookDetail = function(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (!book) return;
    
    currentBookId = bookId;
    
    // Update URL
    window.history.pushState({ bookId }, '', `?book=${bookId}`);
    
    // Render book details
    bookDetail.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6">
            <div class="md:w-1/3">
                <div class="h-64 ${book.cover ? '' : 'placeholder-cover flex items-center justify-center'} rounded-lg overflow-hidden shadow-md">
                    ${book.cover ? 
                        `<img src="${book.cover}" alt="${book.title}" class="w-full h-full object-cover" loading="lazy">` :
                        `<i class="fas fa-book text-8xl text-gray-400 dark:text-gray-600"></i>`
                    }
                </div>
            </div>
            <div class="md:w-2/3">
                <span class="inline-block px-3 py-1 text-xs font-semibold text-accent bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3">
                    ${book.category}
                </span>
                <h1 class="text-3xl font-bold text-secondary dark:text-white mb-2">${book.title}</h1>
                <p class="text-xl text-gray-600 dark:text-gray-300 mb-4">by ${book.author}</p>
                <p class="text-gray-700 dark:text-gray-300 mb-6">${book.description}</p>
                // Inside the bookDetail.innerHTML template, after description:
                ${book.details ? `
                <div class="grid grid-cols-3 gap-4 mt-6">
                    ${book.details.year ? `
                    <div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">Year</span>
                        <p class="font-medium">${book.details.year}</p>
                    </div>
                    ` : ''}
                    ${book.details.pages ? `
                    <div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">Pages</span>
                        <p class="font-medium">${book.details.pages}</p>
                    </div>
                    ` : ''}
                    ${book.details.rating ? `
                    <div>
                        <span class="text-sm text-gray-500 dark:text-gray-400">Rating</span>
                        <p class="font-medium">${book.details.rating}/5</p>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                    <i class="fas fa-list mr-2"></i>
                    <span>${book.chapters.length} chapters</span>
                </div>
            </div>
        </div>
    `;
    
    // Render chapters
    chaptersList.innerHTML = '';
    book.chapters.forEach((chapter, index) => {
        const chapterItem = document.createElement('div');
        chapterItem.className = 'chapter-item bg-white dark:bg-gray-800 mb-4 rounded-lg p-5 shadow-sm hover:shadow-md transition-all';
        chapterItem.innerHTML = `
            <div class="flex justify-between items-center cursor-pointer" onclick="window.toggleChapter(this)" aria-expanded="false">
                <div>
                    <span class="text-sm font-semibold text-primary dark:text-primary-dark bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded mr-3">Ch. ${index + 1}</span>
                    <span class="font-medium text-lg text-secondary dark:text-white">${chapter.title}</span>
                </div>
                <i class="fas fa-chevron-down text-gray-400 dark:text-gray-300 transition-transform"></i>
            </div>
            <div class="chapter-content mt-3 pl-8 border-l-2 border-gray-200 dark:border-gray-600">
                ${renderChapterContent(chapter)}
            </div>
        `;
        chaptersList.appendChild(chapterItem);
    });
    
    // Show book detail page
    homePage.classList.add('hidden');
    bookDetailPage.classList.remove('hidden');
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Toggle chapter content
window.toggleChapter = function(element) {
    const chapterContent = element.nextElementSibling;
    const icon = element.querySelector('i');
    const isExpanded = element.getAttribute('aria-expanded') === 'true';
    
    chapterContent.classList.toggle('active');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
    element.setAttribute('aria-expanded', !isExpanded);
};

// Render chapter content based on type
function renderChapterContent(chapter) {
    if (chapter.type === 'bullets' && Array.isArray(chapter.bullet_points)) {
        return `
            <ul class="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                ${chapter.bullet_points.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }
    return `<div class="prose dark:prose-invert">${marked.parse(chapter.content || '')}</div>`;
}


// Show homepage
function showHomePage() {
    window.history.pushState(null, '', window.location.pathname);
    homePage.classList.remove('hidden');
    bookDetailPage.classList.add('hidden');
    
    // Reset search and filters if they were applied
    if (searchInput.value || filterSelect.value !== 'all') {
        searchInput.value = '';
        filterSelect.value = 'all';
        renderBookList(allBooks);
    }
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    
    const filteredBooks = allBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.description.toLowerCase().includes(searchTerm);
        
        const matchesFilter = filterValue === 'all' || book.category === filterValue;
        
        return matchesSearch && matchesFilter;
    });
    
    renderBookList(filteredBooks);
}

// Handle filter changes
function handleFilter() {
    handleSearch();
}

// Toggle dark mode
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
}

// Check for saved dark mode preference
function checkDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'true' || 
        (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
}

// Handle popstate events (back/forward navigation)
function handlePopState(event) {
    if (event.state && event.state.bookId) {
        window.showBookDetail(event.state.bookId);
    } else {
        showHomePage();
    }
}

// Show loading state
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
        bookList.classList.add('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
        bookList.classList.remove('hidden');
    }
}

// Show no books message
function showNoBooksMessage() {
    bookList.innerHTML = `
        <div class="col-span-full text-center py-12">
            <i class="fas fa-book-open text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-300">No books found</h3>
            <p class="text-gray-500 dark:text-gray-400">Try adjusting your search or filter</p>
        </div>
    `;
}

// Show error state
function showErrorState(error) {
    bookList.innerHTML = `
        <div class="col-span-full text-center py-12">
            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h3 class="text-xl font-semibold text-red-600 dark:text-red-400">Error loading books</h3>
            <p class="text-gray-600 dark:text-gray-300 mt-2">${error.message}</p>
            <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg">
                Try Again
            </button>
        </div>
    `;
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}