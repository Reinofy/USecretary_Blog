document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if(mobileBtn) {
        mobileBtn.addEventListener('click', () => {
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

    // --- Integração com Supabase ---
    const SUPABASE_URL = 'https://croheciuxhtifejhcwws.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2hlY2l1eGh0aWZlamhjd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYxNTgsImV4cCI6MjA4NjEyMjE1OH0.Fqt9ushsPnS6iQX7oGjeFtKfxyIK5iyVEBY5HCa5d1c';

    if (window.supabase) {
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        loadArticle(supabase);
    } else {
        showError();
    }

    async function loadArticle(supabase) {
        // Obter ID da URL
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
            showError();
            return;
        }

        try {
            const { data: post, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', articleId)
                .single();

            if (error || !post) {
                console.error('Erro ao buscar artigo:', error);
                showError();
                return;
            }

            // Esconder loading e mostrar artigo
            document.getElementById('loading-indicator').style.display = 'none';
            document.getElementById('single-article').style.display = 'block';

            // Atualizar o título da página (aba do navegador)
            document.title = `${post.title} | U-Secretary Blog`;

            // Preencher os dados na tela
            document.getElementById('article-title').textContent = post.title;
            
            const dateObj = new Date(post.created_at);
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            document.getElementById('article-date').innerHTML = `<i class="ph ph-calendar-blank"></i> Publicado em ${formattedDate}`;
            
            document.getElementById('article-category').textContent = post.category || 'Geral';
            
            if (post.image_url) {
                document.getElementById('article-cover-img').src = post.image_url;
            } else {
                document.getElementById('article-cover-img').src = 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=800&h=500';
            }

            // Injetar o conteúdo rico HTML
            // Como usamos Quill, o conteúdo já vem com tags <p>, <strong>, etc.
            document.getElementById('article-content').innerHTML = post.content || '';

            // --- INJEÇÃO DE TAGS SEO ---
            if (post.seo_tags) {
                const metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                metaKeywords.content = post.seo_tags;
                document.head.appendChild(metaKeywords);
            }

        } catch (err) {
            console.error('Erro inesperado:', err);
            showError();
        }
    }

    function showError() {
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('single-article').style.display = 'none';
        document.getElementById('error-indicator').style.display = 'block';
    }
});
