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

            // --- Lógica de Compartilhamento ---
            setupSharing(post);
            
            // --- Lógica de Comentários (Mock Local para Demonstração) ---
            setupComments(articleId);

        } catch (err) {
            console.error('Erro inesperado:', err);
            showError();
        }
    }

    function setupSharing(post) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(post.title);
        
        document.getElementById('share-facebook').addEventListener('click', () => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
        });
        
        document.getElementById('share-linkedin').addEventListener('click', () => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=400');
        });
        
        document.getElementById('share-instagram').addEventListener('click', () => {
            // O Instagram não possui API direta de compartilhamento web por link.
            // Copiamos o link para a área de transferência.
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link do artigo copiado! Compartilhe com sua rede.');
            }).catch(err => {
                window.open('https://instagram.com', '_blank');
            });
        });
    }

    function setupComments(articleId) {
        // Utilizando localStorage para simular a persistência de comentários.
        // Em um ambiente de produção real com backend ativo, substituir por requisição ao Supabase.
        const commentsKey = `blog_comments_${articleId}`;
        let comments = JSON.parse(localStorage.getItem(commentsKey)) || [];
        
        const commentList = document.getElementById('comment-list');
        const commentsCountBadge = document.getElementById('comments-count-badge');
        const nameInput = document.getElementById('comment-name');
        const textInput = document.getElementById('comment-text');
        const submitBtn = document.getElementById('btn-submit-comment');
        
        function renderComments() {
            commentsCountBadge.textContent = comments.length;
            
            if (comments.length === 0) {
                commentList.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);" id="no-comments-msg">
                        Seja o primeiro a comentar!
                    </div>
                `;
                return;
            }
            
            commentList.innerHTML = '';
            comments.forEach(comment => {
                const date = new Date(comment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                const initial = comment.name.charAt(0).toUpperCase();
                
                const commentHTML = `
                    <div class="comment-item">
                        <div class="comment-avatar">${initial}</div>
                        <div class="comment-content">
                            <div class="comment-author">${escapeHTML(comment.name)}</div>
                            <div class="comment-date">${date}</div>
                            <div class="comment-text">${escapeHTML(comment.text).replace(/\n/g, '<br>')}</div>
                        </div>
                    </div>
                `;
                commentList.insertAdjacentHTML('beforeend', commentHTML);
            });
        }
        
        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag));
        }
        
        submitBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const text = textInput.value.trim();
            
            if (!name || !text) {
                alert('Por favor, preencha seu nome e seu comentário.');
                return;
            }
            
            const newComment = {
                name,
                text,
                date: new Date().toISOString()
            };
            
            comments.push(newComment);
            localStorage.setItem(commentsKey, JSON.stringify(comments));
            
            nameInput.value = '';
            textInput.value = '';
            
            renderComments();
            
            // Feedback visual no botão
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Comentário Publicado!';
            submitBtn.style.background = 'var(--secondary-color)';
            submitBtn.style.color = '#fff';
            
            setTimeout(() => {
                submitBtn.textContent = 'Publicar Comentário';
                submitBtn.style.background = '';
            }, 3000);
        });
        
        // Render inicial
        renderComments();
    }

    function showError() {
        document.getElementById('loading-indicator').style.display = 'none';
        document.getElementById('single-article').style.display = 'none';
        document.getElementById('error-indicator').style.display = 'block';
    }
});
