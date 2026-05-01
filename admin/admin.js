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
            e.preventDefault(); // Impede o recarregamento da página ABSOLUTAMENTE
            try {
                const emailInput = document.getElementById('login-email');
                const passwordInput = document.getElementById('login-password');
                const errorMsg = document.getElementById('login-error');
                const btn = loginForm.querySelector('button');
                
                if (!supabase) {
                    alert("ERRO: O banco de dados (Supabase) não está conectado. Tente recarregar a página.");
                    return;
                }
                
                // Validação básica
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
                        if (msg === 'Invalid login credentials') {
                            msg = 'E-mail ou senha incorretos.';
                        }
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
            
            const title = document.getElementById('post-title').value;
            const excerpt = document.getElementById('post-excerpt').value;
            const category = document.getElementById('post-category').value;
            const imageInput = document.getElementById('post-image');
            const content = quillEditor ? quillEditor.root.innerHTML : '';
            const seoTags = document.getElementById('post-tags').value;
            const btn = document.getElementById('publish-btn');
            
            btn.disabled = true;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Publicando...';
            publishStatus.textContent = '';
            publishStatus.className = '';

            const { data, error } = await supabase.auth.getUser();
            if (!data.user) {
                alert("Sua sessão expirou. Faça login novamente.");
                showLogin();
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
                    publishStatus.textContent = 'Erro no upload da imagem. O bucket "blog-images" existe e é público? Erro: ' + uploadError.message;
                    publishStatus.className = 'error-msg';
                    btn.disabled = false;
                    btn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Publicar Artigo';
                    return;
                }
                
                const { data: urlData } = supabase.storage
                    .from('blog-images')
                    .getPublicUrl(filePath);
                    
                finalImageUrl = urlData.publicUrl;
            }

            publishStatus.textContent = 'Salvando artigo...';

            const { error: insertError } = await supabase
                .from('blog_posts')
                .insert([
                    { 
                        title: title, 
                        excerpt: excerpt, 
                        category: category, 
                        image_url: finalImageUrl, 
                        content: content,
                        seo_tags: seoTags
                    }
                ]);

            if (insertError) {
                publishStatus.textContent = 'Erro ao publicar: ' + insertError.message;
                publishStatus.className = 'error-msg';
            } else {
                publishStatus.textContent = 'Artigo publicado com sucesso! 🎉';
                publishStatus.className = 'success-msg';
                postForm.reset();
                if (quillEditor) quillEditor.setText('');
            }
            
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Publicar Artigo';
        });
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
                    ['bold', 'italic', 'underline'],
                    [{ 'align': [] }],
                    ['link'],
                    [{ 'font': [] }],
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    ['clean']
                ]
            },
            placeholder: 'Escreva seu artigo aqui...'
        });
    }

    // Iniciar verificação
    checkSession();
});
