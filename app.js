import { auth, db } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, increment, arrayUnion, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, onSnapshot, writeBatch, deleteField } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Elementos da UI ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoDiv = document.getElementById('user-info');
const userPhotoBorder = document.getElementById('user-photo-border');
const userNameSpan = document.getElementById('user-name');
const userPhotoImg = document.getElementById('user-photo');
const adminLink = document.getElementById('admin-link');
const profileLink = document.getElementById('profile-link');
const welcomeMessage = document.getElementById('welcome-message');
const mainMenu = document.getElementById('main-menu');
const difficultySelection = document.getElementById('difficulty-selection');
const initialScreen = document.getElementById('initial-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('quiz-progress-bar');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedback = document.getElementById('feedback');
const reference = document.getElementById('reference');
const nextBtn = document.getElementById('next-btn');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const groupsContainer = document.getElementById('groups-container');
const groupsList = document.getElementById('groups-list');
const createGroupBtn = document.getElementById('create-group-btn');
const createGroupModal = document.getElementById('create-group-modal');
const groupNameInput = document.getElementById('group-name-input');
const groupDifficultySelect = document.getElementById('group-difficulty-select');
const saveGroupBtn = document.getElementById('save-group-btn');
const cancelGroupBtn = document.getElementById('cancel-group-btn');
const groupPlayNotification = document.getElementById('group-play-notification');
const groupPlayName = document.getElementById('group-play-name');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const rankingCard = document.getElementById('ranking-card');
const rankingModal = document.getElementById('ranking-modal');
const rankingTbody = document.getElementById('ranking-tbody');
const closeRankingBtn = document.getElementById('close-ranking-btn');
const leaveQuizBtn = document.getElementById('leave-quiz-btn');
const dobModal = document.getElementById('dob-modal');
const dobInput = document.getElementById('dob-input');
const saveDobBtn = document.getElementById('save-dob-btn');
const bibleCard = document.getElementById('bible-card');
const bibleModal = document.getElementById('bible-modal');
const closeBibleBtn = document.getElementById('close-bible-btn');
const bibleBookSelect = document.getElementById('bible-book-select');
const bibleChapterSelect = document.getElementById('bible-chapter-select');
const loadChapterBtn = document.getElementById('load-chapter-btn');
const bibleTextDisplay = document.getElementById('bible-text-display');
const competitionCard = document.getElementById('competition-card');
const competitionLobbyModal = document.getElementById('competition-lobby-modal');
const closeLobbyBtn = document.getElementById('close-lobby-btn');
const showCreateCompetitionBtn = document.getElementById('show-create-competition-btn');
const joinCodeInput = document.getElementById('join-code-input');
const joinCompetitionBtn = document.getElementById('join-competition-btn');
const createCompetitionModal = document.getElementById('create-competition-modal');
const competitionDifficultySelect = document.getElementById('competition-difficulty-select');
const competitionQuestionsSelect = document.getElementById('competition-questions-select');
const competitionMinPlayersInput = document.getElementById('competition-min-players-input');
const createCompetitionBtn = document.getElementById('create-competition-btn');
const cancelCreateCompetitionBtn = document.getElementById('cancel-create-competition-btn');
const waitingRoomModal = document.getElementById('waiting-room-modal');
const inviteCodeDisplay = document.getElementById('invite-code-display');
const startCompetitionBtn = document.getElementById('start-competition-btn');
const leaveWaitingRoomBtn = document.getElementById('leave-waiting-room-btn');
const teamAzulBox = document.getElementById('team-azul');
const teamAmareloBox = document.getElementById('team-amarelo');
const teamAzulList = document.getElementById('team-azul-list');
const teamAmareloList = document.getElementById('team-amarelo-list');
const chatMessagesDiv = document.getElementById('chat-messages');
const chatFormWaitingRoom = document.getElementById('chat-form-waiting-room');
const chatInputWaitingRoom = document.getElementById('chat-input-waiting-room');
const startRequirementMessage = document.getElementById('start-requirement-message');

// Novos elementos para a tela de resultados da competição
const competitionResultScreen = document.getElementById('competition-result-screen');
const competitionResultTitle = document.getElementById('competition-result-title');
const competitionResultCode = document.getElementById('competition-result-code');
const competitionRankingTbody = document.getElementById('competition-ranking-tbody');
const playAgainCompetitionBtn = document.getElementById('play-again-competition-btn');
const returnToLobbyBtn = document.getElementById('return-to-lobby-btn');

// Novos elementos para o timer e botão de finalizar tentativa
const competitionTimerDiv = document.getElementById('competition-timer');
const timeLeftSpan = document.getElementById('time-left');
const finishAttemptBtn = document.getElementById('finish-attempt-btn');


// --- Estado do Quiz e Usuário ---
let currentUser = null;
let currentUserAgeGroup = "adulto";
let questions = [];
let currentQuestionIndex = 0;
let score = 0; // Pontuação para o quiz atual do usuário, seja individual ou em competição
let correctAnswersCount = 0; // Contagem de respostas corretas para o quiz atual
let currentGroupId = null; // ID do grupo se for um quiz de grupo
let quizAtualDifficulty = 'facil'; // Dificuldade do quiz atual
let activeCompetitionId = null; // ID da competição ativa
let competitionData = null; // Para armazenar os dados da competição ativa
let unsubscribeCompetition = null; // Listener do Firestore para a competição
let unsubscribeChat = null; // Listener do Firestore para o chat da competição
let quizTimer = null; // Variável para o timer da competição
let timeLeft = 0; // Tempo restante para o quiz da competição
let competitionResultsUnsubscribe = null; // Listener para atualização em tempo real dos resultados


// --- Dados da Bíblia ---
const bibleBooks = {
    "Gênesis": 50, "Êxodo": 40, "Levítico": 27, "Números": 36, "Deuteronômio": 34, "Josué": 24, "Juízes": 21, "Rute": 4, "1 Samuel": 31, "2 Samuel": 24, "1 Reis": 22, "2 Reis": 25, "1 Crônicas": 29, "2 Crônicas": 36, "Esdras": 10, "Neemias": 13, "Ester": 10, "Jó": 42, "Salmos": 150, "Provérbios": 31, "Eclesiastes": 12, "Cantares": 8, "Isaías": 66, "Jeremias": 52, "Lamentações": 5, "Ezequiel": 48, "Daniel": 12, "Oseias": 14, "Joel": 3, "Amós": 9, "Obadias": 1, "Jonas": 4, "Miqueias": 7, "Naum": 3, "Habacuque": 3, "Sofonias": 3, "Ageu": 2, "Zacarias": 14, "Malaquias": 4, "Mateus": 28, "Marcos": 16, "Lucas": 24, "João": 21, "Atos": 28, "Romanos": 16, "1 Coríntios": 16, "2 Coríntios": 13, "Gálatas": 6, "Efésios": 6, "Filipenses": 4, "Colossenses": 4, "1 Tessalonicenses": 5, "2 Tessalonicenses": 3, "1 Timóteo": 6, "2 Timóteo": 4, "Tito": 3, "Filemom": 1, "Hebreus": 13, "Tiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 João": 5, "2 João": 1, "3 João": 1, "Judas": 1, "Apocalipse": 22
};

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const groupIdFromUrl = urlParams.get('groupId');
    const difficultyFromUrl = urlParams.get('difficulty');
    const competitionIdFromUrl = urlParams.get('competitionId'); // Nova: para deep linking em competições

    if (groupIdFromUrl) {
        sessionStorage.setItem('currentGroupId', groupIdFromUrl);
        if (difficultyFromUrl) {
            sessionStorage.setItem('currentGroupDifficulty', difficultyFromUrl);
        }
    } else if (competitionIdFromUrl) { // Se houver competitionId na URL, tentamos carregar a competição
        sessionStorage.setItem('activeCompetitionId', competitionIdFromUrl);
    }


    if (window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: cleanUrl}, '', cleanUrl);
    }
    populateBookSelect();
});

