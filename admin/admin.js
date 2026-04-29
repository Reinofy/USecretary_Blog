// Configuração do Supabase
const SUPABASE_URL = 'https://croheciuxhtifejhcwws.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyb2hlY2l1eGh0aWZlamhjd3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYxNTgsImV4cCI6MjA4NjEyMjE1OH0.Fqt9ushsPnS6iQX7oGjeFtKfxyIK5iyVEBY5HCa5d1c';

// Inicializa o cliente do Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos da UI
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const postForm = document.getElementById('post-form');
const publishStatus = document.getElementById('publish-status');

// Verifica se o usuário já está logado ao carregar a página
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }
}

// Fazer Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error');
    
    errorMsg.style.display = 'none';
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorMsg.textContent = 'Erro ao fazer login: ' + error.message;
        errorMsg.style.display = 'block';
    } else {
        showDashboard();
    }
});

// Fazer Logout
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLogin();
});

// Salvar Artigo
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value;
    const excerpt = document.getElementById('post-excerpt').value;
    const category = document.getElementById('post-category').value;
    const imageUrl = document.getElementById('post-image').value;
    const content = document.getElementById('post-content').value;
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

    const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([
            { 
                title: title, 
                excerpt: excerpt, 
                category: category, 
                image_url: imageUrl, 
                content: content 
            }
        ]);

    if (insertError) {
        publishStatus.textContent = 'Erro ao publicar: ' + insertError.message;
        publishStatus.className = 'error-msg';
    } else {
        publishStatus.textContent = 'Artigo publicado com sucesso! 🎉';
        publishStatus.className = 'success-msg';
        postForm.reset();
    }
    
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Publicar Artigo';
});

function showLogin() {
    loginScreen.style.display = 'block';
    dashboardScreen.style.display = 'none';
}

function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
}

// Iniciar verificação
checkSession();
