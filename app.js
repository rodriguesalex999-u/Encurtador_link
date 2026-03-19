// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAW5H3ig6CAcQvu172Vs_vofENAxno0dUw",
    authDomain: "rastreamento-link.firebaseapp.com",
    projectId: "rastreamento-link",
    storageBucket: "rastreamento-link.firebasestorage.app",
    messagingSenderId: "523190695978",
    appId: "1:523190695978:web:6da253d22a693c16b36b53"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('🔥 Firebase pronto!');

// AGUARDAR DOM CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado!');
    
    const linkForm = document.getElementById('linkForm');
    const urlInput = document.getElementById('urlInput');
    const slugInput = document.getElementById('slugInput');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    console.log('📋 Elementos:', { 
        form: !!linkForm, 
        url: !!urlInput, 
        slug: !!slugInput 
    });
    
    if (!linkForm) {
        console.error('❌ Formulário não encontrado!');
        return;
    }
    
    // REMOVER EVENT LISTENERS ANTIGOS
    const newForm = linkForm.cloneNode(true);
    linkForm.parentNode.replaceChild(newForm, linkForm);
    
    // PEGAR OS NOVOS ELEMENTOS
    const newUrlInput = document.getElementById('urlInput');
    const newSlugInput = document.getElementById('slugInput');
    const newErrorMessage = document.getElementById('errorMessage');
    const newErrorText = document.getElementById('errorText');
    
    // ADICIONAR EVENT LISTENER NOVO
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🚀 Submit disparado!');
        
        const url = newUrlInput.value.trim();
        const slug = newSlugInput.value.trim();
        
        console.log('📝 Dados:', { url, slug });
        
        if (!url || !slug) {
            if (newErrorText) newErrorText.textContent = 'Preencha todos os campos';
            if (newErrorMessage) newErrorMessage.classList.remove('hidden');
            return;
        }
        
        if (!url.startsWith('http')) {
            if (newErrorText) newErrorText.textContent = 'URL deve começar com http:// ou https://';
            if (newErrorMessage) newErrorMessage.classList.remove('hidden');
            return;
        }
        
        try {
            console.log('📤 Enviando para Firebase...');
            
            // Verificar se slug existe
            const existing = await db.collection('links').where('slug', '==', slug).get();
            if (!existing.empty) {
                throw new Error('Slug já existe');
            }
            
            // Criar link
            const docRef = await db.collection('links').add({
                url_original: url,
                slug: slug,
                cliques: 0,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Link criado! ID:', docRef.id);
            alert('✅ Link criado com sucesso!');
            
            newUrlInput.value = '';
            newSlugInput.value = '';
            
            // Esconder erro se estiver visível
            if (newErrorMessage) newErrorMessage.classList.add('hidden');
            
            // Recarregar lista
            carregarLinks();
            
        } catch (error) {
            console.error('❌ Erro:', error);
            if (newErrorText) newErrorText.textContent = error.message;
            if (newErrorMessage) newErrorMessage.classList.remove('hidden');
        }
    });
    
    console.log('✅ Event listener registrado!');
    
    // Carregar links ao iniciar
    carregarLinks();
});

// ============================================
// FUNÇÕES GLOBAIS (fora do DOMContentLoaded)
// ============================================

// Função para carregar links
async function carregarLinks() {
    try {
        const snapshot = await db.collection('links').orderBy('created_at', 'desc').get();
        console.log('📊 Links carregados:', snapshot.size);
        
        const linksList = document.getElementById('linksList');
        const emptyState = document.getElementById('emptyState');
        const loadingState = document.getElementById('loadingState');
        const linksCount = document.getElementById('linksCount');
        
        if (loadingState) loadingState.classList.add('hidden');
        
        if (snapshot.empty) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (linksList) linksList.classList.add('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (linksList) linksList.classList.remove('hidden');
            
            let html = '';
            snapshot.forEach(doc => {
                const link = doc.data();
                const linkId = doc.id;
                const linkCompleto = `${window.location.origin}/${link.slug}`;
                
                html += `
                    <div class="border rounded-lg p-4 bg-white hover:shadow-lg transition">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div class="flex-1">
                                <!-- LINK CLICÁVEL -->
                                <div class="flex items-center gap-2">
                                    <a href="/${link.slug}" target="_blank" 
                                       class="text-lg font-bold text-blue-600 hover:text-blue-800 hover:underline">
                                        /${link.slug}
                                    </a>
                                    <button onclick="copiarLink('${link.slug}')" 
                                            class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100" 
                                            title="Copiar link">
                                        📋
                                    </button>
                                </div>
                                
                                <!-- URL de destino (também clicável) -->
                                <a href="${link.url_original}" target="_blank" 
                                   class="text-sm text-gray-600 hover:text-blue-600 hover:underline block truncate">
                                    ${link.url_original}
                                </a>
                                
                                <!-- ESTATÍSTICAS MELHORADAS -->
                                <div class="flex items-center gap-4 mt-2">
                                    <!-- CONTADOR DE CLIQUES EM DESTAQUE -->
                                    <span class="inline-flex items-center gap-1 text-sm font-semibold ${link.cliques > 0 ? 'text-green-600' : 'text-gray-400'}">
                                        <span class="text-lg">👁️</span>
                                        <span>${link.cliques || 0}</span>
                                        <span class="text-xs font-normal text-gray-500 ml-1">clique${link.cliques !== 1 ? 's' : ''}</span>
                                    </span>
                                    
                                    <!-- DATA DE CRIAÇÃO -->
                                    <span class="inline-flex items-center gap-1 text-xs text-gray-400">
                                        <span>📅</span>
                                        <span>${formatarData(link.created_at)}</span>
                                    </span>
                                </div>
                            </div>
                            
                            <!-- Botões de ação -->
                            <div class="flex gap-2">
                                <a href="/${link.slug}" target="_blank" 
                                   class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center gap-1">
                                    <span>🔗</span> Abrir
                                </a>
                                <button onclick="excluirLink('${doc.id}')" 
                                        class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center gap-1">
                                    <span>🗑️</span> Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            linksList.innerHTML = html;
            
            if (linksCount) {
                linksCount.textContent = `${snapshot.size} ${snapshot.size === 1 ? 'link' : 'links'}`;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar links:', error);
    }
}

// Função para copiar link
function copiarLink(slug) {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ Link copiado!');
    }).catch(() => {
        alert('❌ Erro ao copiar');
    });
}

// Função para excluir link
async function excluirLink(id) {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    
    try {
        await db.collection('links').doc(id).delete();
        alert('✅ Link excluído!');
        carregarLinks(); // Recarregar a lista
    } catch (error) {
        alert('❌ Erro ao excluir: ' + error.message);
    }
}

// Função para formatar data
function formatarData(timestamp) {
    if (!timestamp) return 'data desconhecida';
    
    try {
        let data;
        if (timestamp.toDate) {
            data = timestamp.toDate();
        } else {
            data = new Date(timestamp);
        }
        
        const hoje = new Date();
        const diff = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
        
        if (diff === 0) return 'hoje';
        if (diff === 1) return 'ontem';
        if (diff < 7) return `há ${diff} dias`;
        if (diff < 30) return `há ${Math.floor(diff / 7)} semanas`;
        return `há ${Math.floor(diff / 30)} meses`;
    } catch (e) {
        return 'data desconhecida';
    }
}

// Tornar funções disponíveis globalmente
window.copiarLink = copiarLink;
window.excluirLink = excluirLink;