// --- Funções ---
function getAgeGroup(birthDateString) {
    if (!birthDateString) return "adulto";
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    if (age >= 6 && age <= 10) return "crianca";
    if (age >= 11 && age <= 16) return "adolescente";
    return "adulto";
}

function switchScreen(newScreenId) {
    document.querySelectorAll('.screen, .modal').forEach(screen => { // Inclui .modal para garantir que todos os modais sejam escondidos
        if (screen && !screen.classList.contains('hidden') && screen.id !== 'dob-modal') { // Mantém dob-modal visível se necessário
            screen.classList.add('hidden');
            screen.classList.remove('visible'); // Remove a classe 'visible' para modais
        }
    });
    const screenToShow = document.getElementById(newScreenId);
    if (screenToShow) {
        screenToShow.classList.remove('hidden');
        if (screenToShow.classList.contains('modal')) { // Adiciona 'visible' se for um modal
            screenToShow.classList.add('visible');
        }
    }
}

async function updateUiforGroupMode() {
    const groupId = sessionStorage.getItem('currentGroupId');
    if (groupPlayNotification && groupPlayName) {
        if (groupId) {
            try {
                const groupRef = doc(db, 'grupos', groupId);
                const groupDoc = await getDoc(groupRef);
                if (groupDoc.exists()) {
                    groupPlayName.textContent = groupDoc.data().nomeDoGrupo;
                    groupPlayNotification.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Erro ao buscar nome do grupo:", error);
                groupPlayNotification.classList.add('hidden');
            }
        } else {
            groupPlayNotification.classList.add('hidden');
        }
    }
}

const provider = new GoogleAuthProvider();
if (loginBtn) loginBtn.addEventListener('click', () => signInWithPopup(auth, provider).catch(console.error));
if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); signOut(auth).catch(console.error); });

onAuthStateChanged(auth, async (user) => {
    document.body.classList.remove('tema-crianca');
    if (userPhotoBorder) userPhotoBorder.className = 'profile-photo-container';

    if (user) {
        currentUser = user;
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userInfoDiv) userInfoDiv.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (userNameSpan) userNameSpan.textContent = user.displayName || "Jogador";
        if (userPhotoImg) userPhotoImg.src = user.photoURL || "https://placehold.co/45x45/e0e0e0/333?text=?";
        if (profileLink) {
            profileLink.href = `perfil.html?uid=${user.uid}`;
            profileLink.classList.remove('hidden');
        }
        
        const userDoc = await saveUserToFirestore(user);
        await checkAdminStatus(user.uid);
        
        const userData = userDoc.data();

        if (userData.bordaEquipada && userData.bordaEquipada !== 'default') {
            if (userPhotoBorder) userPhotoBorder.classList.add(userData.bordaEquipada);
        }

        if (userData.dataDeNascimento) {
            const birthDate = userData.dataDeNascimento;
            currentUserAgeGroup = getAgeGroup(birthDate);
            if (currentUserAgeGroup === "crianca") {
                document.body.classList.add('tema-crianca');
            }
            if(dobModal) dobModal.classList.remove('visible'); // Esconde o modal se a data já existe
        } else {
            if(dobModal) dobModal.classList.add('visible'); // Mostra o modal se a data não existe
        }

        // Nova lógica para carregar competição de sessão/URL
        const competitionIdFromSession = sessionStorage.getItem('activeCompetitionId');
        if (competitionIdFromSession) {
            activeCompetitionId = competitionIdFromSession;
            const competitionRef = doc(db, 'competicoes', activeCompetitionId);
            const competitionDoc = await getDoc(competitionRef);

            if (competitionDoc.exists()) {
                competitionData = competitionDoc.data();
                if (competitionData.estado === 'aguardando') {
                    showWaitingRoom(currentUser.uid === competitionData.criadorUid);
                } else if (competitionData.estado === 'em_andamento') {
                    // Se o usuário recarregou e a competição está em andamento, redireciona para o quiz
                    startCompetitionQuiz(competitionData.perguntas);
                } else if (competitionData.estado === 'finalizada') {
                    showCompetitionResults(competitionData); // Se já finalizada, mostra os resultados
                }
            } else {
                console.error("Competição da sessão não encontrada.");
                sessionStorage.removeItem('activeCompetitionId'); // Limpa a sessão se a competição não existe
                if (mainMenu) mainMenu.classList.remove('hidden');
                if (welcomeMessage) welcomeMessage.classList.add('hidden');
                await loadUserGroups(user.uid); 
            }
        } else { // Lógica original para grupos e menu inicial
            const groupIdFromSession = sessionStorage.getItem('currentGroupId');
            const groupDifficultyFromSession = sessionStorage.getItem('currentGroupDifficulty');
            if (groupIdFromSession && groupDifficultyFromSession) {
                await updateUiforGroupMode();
                startQuiz(groupDifficultyFromSession);
            } else {
                if (mainMenu) mainMenu.classList.remove('hidden');
                if (welcomeMessage) welcomeMessage.classList.add('hidden');
                await loadUserGroups(user.uid); 
            }
        }
    } else {
        currentUser = null;
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (mainMenu) mainMenu.classList.add('hidden');
        if (welcomeMessage) welcomeMessage.classList.remove('hidden');
        if (adminLink) adminLink.classList.add('hidden');
        if (profileLink) profileLink.classList.add('hidden');
        // Limpa estados de competição ao deslogar
        sessionStorage.removeItem('activeCompetitionId');
        if (unsubscribeCompetition) unsubscribeCompetition();
        if (unsubscribeChat) unsubscribeChat();
        if (quizTimer) clearInterval(quizTimer); // Limpa o timer do quiz ao deslogar
        quizTimer = null;
        if (competitionResultsUnsubscribe) competitionResultsUnsubscribe(); // Limpa o listener de resultados
        competitionResultsUnsubscribe = null;
        activeCompetitionId = null;
        competitionData = null;
        switchScreen('initial-screen');
    }
});

async function saveUserToFirestore(user) {
    const userRef = doc(db, 'usuarios', user.uid);
    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                nome: user.displayName || "Jogador Anônimo",
                email: user.email || "",
                fotoURL: user.photoURL || "https://placehold.co/150x150/e0e0e0/333?text=?",
                admin: false,
                bio: "Novo no Quiz Bíblico!",
                dataDeNascimento: null,
                showInRanking: true,
                stats: { pontuacaoTotal: 0, quizzesJogadosTotal: 0, respostasCertasTotal: 0, respostasErradasTotal: 0 },
                conquistas: [],
                bordasDesbloqueadas: ["default", "simples_azul", "simples_verde", "simples_roxo", "floral_verde", "geometrico_teal", "folhas_violeta", "galhos_cinza"],
                bordaEquipada: "default"
            });
        } else {
            const updateData = {};
            if (user.displayName) updateData.nome = user.displayName;
            if (user.photoURL) updateData.fotoURL = user.photoURL;
            if (Object.keys(updateData).length > 0) {
                await setDoc(userRef, updateData, { merge: true });
            }
        }
        return await getDoc(userRef);
    } catch (error) {
        console.error("Erro ao salvar usuário no Firestore:", error);
    }
}

async function checkAdminStatus(uid) {
    if (!adminLink) return;
    const userRef = doc(db, 'usuarios', uid);
    const userDoc = await getDoc(userRef);
    adminLink.classList.toggle('hidden', !(userDoc.exists() && userDoc.data().admin === true));
}

