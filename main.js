document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle (Basic implementation)
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if(mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            // Simple toggle for demonstration - in production, we'd want a sliding menu
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'rgba(10, 13, 20, 0.95)';
                navLinks.style.backdropFilter = 'blur(16px)';
                navLinks.style.padding = '20px';
                navLinks.style.borderBottom = '1px solid var(--border-color)';
                navLinks.style.gap = '20px';
            }
        });
    }

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                // Adjust scroll position for navbar height
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (window.innerWidth <= 768 && navLinks.style.display === 'flex') {
                    navLinks.style.display = 'none';
                }
            }
        });
    });

    // Search input animation effect
    const searchInput = document.querySelector('.search-input');
    const searchContainer = document.querySelector('.search-container');
    
    if(searchInput) {
        searchInput.addEventListener('focus', () => {
            searchContainer.style.transform = 'scale(1.02)';
        });
        
        searchInput.addEventListener('blur', () => {
            searchContainer.style.transform = 'scale(1)';
        });
    }
});

// --- Integração com Supabase ---
const SUPABASE_URL = 'https://croheciuxhtifejhcwws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2hlY2l1eGh0aWZlamhjd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYxNTgsImV4cCI6MjA4NjEyMjE1OH0.Fqt9ushsPnS6iQX7oGjeFtKfxyIK5iyVEBY5HCa5d1c';

// Inicializa o cliente apenas se o script do Supabase tiver sido carregado
if (window.supabase) {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function loadPosts() {
        const postsContainer = document.getElementById('dynamic-posts-grid');
        if (!postsContainer) return;

        const { data: posts, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar posts:', error);
            postsContainer.innerHTML = '<p style="color: #ef4444; grid-column: 1 / -1; text-align: center;">Erro ao carregar os artigos.</p>';
            return;
        }

        if (posts.length === 0) {
            postsContainer.innerHTML = '<p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 2rem;">Nenhum artigo publicado ainda. Em breve teremos novidades!</p>';
            return;
        }

        postsContainer.innerHTML = ''; // Limpa o container

        posts.forEach(post => {
            // Formata a data
            const dateObj = new Date(post.created_at);
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

            const article = document.createElement('article');
            article.className = 'post-card';
            
            // Usar imagem padrão se não houver
            const imgUrl = post.image_url || 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=600&h=400';
            const category = post.category || 'Novidade';

            article.innerHTML = `
                <div class="post-img-wrapper">
                    <img src="${imgUrl}" alt="${post.title}">
                    <div class="category-badge">${category}</div>
                </div>
                <div class="post-card-content">
                    <div class="post-meta">
                        <span class="date">${formattedDate}</span>
                    </div>
                    <h3 class="post-title">${post.title}</h3>
                    <p class="post-excerpt">${post.excerpt || ''}</p>
                    <a href="#" class="card-read-more">Ler artigo <i class="ph ph-arrow-right"></i></a>
                </div>
            `;
            postsContainer.appendChild(article);
        });
    }

    // Carrega os posts quando a página carregar
    loadPosts();
}
