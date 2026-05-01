document.addEventListener('DOMContentLoaded', () => {
    // Tratar qualquer erro global
    window.onerror = function(msg, url, line) {
        alert("ERRO NO CÓDIGO:\n" + msg + "\nLinha: " + line);
    };

    // Configuração do Supabase
    const SUPABASE_URL = 'https://croheciuxhtifejhcwws.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2hlY2l1eGh0aWZlamhjd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYxNTgsImV4cCI6MjA4NjEyMjE1OH0.Fqt9ushsPnS6iQX7oGjeFtKfxyIK5iyVEBY5HCa5d1c';

    let supabase = null;

    // Verifica carregamento do Supabase
    if (!window.supabase) {
        alert("ERRO CRÍTICO: O Supabase não carregou do servidor (CDN). Verifique sua conexão com a internet ou se há algum bloqueador ativado.");
    } else {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        } catch (e) {
            alert("Erro ao inicializar Supabase: " + e.message);
        }
    }

    // Elementos da UI
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const logoutBtn = document.getElementById('logout-btn');
    const loginForm = document.getElementById('login-form');
    const postForm = document.getElementById('post-form');
    const publishStatus = document.getElementById('publish-status');
    
    const menuWrite = document.getElementById('menu-write');
    const menuList = document.getElementById('menu-list');
    const sectionWrite = document.getElementById('section-write');
    const sectionList = document.getElementById('section-list');

    // Navegação entre abas
    if (menuWrite && menuList) {
        menuWrite.addEventListener('click', () => {
            sectionWrite.style.display = 'block';
            sectionList.style.display = 'none';
            menuWrite.classList.add('active');
            menuList.classList.remove('active');
            
            // Resetar form se estava editando
            if (document.getElementById('post-id').value !== '') {
                resetForm();
            }
        });
        menuList.addEventListener('click', () => {
            sectionWrite.style.display = 'none';
            sectionList.style.display = 'block';
            menuList.classList.add('active');
            menuWrite.classList.remove('active');
            window.loadMyArticles();
        });
    }

    // Verifica se o usuário já está logado ao carregar a página
    async function checkSession() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                showDashboard();
            } else {
                showLogin();
            }
        } catch (e) {
            console.error(e);
        }
    }

    // Fazer Login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const emailInput = document.getElementById('login-email');
                const passwordInput = document.getElementById('login-password');
                const errorMsg = document.getElementById('login-error');
                const btn = loginForm.querySelector('button');
                
                if (!supabase) return;
                
                if (!emailInput.value || !passwordInput.value) {
                    errorMsg.textContent = 'Por favor, preencha o e-mail e a senha.';
                    errorMsg.style.display = 'block';
                    return;
                }

                errorMsg.style.display = 'none';
                btn.textContent = 'Carregando...';
                btn.disabled = true;
                
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: emailInput.value,
                        password: passwordInput.value,
                    });

                    if (error) {
                        let msg = error.message;
                        if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos.';
                        errorMsg.textContent = msg;
                        errorMsg.style.display = 'block';
                    } else {
                        showDashboard();
                    }
                } catch (authError) {
                    errorMsg.textContent = 'Erro de conexão: ' + authError.message;
                    errorMsg.style.display = 'block';
                }
                
                btn.textContent = 'Entrar';
                btn.disabled = false;
            } catch (err) {
                alert("Erro interno na tela de login: " + err.message);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!supabase) return;
            await supabase.auth.signOut();
            showLogin();
        });
    }

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const postId = document.getElementById('post-id').value;
            const postAction = document.getElementById('post-action').value; // 'published' ou 'draft'
            const postDate = document.getElementById('post-date').value;
            
            const title = document.getElementById('post-title').value;
            const excerpt = document.getElementById('post-excerpt').value;
            const category = document.getElementById('post-category').value;
            const imageInput = document.getElementById('post-image');
            const content = quillEditor ? quillEditor.root.innerHTML : '';
            const seoTags = document.getElementById('post-tags').value;
            
            const btnPublish = document.getElementById('publish-btn');
            const btnDraft = document.getElementById('draft-btn');
            
            btnPublish.disabled = true;
            btnDraft.disabled = true;
            
            publishStatus.textContent = 'Processando...';
            publishStatus.className = '';

            const { data, error } = await supabase.auth.getUser();
            if (!data.user) {
                alert("Sua sessão expirou. Faça login novamente.");
                showLogin();
                return;
            }

            // Exigir imagem se for novo post
            if (!postId && (!imageInput.files || imageInput.files.length === 0)) {
                publishStatus.textContent = 'A imagem de capa é obrigatória para um novo artigo.';
                publishStatus.className = 'error-msg';
                btnPublish.disabled = false;
                btnDraft.disabled = false;
                return;
            }

            let finalImageUrl = '';
            const imageFile = imageInput.files[0];
            
            if (imageFile) {
                publishStatus.textContent = 'Fazendo upload da imagem...';
                
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `covers/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('blog-images')
                    .upload(filePath, imageFile);
                    
                if (uploadError) {
                    publishStatus.textContent = 'Erro no upload da imagem. ' + uploadError.message;
                    publishStatus.className = 'error-msg';
                    btnPublish.disabled = false;
                    btnDraft.disabled = false;
                    return;
                }
                
                const { data: urlData } = supabase.storage
                    .from('blog-images')
                    .getPublicUrl(filePath);
                    
                finalImageUrl = urlData.publicUrl;
            }

            publishStatus.textContent = 'Salvando dados...';

            const postData = {
                title: title, 
                excerpt: excerpt, 
                category: category, 
                content: content,
                seo_tags: seoTags,
                status: postAction
            };

            // Regras de Agendamento
            if (postDate) {
                postData.published_at = new Date(postDate).toISOString();
            } else if (!postId) {
                // Se for novo e não tiver data, publica agora
                postData.published_at = new Date().toISOString();
            }

            if (finalImageUrl) {
                postData.image_url = finalImageUrl;
            }

            let opError;
            if (postId) {
                // Atualizar
                const { error: updateError } = await supabase.from('blog_posts').update(postData).eq('id', postId);
                opError = updateError;
            } else {
                // Inserir
                const { error: insertError } = await supabase.from('blog_posts').insert([postData]);
                opError = insertError;
            }

            if (opError) {
                publishStatus.textContent = 'Erro ao salvar: ' + opError.message;
                publishStatus.className = 'error-msg';
            } else {
                publishStatus.textContent = postAction === 'draft' ? 'Rascunho salvo com sucesso!' : 'Artigo publicado com sucesso! 🎉';
                publishStatus.className = 'success-msg';
                resetForm();
                
                // Se estava editando, volta para a lista
                if (postId) {
                    setTimeout(() => menuList.click(), 1500);
                }
            }
            
            btnPublish.disabled = false;
            btnDraft.disabled = false;
        });
    }

    function resetForm() {
        postForm.reset();
        document.getElementById('post-id').value = '';
        document.getElementById('post-action').value = 'published';
        document.getElementById('form-title').textContent = 'Escrever Novo Artigo';
        document.getElementById('publish-btn').innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Publicar Artigo';
        if (quillEditor) quillEditor.setText('');
    }

    function showLogin() {
        if(loginScreen) loginScreen.style.display = 'block';
        if(dashboardScreen) dashboardScreen.style.display = 'none';
    }

    function showDashboard() {
        if(loginScreen) loginScreen.style.display = 'none';
        if(dashboardScreen) dashboardScreen.style.display = 'block';
    }

    // Inicializar o editor Quill
    let quillEditor = null;
    if (document.getElementById('editor-container')) {
        quillEditor = new Quill('#editor-container', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'align': [] }],
                    ['link'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'font': [] }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    ['clean']
                ]
            },
            placeholder: 'Escreva seu artigo aqui...'
        });
    }

    // --- FUNÇÕES DE GERENCIAMENTO DE ARTIGOS ---
    window.loadMyArticles = async function() {
        if (!supabase) return;
        const container = document.getElementById('articles-list-container');
        container.innerHTML = '<p style="color: var(--text-muted);"><i class="ph ph-spinner ph-spin"></i> Buscando artigos...</p>';
        
        const { data: posts, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
        
        if (error) { 
            container.innerHTML = '<p style="color: #ef4444;">Erro ao carregar os artigos: ' + error.message + '</p>'; 
            return; 
        }
        if (!posts || posts.length === 0) { 
            container.innerHTML = '<p style="color: var(--text-muted);">Nenhum artigo encontrado. Crie o seu primeiro!</p>'; 
            return; 
        }
        
        let html = '<div style="overflow-x: auto;"><table class="admin-table">';
        html += '<thead><tr><th>Título</th><th>Data / Agendamento</th><th>Status</th><th>Ações</th></tr></thead><tbody>';
        
        posts.forEach(p => {
            const isDraft = p.status === 'draft';
            const statusBadge = isDraft 
                ? '<span class="badge badge-draft">Rascunho</span>' 
                : '<span class="badge badge-published">Publicado</span>';
            
            let dateText = '-';
            if (p.published_at) {
                const dateObj = new Date(p.published_at);
                dateText = dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
                if (!isDraft && dateObj > new Date()) {
                    dateText = `<span style="color: #3b82f6;">Agendado para:<br>${dateText}</span>`;
                }
            }

            html += `<tr>
                <td style="font-weight: 500;">${p.title}</td>
                <td style="color: var(--text-muted); font-size: 0.9rem;">${dateText}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="editPost('${p.id}')" class="btn-action btn-edit"><i class="ph ph-pencil-simple"></i></button>
                        <button onclick="deletePost('${p.id}')" class="btn-action btn-delete"><i class="ph ph-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    };
    
    window.editPost = async function(id) {
        publishStatus.textContent = '';
        publishStatus.className = '';
        const { data: post, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();
        
        if (error || !post) { 
            alert('Erro ao buscar post'); 
            return; 
        }
        
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-excerpt').value = post.excerpt || '';
        document.getElementById('post-category').value = post.category;
        document.getElementById('post-tags').value = post.seo_tags || '';
        if (quillEditor) {
            // Pequeno delay para garantir que o Quill renderize
            setTimeout(() => quillEditor.root.innerHTML = post.content || '', 50);
        }
        
        if (post.published_at) {
            // Formatar data para input datetime-local (YYYY-MM-DDThh:mm)
            const d = new Date(post.published_at);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            document.getElementById('post-date').value = d.toISOString().slice(0, 16);
        } else {
            document.getElementById('post-date').value = '';
        }
        
        // Trocar aba
        menuWrite.click();
        document.getElementById('form-title').textContent = 'Editar Artigo: ' + post.title;
        document.getElementById('publish-btn').innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Atualizar Artigo';
    };
    
    window.deletePost = async function(id) {
        if (confirm('Atenção: Tem certeza que deseja excluir este artigo permanentemente? Essa ação não pode ser desfeita.')) {
            const { error } = await supabase.from('blog_posts').delete().eq('id', id);
            if (error) {
                alert('Erro ao excluir: ' + error.message);
            } else {
                window.loadMyArticles();
            }
        }
    };

    // Iniciar verificação
    checkSession();
});