if(saveDobBtn) {
    saveDobBtn.addEventListener('click', async () => {
        const dobValue = dobInput.value;
        if (!dobValue) {
            alert("Por favor, selecione sua data de nascimento.");
            return;
        }
        if (currentUser) {
            try {
                const userRef = doc(db, 'usuarios', currentUser.uid);
                await updateDoc(userRef, { dataDeNascimento: dobValue });
                currentUserAgeGroup = getAgeGroup(dobValue);
                if (currentUserAgeGroup === 'crianca') {
                    document.body.classList.add('tema-crianca');
                } else {
                    document.body.classList.remove('tema-crianca');
                }
                if(dobModal) dobModal.classList.remove('visible');
            } catch (error) {
                console.error("Erro ao salvar data de nascimento: ", error);
                alert("Não foi possível salvar a data. Tente novamente.");
            }
        }
    });
}

async function loadUserGroups(userId) {
    if (!groupsList) return;
    groupsList.innerHTML = '<p>Carregando seus grupos...</p>';

    try {
        const q = query(collection(db, "grupos"), where("memberUIDs", "array-contains", userId));
        const querySnapshot = await getDocs(q);
        
        groupsList.innerHTML = ''; 

        if (querySnapshot.empty) {
            groupsList.innerHTML = '<p style="text-align: center; color: #666;">Você ainda não faz parte de nenhum grupo.</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const group = doc.data();
            const groupId = doc.id;
            const groupElement = document.createElement('a');
            groupElement.href = `grupo.html?id=${groupId}`;
            groupElement.className = 'group-item';
            
            const memberCountText = group.memberUIDs.length === 1 ? '1 membro' : `${group.memberUIDs.length} membros`;

            groupElement.innerHTML = `
                <span><i class="${group.groupIcon || 'fas fa-users'}" style="margin-right: 8px;"></i> ${group.nomeDoGrupo}</span>
                <span class="member-count">${memberCountText}</span>
            `;
            groupsList.appendChild(groupElement);
        });

    } catch (error) {
        console.error("Erro ao carregar grupos do usuário:", error);
        groupsList.innerHTML = '<p>Ocorreu um erro ao carregar os grupos.</p>';
    }
}


async function awardAchievement(uid, achievementKey) {
    if (!uid || !achievementKey) return;
    const userRef = doc(db, 'usuarios', uid);
    try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && !userDoc.data().conquistas?.includes(achievementKey)) {
            await updateDoc(userRef, {
                conquistas: arrayUnion(achievementKey)
            });
            console.log(`Conquista '${achievementKey}' concedida!`);
        }
    } catch(error) {
        console.error(`Erro ao conceder conquista ${achievementKey}:`, error);
    }
}

if (createGroupBtn) createGroupBtn.addEventListener('click', () => createGroupModal.classList.add('visible'));
if (cancelGroupBtn) cancelGroupBtn.addEventListener('click', () => createGroupModal.classList.remove('visible'));
if (saveGroupBtn) saveGroupBtn.addEventListener('click', async () => {
    if (!groupNameInput || !groupDifficultySelect) return;
    const groupName = groupNameInput.value.trim();
    const groupDifficulty = groupDifficultySelect.value;
    if (groupName.length < 3) {
        alert("O nome do grupo deve ter pelo menos 3 caracteres.");
        return;
    }
    if (!currentUser) {
        alert("Precisa de estar logado para criar um grupo.");
        return;
    }
    saveGroupBtn.disabled = true;
    saveGroupBtn.textContent = 'A criar...';
    try {
        const newGroup = {
            nomeDoGrupo: groupName,
            difficulty: groupDifficulty,
            criadorUid: currentUser.uid,
            criadorNome: currentUser.displayName,
            dataCriacao: serverTimestamp(),
            groupIcon: 'fas fa-book-bible',
            memberUIDs: [currentUser.uid],
            membros: {
                [currentUser.uid]: {
                    uid: currentUser.uid,
                    nome: currentUser.displayName,
                    fotoURL: currentUser.photoURL,
                    pontuacaoNoGrupo: 0
                }
            }
        };
        await addDoc(collection(db, "grupos"), newGroup);
        await awardAchievement(currentUser.uid, 'fundador_de_grupo');
        alert(`Grupo "${groupName}" criado com sucesso!`);
        groupNameInput.value = '';
        createGroupModal.classList.remove('visible');
        await loadUserGroups(currentUser.uid);
    } catch (error) {
        console.error("Erro ao criar grupo:", error);
        alert("Não foi possível criar o grupo.");
    } finally {
        saveGroupBtn.disabled = false;
        saveGroupBtn.textContent = 'Criar';
    }
});

if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => {
    sessionStorage.removeItem('currentGroupId');
    sessionStorage.removeItem('currentGroupDifficulty');
    updateUiforGroupMode();
});

if (rankingCard) rankingCard.addEventListener('click', () => {
    window.location.href = 'ranking.html';
});

if (difficultySelection) difficultySelection.addEventListener('click', (e) => {
    if (e.target.matches('.btn[data-difficulty]')) {
        startQuiz(e.target.dataset.difficulty);
    }
});

async function startQuiz(difficulty) {
    quizAtualDifficulty = difficulty;
    currentGroupId = sessionStorage.getItem('currentGroupId');
    score = 0;
    correctAnswersCount = 0;
    currentQuestionIndex = 0;
    if (nextBtn) nextBtn.classList.add('hidden');
    if (progressBar) progressBar.style.width = '0%';
    // Esconde o timer e o botão de finalizar tentativa para quizzes individuais/grupo
    if (competitionTimerDiv) competitionTimerDiv.classList.add('hidden');
    if (finishAttemptBtn) finishAttemptBtn.classList.add('hidden');

    try {
        const q = query(
            collection(db, "perguntas"), 
            where("nivel", "==", difficulty),
            where("faixaEtaria", "array-contains", currentUserAgeGroup)
        );
        const querySnapshot = await getDocs(q);
        let allQuestions = [];
        querySnapshot.forEach(doc => allQuestions.push({ id: doc.id, ...doc.data() }));
        
        if (allQuestions.length < 10) {
            console.warn(`Poucas perguntas para ${difficulty}/${currentUserAgeGroup}. Buscando em todas as faixas etárias.`);
            const fallbackQuery = query(collection(db, "perguntas"), where("nivel", "==", difficulty));
            const fallbackSnapshot = await getDocs(fallbackQuery);
            fallbackSnapshot.forEach(doc => {
                if (!allQuestions.find(q => q.id === doc.id)) {
                    allQuestions.push({ id: doc.id, ...doc.data() });
                }
            });
        }
        
        questions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
        if (questions.length > 0) {
            switchScreen('quiz-screen');
            displayQuestion();
        } else {
            alert(`Não foram encontradas perguntas para a dificuldade ${difficulty}.`);
            switchScreen('initial-screen');
        }
    } catch (error) {
        console.error("Erro ao buscar perguntas: ", error);
        alert("Ocorreu um erro ao carregar as perguntas.");
    }
}

function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
        // Se todas as perguntas do quiz individual foram respondidas, mostra os resultados.
        // Para competição, a finalização é acionada após a última resposta de todos os jogadores ou pelo timer.
        if (!activeCompetitionId) {
            showResults();
        }
        return;
    }
    const progress = (currentQuestionIndex / questions.length) * 100;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (questionText) questionText.textContent = questions[currentQuestionIndex].enunciado;
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (feedback) feedback.innerHTML = '';
    if (reference) reference.innerHTML = '';
    if (nextBtn) nextBtn.classList.add('hidden'); 
    
    // Mostra o botão "Finalizar Tentativa" apenas se estiver em competição
    if (activeCompetitionId && finishAttemptBtn) {
        finishAttemptBtn.classList.remove('hidden');
    } else if (finishAttemptBtn) {
        finishAttemptBtn.classList.add('hidden'); // Esconde se não estiver em competição
    }

    questions[currentQuestionIndex].alternativas.forEach((alt, index) => {
        const button = document.createElement('button');
        button.textContent = alt;
        button.classList.add('btn', 'option-btn');
        button.dataset.index = index;
        button.addEventListener('click', handleAnswer);
        if (optionsContainer) optionsContainer.appendChild(button);
    });
}

async function handleAnswer(e) {
    Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);
    const selectedButton = e.target;
    const selectedIndex = parseInt(selectedButton.dataset.index);
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correta;
    
    let questionScore = 0;
    if (isCorrect) {
        selectedButton.classList.add('correct');
        if (feedback) feedback.textContent = 'Resposta Correta!';
        questionScore = 10; // Cada pergunta vale 10 pontos
        correctAnswersCount++;
    } else {
        selectedButton.classList.add('wrong');
        if (feedback) feedback.textContent = 'Resposta Errada!';
        optionsContainer.children[question.correta].classList.add('correct');
    }
    score += questionScore; // Acumula pontuação para o quiz individual/grupo

    if (reference) reference.textContent = `Referência: ${question.referencia}`;
    if (nextBtn) nextBtn.classList.remove('hidden');
    if (progressBar) progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;

    // Lógica para competição
    if (activeCompetitionId && currentUser) {
        const competitionRef = doc(db, 'competicoes', activeCompetitionId);
        const participantPath = `participantes.${currentUser.uid}`;
        
        // Usa um batch write para atualização atômica da pontuação e respostas do participante
        const batch = writeBatch(db);
        batch.update(competitionRef, {
            [`${participantPath}.pontuacao`]: increment(questionScore),
            [`${participantPath}.respostas`]: arrayUnion({
                questionIndex: currentQuestionIndex,
                answeredCorrectly: isCorrect,
                selectedOption: selectedIndex
            })
        });
        await batch.commit(); // Confirma o batch write

        // Verifica se esta é a última pergunta para o usuário atual
        if (currentQuestionIndex + 1 === questions.length) {
            // Se o usuário terminou todas as perguntas, ele não precisa mais do timer local.
            if (quizTimer) {
                clearInterval(quizTimer);
                quizTimer = null;
            }
            // O botão "Finalizar Tentativa" permanece visível até a tela mudar.
            
            // Força a finalização da tentativa do jogador e transiciona para resultados
            await endCompetitionForcefully();
        }
    }
}

if (nextBtn) nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    displayQuestion();
});

// Listener para o novo botão "Finalizar Tentativa"
if (finishAttemptBtn) {
    finishAttemptBtn.addEventListener('click', async () => {
        if (confirm("Deseja finalizar sua tentativa agora? Sua pontuação será calculada com as respostas enviadas até o momento.")) {
            if (quizTimer) {
                clearInterval(quizTimer); // Para o timer imediatamente
                quizTimer = null;
            }
            if (finishAttemptBtn) finishAttemptBtn.classList.add('hidden'); // Esconde o botão
            await endCompetitionForcefully(); // Força a finalização da tentativa do jogador
        }
    });
}

async function showResults() {
    switchScreen('result-screen');
    if (finalScore) finalScore.textContent = score;
    const motivationalMessage = document.getElementById('motivational-message');
    if (motivationalMessage) motivationalMessage.textContent = '"Combati o bom combate, acabei a carreira, guardei a fé." - 2 Timóteo 4:7';
    if (!currentUser) return;
    try {
        const userRef = doc(db, 'usuarios', currentUser.uid);
        const wrongAnswersCount = questions.length - correctAnswersCount;
        
        const updates = {};
        const pontuacaoFieldName = `pontuacao${quizAtualDifficulty.charAt(0).toUpperCase() + quizAtualDifficulty.slice(1)}`;
        const quizzesJogadosFieldName = `quizzesJogados${quizAtualDifficulty.charAt(0).toUpperCase() + quizAtualDifficulty.slice(1)}`;
        const respostasCertasFieldName = `respostasCertas${quizAtualDifficulty.charAt(0).toUpperCase() + quizAtualDifficulty.slice(1)}`;
        const respostasErradasFieldName = `respostasErradas${quizAtualDifficulty.charAt(0).toUpperCase() + quizAtualDifficulty.slice(1)}`;

        updates["stats.pontuacaoTotal"] = increment(score);
        updates["stats.quizzesJogadosTotal"] = increment(1);
        updates["stats.respostasCertasTotal"] = increment(correctAnswersCount);
        updates["stats.respostasErradasTotal"] = increment(wrongAnswersCount);
        updates[`stats.${pontuacaoFieldName}`] = increment(score);
        updates[`stats.${quizzesJogadosFieldName}`] = increment(1);
        updates[`stats.${respostasCertasFieldName}`] = increment(correctAnswersCount);
        updates[`stats.${respostasErradasFieldName}`] = increment(wrongAnswersCount);

        await updateDoc(userRef, updates);

        if (currentGroupId) {
            const groupRef = doc(db, 'grupos', currentGroupId);
            await updateDoc(groupRef, {
                [`membros.${currentUser.uid}.pontuacaoNoGrupo`]: increment(score)
            });
        }
        await checkAndAwardAchievements(userRef, score, correctAnswersCount);
    } catch (error) {
        console.error("Erro ao atualizar estatísticas:", error);
    }
}

async function checkAndAwardAchievements(userRef, currentQuizScore, currentQuizCorrectAnswers, competitionRank = null) {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;
    const userData = userDoc.data();
    const userAchievements = new Set(userData.conquistas || []);
    let newAchievements = [];
    const stats = userData.stats;

    // Conquistas baseadas em quizzes individuais/grupo
    if (!userAchievements.has("iniciante_da_fe") && (stats.quizzesJogadosTotal || 0) >= 1) newAchievements.push("iniciante_da_fe");
    if (!userAchievements.has("peregrino_fiel") && (stats.quizzesJogadosTotal || 0) >= 10) newAchievements.push("peregrino_fiel");
    if (!userAchievements.has("discipulo_dedicado") && (stats.quizzesJogadosTotal || 0) >= 50) newAchievements.push("discipulo_dedicado");
    if (!userAchievements.has("veterano_da_palavra") && (stats.quizzesJogadosTotal || 0) >= 100) newAchievements.push("veterano_da_palavra");
    if (!userAchievements.has("erudito_aprendiz") && (stats.pontuacaoTotal || 0) >= 1000) newAchievements.push("erudito_aprendiz");
    if (!userAchievements.has("sabio_de_israel") && (stats.pontuacaoTotal || 0) >= 5000) newAchievements.push("sabio_de_israel");
    if (!userAchievements.has("conselheiro_real") && (stats.pontuacaoTotal || 0) >= 10000) newAchievements.push("conselheiro_real");
    if (!userAchievements.has("patriarca_do_saber") && (stats.pontuacaoTotal || 0) >= 25000) newAchievements.push("patriarca_do_saber");
    if (!userAchievements.has("mestre_da_palavra") && (stats.respostasCertasTotal || 0) >= 100) newAchievements.push("mestre_da_palavra");
    if (!userAchievements.has("escriba_habil") && (stats.respostasCertasTotal || 0) >= 500) newAchievements.push("escriba_habil");
    if (!userAchievements.has("doutor_da_lei") && (stats.respostasCertasTotal || 0) >= 1000) newAchievements.push("doutor_da_lei");
    if (!userAchievements.has("quase_la") && currentQuizScore >= 90 && currentQuizScore < 100) newAchievements.push("quase_la"); // Ajustado para ser 'quase lá'
    if (!userAchievements.has("perfeccionista") && currentQuizScore === 100) newAchievements.push("perfeccionista");
    if (!userAchievements.has("impecavel") && currentQuizCorrectAnswers === questions.length && questions.length > 0) newAchievements.push("impecavel");
    if (!userAchievements.has("explorador_facil") && (stats.pontuacaoFacil || 0) >= 1000) newAchievements.push("explorador_facil");
    if (!userAchievements.has("desafiante_medio") && (stats.pontuacaoMedio || 0) >= 1000) newAchievements.push("desafiante_medio");
    if (!userAchievements.has("estrategista_dificil") && (stats.pontuacaoDificil || 0) >= 1000) newAchievements.push("estrategista_dificil");
    if (currentGroupId && !userAchievements.has("competidor")) newAchievements.push("competidor");

    // Conquistas baseadas no ranking da competição
    if (competitionRank !== null) {
        if (competitionRank === 1 && !userAchievements.has('competicao_ouro')) newAchievements.push('competicao_ouro');
        if (competitionRank === 2 && !userAchievements.has('competicao_prata')) newAchievements.push('competicao_prata');
        if (competitionRank === 3 && !userAchievements.has('competicao_bronze')) newAchievements.push('competicao_bronze');
        if (competitionRank === 4 && !userAchievements.has('competicao_honra')) newAchievements.push('competicao_honra');
    }

    if (newAchievements.length > 0) {
        await updateDoc(userRef, { conquistas: arrayUnion(...newAchievements) });
        setTimeout(() => {
            alert(`Parabéns! Você desbloqueou ${newAchievements.length} nova(s) conquista(s)!`);
        }, 500);
    }
}


if (leaveQuizBtn) {
    leaveQuizBtn.addEventListener('click', () => {
        if (confirm("Tem certeza de que deseja sair do quiz? O seu progresso nesta partida não será salvo.")) {
            // Se estiver em competição, também precisa sair da competição
            if (activeCompetitionId) {
                leaveWaitingRoom(); // Esta função já cuida da remoção do participante/fechamento da sala
            }
            sessionStorage.removeItem('currentGroupId');
            sessionStorage.removeItem('currentGroupDifficulty');
            sessionStorage.removeItem('activeCompetitionId'); // Garante que a competição seja limpa
            updateUiforGroupMode();
            switchScreen('initial-screen');
            if (mainMenu) mainMenu.classList.remove('hidden');
            if (welcomeMessage) welcomeMessage.classList.add('hidden');
            if (quizTimer) clearInterval(quizTimer); // Limpa o timer do quiz
            quizTimer = null;
            if (competitionResultsUnsubscribe) competitionResultsUnsubscribe(); // Limpa o listener de resultados
            competitionResultsUnsubscribe = null;
        }
    });
}

if (restartBtn) restartBtn.addEventListener('click', () => {
    sessionStorage.removeItem('currentGroupId');
    sessionStorage.removeItem('currentGroupDifficulty');
    sessionStorage.removeItem('activeCompetitionId');
    updateUiforGroupMode();
    switchScreen('initial-screen');
    if (mainMenu) mainMenu.classList.remove('hidden');
    if (welcomeMessage) welcomeMessage.classList.add('hidden');
    if (quizTimer) clearInterval(quizTimer); // Limpa o timer do quiz
    quizTimer = null;
    if (competitionResultsUnsubscribe) competitionResultsUnsubscribe(); // Limpa o listener de resultados
    competitionResultsUnsubscribe = null;
});

function populateBookSelect() {
    if (!bibleBookSelect) return;
    bibleBookSelect.innerHTML = '';
    for (const book in bibleBooks) {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        bibleBookSelect.appendChild(option);
    }
    populateChapterSelect();
}
function populateChapterSelect() {
    if (!bibleBookSelect || !bibleChapterSelect) return;
    const selectedBook = bibleBookSelect.value;
    const chapterCount = bibleBooks[selectedBook];
    bibleChapterSelect.innerHTML = '';
    for (let i = 1; i <= chapterCount; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Capítulo ${i}`;
        bibleChapterSelect.appendChild(option);
    }
}
async function loadChapterText() {
    if (!bibleBookSelect || !bibleChapterSelect || !bibleTextDisplay) return;
    const book = bibleBookSelect.value;
    const chapter = bibleChapterSelect.value;
    const apiUrl = `https://bible-api.com/${book} ${chapter}?translation=almeida`;
    bibleTextDisplay.innerHTML = `<p>Carregando ${book} ${chapter}...</p>`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Não foi possível carregar o texto.');
        const data = await response.json();
        let chapterHtml = `<h3>${data.reference}</h3>`;
        data.verses.forEach(verse => {
            chapterHtml += `<p><strong>${verse.verse}</strong> ${verse.text}</p>`;
        });
        bibleTextDisplay.innerHTML = chapterHtml;
    } catch (error) {
        console.error("Erro ao buscar capítulo da Bíblia:", error);
        bibleTextDisplay.innerHTML = `<p style="color: red;">Erro ao carregar o capítulo. Tente novamente.</p>`;
    }
}
if (bibleCard) bibleCard.addEventListener('click', () => { if (bibleModal) bibleModal.classList.add('visible'); });
if (closeBibleBtn) closeBibleBtn.addEventListener('click', () => { if (bibleModal) bibleModal.classList.remove('visible'); });
if (bibleBookSelect) bibleBookSelect.addEventListener('change', populateChapterSelect);
if (loadChapterBtn) loadChapterBtn.addEventListener('click', loadChapterText);

// --- Lógica da Competição ---
if (competitionCard) competitionCard.addEventListener('click', () => {
    if(competitionLobbyModal) competitionLobbyModal.classList.add('visible');
});
if (closeLobbyBtn) closeLobbyBtn.addEventListener('click', () => {
    if(competitionLobbyModal) competitionLobbyModal.classList.remove('visible');
});
if (showCreateCompetitionBtn) showCreateCompetitionBtn.addEventListener('click', () => {
    if(createCompetitionModal) createCompetitionModal.classList.add('visible');
});
if (cancelCreateCompetitionBtn) cancelCreateCompetitionBtn.addEventListener('click', () => {
    if(createCompetitionModal) createCompetitionModal.classList.remove('visible');
});
if (createCompetitionBtn) createCompetitionBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Você precisa estar logado.");
    
    const difficulty = competitionDifficultySelect.value;
    const numQuestions = parseInt(competitionQuestionsSelect.value);
    const minPlayers = parseInt(competitionMinPlayersInput.value);

    if(minPlayers < 2) {
        alert("O mínimo de participantes deve ser 2 ou mais.");
        return;
    }
    
    createCompetitionBtn.disabled = true;
    createCompetitionBtn.textContent = "Verificando...";

    try {
        const inviteCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        const primaryQuery = query(
            collection(db, "perguntas"),
            where("nivel", "==", difficulty),
            where("faixaEtaria", "array-contains", currentUserAgeGroup)
        );
        const primarySnapshot = await getDocs(primaryQuery);
        let allAvailableQuestions = primarySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (allAvailableQuestions.length < numQuestions) {
            console.warn(`Poucas perguntas para ${difficulty}/${currentUserAgeGroup}. Buscando em todas as faixas etárias.`);
            const fallbackQuery = query(collection(db, "perguntas"), where("nivel", "==", difficulty));
            const fallbackSnapshot = await getDocs(fallbackQuery);
            
            fallbackSnapshot.forEach(doc => {
                if (!allAvailableQuestions.find(q => q.id === doc.id)) {
                    allAvailableQuestions.push({ id: doc.id, ...doc.data() });
                }
            });
        }

        if (allAvailableQuestions.length < numQuestions) {
            throw new Error(`Não há perguntas suficientes para esta configuração. Encontradas: ${allAvailableQuestions.length}, Necessárias: ${numQuestions}.`);
        }

        const competitionQuestions = allAvailableQuestions.sort(() => 0.5 - Math.random()).slice(0, numQuestions);

        const competitionRef = await addDoc(collection(db, "competicoes"), {
            codigoConvite: inviteCode,
            criadorUid: currentUser.uid,
            estado: "aguardando",
            dificuldade: difficulty,
            numPerguntas: numQuestions,
            perguntas: competitionQuestions,
            minParticipantes: minPlayers,
            participantes: {
                [currentUser.uid]: {
                    nome: currentUser.displayName,
                    fotoURL: currentUser.photoURL,
                    pontuacao: 0,
                    respostas: [],
                    team: null // 'azul' or 'amarelo'
                }
            },
            dataCriacao: serverTimestamp()
        });
        activeCompetitionId = competitionRef.id;
        sessionStorage.setItem('activeCompetitionId', activeCompetitionId); // Salva na sessão
        showWaitingRoom(true);

    } catch (error) {
        console.error("Erro ao criar competição:", error);
        alert(error.message);
    } finally {
        createCompetitionBtn.disabled = false;
        createCompetitionBtn.textContent = "Criar Sala";
        if(createCompetitionModal) createCompetitionModal.classList.remove('visible');
        if(competitionLobbyModal) competitionLobbyModal.classList.remove('visible');
    }
});
if (joinCompetitionBtn) joinCompetitionBtn.addEventListener('click', async () => {
    if (!currentUser) return alert("Você precisa estar logado.");
    
    const code = joinCodeInput.value.trim().toUpperCase();
    if (code.length < 5) return alert("Código inválido.");

    joinCompetitionBtn.disabled = true;
    joinCompetitionBtn.textContent = "...";

    try {
        const q = query(collection(db, "competicoes"), where("codigoConvite", "==", code), where("estado", "==", "aguardando"));
        const competitionSnapshot = await getDocs(q);

        if (competitionSnapshot.empty) {
            throw new Error("Sala não encontrada ou já iniciada.");
        }

        const competitionDoc = competitionSnapshot.docs[0];
        const competitionRef = doc(db, 'competicoes', competitionDoc.id);

        // Verifica se o usuário já está no jogo
        if (competitionDoc.data().participantes && competitionDoc.data().participantes[currentUser.uid]) {
            alert("Você já está nesta sala!");
            activeCompetitionId = competitionDoc.id;
            sessionStorage.setItem('activeCompetitionId', activeCompetitionId);
            showWaitingRoom(currentUser.uid === competitionDoc.data().criadorUid);
            return;
        }

        await updateDoc(competitionRef, {
            [`participantes.${currentUser.uid}`]: {
                nome: currentUser.displayName,
                fotoURL: currentUser.photoURL,
                pontuacao: 0,
                respostas: [],
                team: null
            }
        });
        activeCompetitionId = competitionDoc.id;
        sessionStorage.setItem('activeCompetitionId', activeCompetitionId);
        showWaitingRoom(false);

    } catch (error) {
        console.error("Erro ao entrar na competição:", error);
        alert(error.message);
    } finally {
        joinCompetitionBtn.disabled = false;
        joinCompetitionBtn.textContent = "Entrar";
        joinCodeInput.value = '';
        if(competitionLobbyModal) competitionLobbyModal.classList.remove('visible');
    }
});

async function selectTeam(team) {
    if(!activeCompetitionId || !currentUser) return;
    const competitionRef = doc(db, 'competicoes', activeCompetitionId);
    try {
        await updateDoc(competitionRef, {
            [`participantes.${currentUser.uid}.team`]: team
        });
    } catch(error) {
        console.error("Erro ao selecionar equipe:", error);
    }
}

teamAzulBox.addEventListener('click', () => selectTeam('azul'));
teamAmareloBox.addEventListener('click', () => selectTeam('amarelo'));

function showWaitingRoom(isCreator) {
    switchScreen('waiting-room-modal'); // Garante que o modal esteja visível

    // Esconde/mostra o botão de iniciar competição apenas para o criador
    if(startCompetitionBtn) {
        startCompetitionBtn.classList.toggle('hidden', !isCreator);
    }

    if (unsubscribeCompetition) unsubscribeCompetition();

    unsubscribeCompetition = onSnapshot(doc(db, 'competicoes', activeCompetitionId), (docSnapshot) => {
        if (!docSnapshot.exists()) {
            alert("A sala de competição foi fechada pelo criador.");
            leaveWaitingRoom(false); // Não tenta remover de novo, apenas limpa
            return;
        }

        competitionData = docSnapshot.data(); // Atualiza os dados da competição
        if(inviteCodeDisplay) inviteCodeDisplay.textContent = competitionData.codigoConvite;
        
        // Limpa listas
        teamAzulList.innerHTML = '';
        teamAmareloList.innerHTML = '';

        const participantes = competitionData.participantes || {};
        const participantesArray = Object.values(participantes).filter(p => p !== null); // Filtra participantes nulos
        
        // Ordena participantes para exibição consistente
        participantesArray.sort((a, b) => a.nome.localeCompare(b.nome));

        participantesArray.forEach((player) => {
            const playerElement = document.createElement('li');
            playerElement.innerHTML = `<img src="${player.fotoURL || 'https://placehold.co/30x30/e0e0e0/333?text=?'}" alt="Foto de ${player.nome}"> <span>${player.nome}</span>`;
            if(player.team === 'azul') {
                teamAzulList.appendChild(playerElement);
            } else if (player.team === 'amarelo') {
                teamAmareloList.appendChild(playerElement);
            } else {
                 // Pode adicionar a uma seção de "Aguardando equipe" se houver uma no HTML
            }
        });

        const myTeam = participantes[currentUser.uid]?.team;
        teamAzulBox.classList.toggle('selected', myTeam === 'azul');
        teamAmareloBox.classList.toggle('selected', myTeam === 'amarelo');


        // Lógica para habilitar o botão de início
        if(isCreator && startCompetitionBtn) {
            const playerCount = participantesArray.length;
            // Verifica se todos os participantes têm um time atribuído, se a competição for de times
            const allPlayersHaveTeam = participantesArray.every(p => p.team !== null);

            if(playerCount >= competitionData.minParticipantes && allPlayersHaveTeam) {
                startCompetitionBtn.disabled = false;
                startRequirementMessage.classList.add('hidden');
            } else {
                startCompetitionBtn.disabled = true;
                let message = `São necessários pelo menos ${competitionData.minParticipantes} jogadores para começar. Atuais: ${playerCount}.`;
                if (!allPlayersHaveTeam) {
                    message += " Todos os jogadores devem escolher uma equipe.";
                }
                startRequirementMessage.textContent = message;
                startRequirementMessage.classList.remove('hidden');
            }
        }

        if (competitionData.estado === 'em_andamento') {
            if (unsubscribeCompetition) unsubscribeCompetition();
            if(waitingRoomModal) waitingRoomModal.classList.remove('visible');
            alert("A competição vai começar!");
            startCompetitionQuiz(competitionData.perguntas);
        } else if (competitionData.estado === 'finalizada') {
            // Se a competição for finalizada enquanto em sala de espera, mostra resultados
            if (unsubscribeCompetition) unsubscribeCompetition();
            showCompetitionResults(competitionData);
        }
    });

    listenToChat();
}

function listenToChat() {
    if (unsubscribeChat) unsubscribeChat();
    const messagesRef = collection(db, 'competicoes', activeCompetitionId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        if(!chatMessagesDiv) return;
        chatMessagesDiv.innerHTML = '';
        snapshot.forEach(doc => {
            const message = doc.data();
            const messageEl = document.createElement('div');
            messageEl.classList.add('chat-message');
            if(message.uid === currentUser.uid) {
                messageEl.classList.add('my-message');
            }
            messageEl.innerHTML = `
                <span class="message-sender">${message.senderName}</span>
                <div class="message-bubble">${message.text}</div>
            `;
            chatMessagesDiv.appendChild(messageEl);
        });
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    });
}

if(chatFormWaitingRoom) {
    chatFormWaitingRoom.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o comportamento padrão do formulário
        e.stopImmediatePropagation(); // Impede que outros listeners do mesmo evento sejam chamados

        const messageText = chatInputWaitingRoom.value.trim();
        if(messageText.length === 0 || !currentUser || !activeCompetitionId) return;

        chatInputWaitingRoom.value = ''; // Limpa o input imediatamente
        chatInputWaitingRoom.disabled = true; // Desabilita para evitar múltiplos envios enquanto processa

        try {
            const messagesRef = collection(db, 'competicoes', activeCompetitionId, 'messages');
            await addDoc(messagesRef, {
                text: messageText,
                uid: currentUser.uid,
                senderName: currentUser.displayName,
                timestamp: serverTimestamp()
            });
        } catch(error) {
            console.error("Erro ao enviar mensagem:", error);
            alert("Não foi possível enviar a sua mensagem. Tente novamente."); // Alerta o usuário
            chatInputWaitingRoom.value = messageText; // Retorna a mensagem ao input se falhar
        } finally {
            chatInputWaitingRoom.disabled = false; // Reabilita o input
            chatInputWaitingRoom.focus(); // Coloca o foco de volta no input
        }
    });
}

function startCompetitionQuiz(competitionQuestions) {
    score = 0; // Pontuação para o quiz atual do usuário na competição
    correctAnswersCount = 0;
    currentQuestionIndex = 0;
    questions = competitionQuestions; // As perguntas da competição são carregadas aqui

    if (nextBtn) nextBtn.classList.add('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (competitionTimerDiv) competitionTimerDiv.classList.remove('hidden'); // Mostra o timer
    if (finishAttemptBtn) finishAttemptBtn.classList.remove('hidden'); // Mostra o botão de finalizar tentativa


    if (questions.length > 0) {
        switchScreen('quiz-screen');
        // Define o tempo limite com base no número de perguntas (1 minuto por pergunta)
        timeLeft = competitionQuestions.length * 60; 
        startQuizTimer(); // Inicia o timer
        displayQuestion();
    } else {
        alert("Erro: Nenhuma pergunta foi carregada para a competição.");
        switchScreen('initial-screen');
        sessionStorage.removeItem('activeCompetitionId'); // Limpa a sessão
        activeCompetitionId = null;
    }
}

function startQuizTimer() {
    updateTimerDisplay(); // Atualiza o display imediatamente

    if (quizTimer) clearInterval(quizTimer); // Limpa qualquer timer existente

    quizTimer = setInterval(async () => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(quizTimer);
            quizTimer = null;
            alert("Tempo esgotado! A competição será finalizada.");
            await endCompetitionForcefully(); // Força a finalização quando o tempo acaba
        }
    }, 1000); // Atualiza a cada segundo
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    if (timeLeftSpan) {
        timeLeftSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

async function endCompetition() {
    if (!activeCompetitionId || !currentUser) return;

    const competitionRef = doc(db, 'competicoes', activeCompetitionId);
    
    try {
        // Atualiza o estado da competição para 'finalizada'
        await updateDoc(competitionRef, {
            estado: 'finalizada',
            dataTermino: serverTimestamp()
        });
        
        // A onSnapshot em showWaitingRoom (ou um novo listener) lidará com a transição
        // para showCompetitionResults quando o estado for 'finalizada'.
        // Não chamamos showCompetitionResults diretamente aqui para que a UI seja reativa ao Firestore.
    } catch (error) {
        console.error("Erro ao finalizar competição:", error);
        alert("Ocorreu um erro ao finalizar a competição.");
    }
}

async function endCompetitionForcefully() {
    if (!activeCompetitionId || !currentUser) return;

    const competitionRef = doc(db, 'competicoes', activeCompetitionId);
    const participantPath = `participantes.${currentUser.uid}`;

    try {
        // Busca os dados mais recentes da competição para obter numPerguntas
        const currentCompDoc = await getDoc(competitionRef);
        if (currentCompDoc.exists()) {
            const currentCompData = currentCompDoc.data();
            const numQuestionsInCompetition = currentCompData.numPerguntas;
            const currentUserResponses = currentCompData.participantes[currentUser.uid]?.respostas || [];

            // Se o usuário não respondeu a todas as perguntas, preenche as respostas restantes
            // para que o contador de respostas seja igual ao total de perguntas.
            // Isso garante que ele seja considerado "finalizado" para o cálculo do ranking.
            if (currentUserResponses.length < numQuestionsInCompetition) {
                const missingResponsesCount = numQuestionsInCompetition - currentUserResponses.length;
                const dummyResponses = Array(missingResponsesCount).fill({ answeredCorrectly: false, selectedOption: -1, questionIndex: -1 });
                
                // Cria um novo array combinando as respostas existentes com as respostas "dummy"
                const updatedResponses = [...currentUserResponses, ...dummyResponses];

                await updateDoc(competitionRef, {
                    [`${participantPath}.respostas`]: updatedResponses
                });
            }
        }
    } catch (error) {
        console.error("Erro ao forçar finalização do participante:", error);
    }

    // Após garantir que as respostas do jogador foram atualizadas,
    // verifica se todos os participantes terminaram e, se sim, finaliza a competição.
    // Independentemente disso, o jogador atual é levado para a tela de resultados.
    const latestCompetitionDoc = await getDoc(competitionRef);
    if (latestCompetitionDoc.exists()) {
        const latestCompetitionData = latestCompetitionDoc.data();
        const participants = latestCompetitionData.participantes || {};
        const numQuestionsInCompetition = latestCompetitionData.numPerguntas;

        let allParticipantsFinished = true;
        for (const uid in participants) {
            if (participants[uid] && participants[uid].respostas.length < numQuestionsInCompetition) {
                allParticipantsFinished = false;
                break;
            }
        }

        if (allParticipantsFinished) {
            await endCompetition(); // Aciona o fim da competição para todos
        }
        showCompetitionResults(latestCompetitionData); // Leva o jogador atual para a tela de resultados
    }
}


async function showCompetitionResults(competitionData) {
    switchScreen('competition-result-screen');
    if (competitionResultCode) competitionResultCode.textContent = `Código da Sala: ${competitionData.codigoConvite}`;
    
    // Limpa o timer do quiz se estiver ativo
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }
    // Esconde o timer e o botão de finalizar tentativa
    if (competitionTimerDiv) competitionTimerDiv.classList.add('hidden');
    if (finishAttemptBtn) finishAttemptBtn.classList.add('hidden');

    // Limpa o listener de resultados anterior, se houver
    if (competitionResultsUnsubscribe) competitionResultsUnsubscribe();

    // Configura um listener em tempo real para o documento da competição para atualizar os resultados
    const competitionRef = doc(db, 'competicoes', activeCompetitionId);
    competitionResultsUnsubscribe = onSnapshot(competitionRef, async (docSnapshot) => { // Adicionado async aqui
        if (!docSnapshot.exists()) {
            console.error("Competição não encontrada durante a atualização de resultados.");
            if (competitionResultsUnsubscribe) competitionResultsUnsubscribe();
            competitionResultsUnsubscribe = null; // Garante que a variável seja limpa
            return;
        }
        const latestCompetitionData = docSnapshot.data();
        if (competitionRankingTbody) {
            competitionRankingTbody.innerHTML = '';

            const participants = Object.values(latestCompetitionData.participantes || {}).filter(p => p !== null);
            // Ordena os participantes pela pontuação em ordem decrescente
            participants.sort((a, b) => b.pontuacao - a.pontuacao);

            let rank = 1;
            for (const participant of participants) {
                const row = document.createElement('tr');
                let rankClass = '';
                let borderClass = '';

                // Lógica para as bordas e classes de ranking
                if (rank === 1) { rankClass = 'rank-1'; borderClass = 'borda_competicao_ouro'; }
                else if (rank === 2) { rankClass = 'rank-2'; borderClass = 'borda_competicao_prata'; }
                else if (rank === 3) { rankClass = 'rank-3'; borderClass = 'borda_competicao_bronze'; }
                else if (rank === 4) { rankClass = 'rank-4'; borderClass = 'borda_competicao_honra'; }
                
                row.innerHTML = `
                    <td class="rank ${rankClass}">${rank}</td>
                    <td class="member-info">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="profile-photo-container ${borderClass}" style="width: 40px; height: 40px; padding: 2px;">
                                <img src="${participant.fotoURL || 'https://placehold.co/40x40'}" alt="Foto de ${participant.nome}" style="width: 100%; height: 100%;">
                            </div>
                            <span>${participant.nome}</span>
                        </div>
                    </td>
                    <td class="score">${participant.pontuacao}</td>
                    <td>${participant.team ? (participant.team === 'azul' ? 'Azul' : 'Amarelo') : 'N/A'}</td>
                `;
                competitionRankingTbody.appendChild(row);

                // Conceder conquistas de competição (apenas para o usuário logado)
                if (currentUser && participant.uid === currentUser.uid) {
                    const userRef = doc(db, 'usuarios', currentUser.uid);
                    await checkAndAwardAchievements(userRef, participant.pontuacao, participant.respostas.filter(r => r.answeredCorrectly).length, rank);
                }
                rank++;
            }
        }
    });

    // Apenas o criador pode "Jogar Novamente"
    if (playAgainCompetitionBtn) {
        playAgainCompetitionBtn.classList.toggle('hidden', currentUser.uid !== competitionData.criadorUid);
    }
}


if(startCompetitionBtn) startCompetitionBtn.addEventListener('click', async () => {
    if(!activeCompetitionId) return;
    const competitionRef = doc(db, 'competicoes', activeCompetitionId);
    await updateDoc(competitionRef, { estado: 'em_andamento' });
});

if(leaveWaitingRoomBtn) leaveWaitingRoomBtn.addEventListener('click', () => leaveWaitingRoom(true)); // Passa true para indicar que é uma saída voluntária
async function leaveWaitingRoom(voluntaryExit = true) {
    const isCreator = competitionData && currentUser.uid === competitionData.criadorUid;

    if (voluntaryExit && isCreator) {
        if(confirm("Você é o criador da sala. Sair irá fechar a sala para todos. Deseja continuar?")) {
            const competitionRef = doc(db, 'competicoes', activeCompetitionId);
            // Deletar a subcoleção 'messages' antes de deletar o documento da competição
            const messagesRef = collection(competitionRef, 'messages');
            const messageDocs = await getDocs(messagesRef);
            const batch = writeBatch(db);
            messageDocs.forEach(doc => {
                batch.delete(doc.ref);
            });
            batch.delete(competitionRef); // Adiciona a exclusão do documento principal
            await batch.commit(); 
        } else {
            return; // O criador cancelou a saída
        }
    } else if (voluntaryExit && !isCreator) {
        // Se um participante normal sai, ele é removido da lista
        const competitionRef = doc(db, 'competicoes', activeCompetitionId);
        // Use deleteField para remover o participante específico
        await updateDoc(competitionRef, {
            [`participantes.${currentUser.uid}`]: deleteField() 
        });
    }

    // Limpa os listeners e estados
    if (unsubscribeCompetition) unsubscribeCompetition();
    if (unsubscribeChat) unsubscribeChat();
    if (quizTimer) clearInterval(quizTimer); // Limpa o timer do quiz
    quizTimer = null;
    if (competitionResultsUnsubscribe) competitionResultsUnsubscribe(); // Limpa o listener de resultados
    competitionResultsUnsubscribe = null;

    sessionStorage.removeItem('activeCompetitionId');
    activeCompetitionId = null;
    competitionData = null;
    switchScreen('initial-screen');
    if (mainMenu) mainMenu.classList.remove('hidden');
    if (welcomeMessage) welcomeMessage.classList.add('hidden');
    if (currentUser) {
        await loadUserGroups(currentUser.uid); // Recarrega os grupos do usuário
    }
}

if (playAgainCompetitionBtn) {
    playAgainCompetitionBtn.addEventListener('click', async () => {
        if (!activeCompetitionId || !currentUser || currentUser.uid !== competitionData.criadorUid) {
            alert("Apenas o criador da sala pode iniciar uma nova rodada.");
            return;
        }

        // Reinicia a competição
        const competitionRef = doc(db, 'competicoes', activeCompetitionId);
        
        // Resetar participantes e estado, mas manter o código e perguntas
        const resetParticipants = {};
        Object.keys(competitionData.participantes).forEach(uid => {
            const participant = competitionData.participantes[uid];
            if (participant) { // Garante que participantes que saíram não sejam reiniciados
                resetParticipants[uid] = {
                    nome: participant.nome,
                    fotoURL: participant.fotoURL,
                    pontuacao: 0,
                    respostas: [],
                    team: participant.team // Mantém a equipe selecionada
                };
            }
        });

        try {
            await updateDoc(competitionRef, {
                estado: 'aguardando',
                participantes: resetParticipants,
                dataTermino: null // Limpa a data de término
            });
            // Após redefinir o estado, explicitamente leva o criador de volta à sala de espera
            showWaitingRoom(true); 
        } catch (error) {
            console.error("Erro ao reiniciar competição:", error);
            alert("Não foi possível reiniciar a competição.");
        }
    });
}

if (returnToLobbyBtn) {
    returnToLobbyBtn.addEventListener('click', async () => {
        // Limpa o timer do quiz se estiver ativo
        if (quizTimer) {
            clearInterval(quizTimer);
            quizTimer = null;
        }
        // Esconde o timer e o botão de finalizar tentativa
        if (competitionTimerDiv) competitionTimerDiv.classList.add('hidden');
        if (finishAttemptBtn) finishAttemptBtn.classList.add('hidden');
        // Limpa o listener de resultados
        if (competitionResultsUnsubscribe) competitionResultsUnsubscribe();
        competitionResultsUnsubscribe = null;

        // Sempre retorna para a tela inicial (menu principal)
        sessionStorage.removeItem('activeCompetitionId');
        activeCompetitionId = null;
        competitionData = null; // Limpa os dados da competição
        switchScreen('initial-screen');
        if (mainMenu) mainMenu.classList.remove('hidden');
        if (welcomeMessage) welcomeMessage.classList.add('hidden');
        if (currentUser) {
            await loadUserGroups(currentUser.uid);
        }
    });
}


// --- Lógica do Modal de Doação PIX ---
const donateCard = document.getElementById('donate-card');
const donateModal = document.getElementById('donate-modal');
const closeDonateModalBtn = document.getElementById('close-donate-modal');
const copyPixKeyBtn = document.getElementById('copy-pix-key-btn');
const pixKeyText = document.getElementById('pix-key-text');

if (donateCard) {
    donateCard.addEventListener('click', () => {
        donateModal.classList.add('visible');
    });
}

if (closeDonateModalBtn) {
    closeDonateModalBtn.addEventListener('click', () => {
        donateModal.classList.remove('visible');
    });
}

if (copyPixKeyBtn) {
    copyPixKeyBtn.addEventListener('click', () => {
        document.execCommand('copy', false, pixKeyText.value); // Usando document.execCommand para compatibilidade com iframe
        copyPixKeyBtn.textContent = 'Copiado!';
        setTimeout(() => {
            copyPixKeyBtn.textContent = 'Copiar';
        }, 2000);
    });
}

// Fecha o modal se o usuário clicar fora dele
window.addEventListener('click', (event) => {
    if (event.target == donateModal) {
        donateModal.classList.remove('visible');
    }
});
