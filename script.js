document.addEventListener('DOMContentLoaded', () => {
    const messageTextContentElement = document.getElementById('message-text-content');
    const choicesAreaElement = document.getElementById('choices-area');
    const feedbackTextElement = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizAreaElement = document.getElementById('quiz-area');
    const resultAreaElement = document.getElementById('result-area');
    const restartBtn = document.getElementById('restart-btn');
    const progressBarElement = document.getElementById('progress-bar');
    const progressTextElement = document.getElementById('progress-text');
    const currentScoreValueElement = document.getElementById('current-score-value');
    const currentScoreDisplayElement = document.querySelector('.current-score-display');
    
    const attributedSpeakerNameElement = document.getElementById('attributed-speaker-name');
    const attributionQuestionArea = document.getElementById('attribution-question');

    const prevMessageContainer = document.getElementById('prev-message-container');
    const prevSpeakerNameElement = document.getElementById('prev-speaker-name');
    const prevMessageTextElement = document.getElementById('prev-message-text');
    const nextMessageContainer = document.getElementById('next-message-container');
    const nextSpeakerNameElement = document.getElementById('next-speaker-name');
    const nextMessageTextElement = document.getElementById('next-message-text');

    const resultIconContainer = document.getElementById('result-icon-container');
    const resultRankTitleElement = document.getElementById('result-rank-title');
    const finalScoreValueElement = document.getElementById('final-score-value');
    const totalQuestionsOnResultElement = document.getElementById('total-questions-on-result');
    const resultMessageElement = document.getElementById('result-message');
    
    const appContainer = document.querySelector('.app-container');

    let allQuizData = []; 
    let currentQuizSet = []; 
    let currentQuestionIndex = 0;
    let score = 0;
    const TARGET_NUM_QUESTIONS = 10;
    const QUIZ_DATA_FILE = "misattributed_context_quiz_data.json"; 

    async function initializeQuiz() {
        // App container entrance animation is primarily handled by CSS
        // Adding a class via JS can ensure it triggers after JS is ready if needed
        if(appContainer) {
             setTimeout(() => appContainer.classList.add('loaded'), 50); // Small delay for CSS to potentially catch up
        }

        try {
            const response = await fetch(QUIZ_DATA_FILE);
            if (!response.ok) throw new Error(`HTTP error! Quiz data not found (${QUIZ_DATA_FILE}). Status: ${response.status}`);
            allQuizData = await response.json(); 
            if (!Array.isArray(allQuizData) || allQuizData.length === 0) {
                displayError("クイズデータが見つからないか、形式が正しくありません。");
                return;
            }
            prepareNewQuizSet(); 
            startGame();
        } catch (error) {
            console.error("クイズデータの読み込みまたは初期化に失敗:", error);
            displayError(`クイズの読み込みに失敗しました: ${error.message}. JSONファイル(${QUIZ_DATA_FILE})を確認してください。`);
        }
    }

    function prepareNewQuizSet() {
        let shuffledData = shuffleArray([...allQuizData]); 
        currentQuizSet = shuffledData.slice(0, TARGET_NUM_QUESTIONS); 
        if (currentQuizSet.length === 0 && allQuizData.length > 0) {
             currentQuizSet = shuffledData.slice(0, allQuizData.length); 
        }
    }
    
    function displayError(message) { 
        quizAreaElement.innerHTML = `<p class="error-message">${message}</p>`;
        quizAreaElement.style.display = 'block';
        resultAreaElement.style.display = 'none';
        const header = document.querySelector('.quiz-header');
        if(header) header.style.display = 'none';
    }

    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        if(currentScoreValueElement) currentScoreValueElement.textContent = '0';
        if(currentScoreDisplayElement) currentScoreDisplayElement.classList.remove('score-updated');
        
        resultAreaElement.style.display = 'none';
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { 
            // Reset animation classes if they are added dynamically
            resultCard.style.opacity = '0';
            resultCard.style.transform = 'translateY(30px) scale(0.95)';
            // Ensure CSS animation is ready to play again
            resultCard.style.animation = 'none'; 
            resultCard.offsetHeight; // Trigger reflow to reset animation
            resultCard.style.animation = ''; 
        }
        
        quizAreaElement.style.display = 'block';
        if(attributionQuestionArea) attributionQuestionArea.style.display = 'block'; 
        choicesAreaElement.className = 'choices-container binary-choices'; 

        nextQuestionBtn.style.display = 'none';
        feedbackTextElement.textContent = '';
        feedbackTextElement.className = 'feedback-text'; 
        
        if (currentQuizSet.length === 0) {
            displayError("出題できるクイズがありません。");
            return;
        }
        updateProgress();
        displayQuestion();
    }

    function displayQuestion() {
        // Reset animations for elements that might re-appear
        feedbackTextElement.className = 'feedback-text';
        // Potentially reset message bubble animations if added

        if (currentQuestionIndex < currentQuizSet.length) {
            const q = currentQuizSet[currentQuestionIndex];
            
            if (q.prev_message_text && prevMessageContainer) {
                prevSpeakerNameElement.textContent = q.prev_speaker_display || "";
                prevMessageTextElement.innerHTML = q.prev_message_text.replace(/\n/g, '<br>');
                prevMessageContainer.style.display = 'block';
            } else if (prevMessageContainer) {
                prevMessageContainer.style.display = 'none';
                prevSpeakerNameElement.textContent = "";
                prevMessageTextElement.innerHTML = "";
            }

            messageTextContentElement.innerHTML = q.main_quote_text.replace(/\n/g, '<br>');
            
            if (q.next_message_text && nextMessageContainer) {
                nextSpeakerNameElement.textContent = q.next_speaker_display || "";
                nextMessageTextElement.innerHTML = q.next_message_text.replace(/\n/g, '<br>');
                nextMessageContainer.style.display = 'block';
            } else if (nextMessageContainer) {
                nextMessageContainer.style.display = 'none';
                nextSpeakerNameElement.textContent = "";
                nextMessageTextElement.innerHTML = "";
            }
            
            if(attributedSpeakerNameElement) attributedSpeakerNameElement.textContent = q.attributed_speaker_display;
            if(attributionQuestionArea) attributionQuestionArea.style.display = 'block';

            choicesAreaElement.innerHTML = ''; 
            const yesButton = document.createElement('button');
            yesButton.textContent = "はい、この人の発言！";
            yesButton.dataset.answer = "yes";
            yesButton.addEventListener('click', () => handleAnswer("yes"));
            choicesAreaElement.appendChild(yesButton);

            const noButton = document.createElement('button');
            noButton.textContent = "いいえ、違う人の発言！";
            noButton.dataset.answer = "no";
            noButton.addEventListener('click', () => handleAnswer("no"));
            choicesAreaElement.appendChild(noButton);
            
            nextQuestionBtn.style.display = 'none';
        } else {
            showResults();
        }
    }

    function handleAnswer(userChoice) {
        const currentQuestion = currentQuizSet[currentQuestionIndex];
        const isCorrectAttribution = currentQuestion.is_attribution_correct;
        const attributedSpeaker = currentQuestion.attributed_speaker_display;
        const actualSpeaker = currentQuestion.main_quote_actual_speaker_display;

        const buttons = choicesAreaElement.getElementsByTagName('button');
        for (let btn of buttons) {
            btn.disabled = true;
        }
        
        let answeredCorrectly = false;

        if (userChoice === "yes") {
            if (isCorrectAttribution) {
                answeredCorrectly = true;
                feedbackTextElement.textContent = `正解！これは本当に ${attributedSpeaker} さんの発言でした！🎉`;
            } else {
                feedbackTextElement.textContent = `残念！これは ${attributedSpeaker} さんの発言ではありません。実は ${actualSpeaker} さんのものでした。`;
            }
        } else if (userChoice === "no") {
            if (!isCorrectAttribution) {
                answeredCorrectly = true;
                feedbackTextElement.textContent = `お見事！これは ${attributedSpeaker} さんの発言ではありませんでした。（正解は ${actualSpeaker} さんです）👍`;
            } else {
                feedbackTextElement.textContent = `残念！これは本当に ${attributedSpeaker} さんの発言でした。`;
            }
        }
        
        feedbackTextElement.className = 'feedback-text visible'; // Make visible first
        if (answeredCorrectly) {
            score++;
            if(currentScoreValueElement) currentScoreValueElement.textContent = score;
            if(currentScoreDisplayElement) {
                currentScoreDisplayElement.classList.add('score-updated');
                setTimeout(() => currentScoreDisplayElement.classList.remove('score-updated'), 300);
            }
            feedbackTextElement.classList.add('correct');
            Array.from(buttons).find(btn => btn.dataset.answer === userChoice)?.classList.add('correct');
            if (typeof confetti === 'function') {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.65 }, zIndex: 10000, scalar: 1.1 });
            }
        } else {
            feedbackTextElement.classList.add('wrong');
            Array.from(buttons).find(btn => btn.dataset.answer === userChoice)?.classList.add('wrong');
            feedbackTextElement.classList.add('feedback-text-shake');
            setTimeout(() => {
                feedbackTextElement.classList.remove('feedback-text-shake');
            }, 400); 
        }
        nextQuestionBtn.style.display = 'inline-flex';
    }

    function updateProgress() {
        const totalQuestionsInSet = currentQuizSet.length;
        if (totalQuestionsInSet > 0) {
            const progressPercentage = ((currentQuestionIndex) / totalQuestionsInSet) * 100;
            progressBarElement.style.width = `${progressPercentage}%`;
            progressTextElement.textContent = `問題 ${currentQuestionIndex + 1} / ${totalQuestionsInSet}`;
        } else {
            progressBarElement.style.width = `0%`;
            progressTextElement.textContent = `問題 - / -`;
        }
    }

    function showResults() {
        quizAreaElement.style.display = 'none';
        if(attributionQuestionArea) attributionQuestionArea.style.display = 'none';
        resultAreaElement.style.display = 'block'; 
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { 
            resultCard.style.opacity = '0'; // Reset for animation
            resultCard.style.transform = 'translateY(30px) scale(0.95)';
            resultCard.style.animation = 'none'; 
            resultCard.offsetHeight; 
            resultCard.style.animation = ''; 
        }
        
        const totalAnswered = currentQuizSet.length;
        totalQuestionsOnResultElement.textContent = totalAnswered;
        let rank = '', rankTitle = '', message = '', iconClass = ''; 
        const percentage = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

        if (score === totalAnswered && totalAnswered > 0) { 
            rank = 'splus'; rankTitle = "中毒お疲れ🤡";
            message = "全問正解！あなたは全てを見通す千里眼の持ち主！";
            iconClass = 'fas fa-crown'; 
            if (typeof confetti === 'function') { 
                setTimeout(() => { 
                     confetti({ particleCount: 250, spread: 180, origin: { y: 0.25 }, angle: 270, drift: 0.1, gravity: 0.7, zIndex: 10000, scalar: 1.3, ticks: 300, colors: ['#FFD700', '#FF69B4', '#8A2BE2', '#000000'] });
                     confetti({ particleCount: 200, spread: 160, origin: { y: 0.35 }, zIndex: 10000, ticks: 300, colors: ['#FFFFFF', '#4B0082', '#FF0000'] });
                }, 700);
            }
        } else if (percentage >= 90) {
            rank = 's'; rankTitle = "真のトークマスター";
            message = "ほぼ完璧！あなたの前では、どんな些細な発言も見逃されませんね。まさに神業！";
            iconClass = 'fas fa-award'; 
        } else if (percentage >= 80) {
            rank = 'aplus'; rankTitle = "トークマスター";
            message = "お見事！その洞察力、まさに達人の域です！";
            iconClass = 'fas fa-medal'; 
        } else if (percentage >= 70) { 
            rank = 'a'; rankTitle = "発言ソムリエ";
            message = "お見事！的確な分析力、流石です。トークの機微を心得ていますね！";
            iconClass = 'fas fa-glasses'; 
        } else if (percentage >= 60) {
            rank = 'bplus'; rankTitle = "事情通エージェント";
            message = "かなり詳しいですね！重要情報を見抜くスパイの素質アリ…かも？";
            iconClass = 'fas fa-user-secret'; 
        } else if (percentage >= 40) {
            rank = 'b'; rankTitle = "うわさ好きの隣人";
            message = "おっと、聞き耳を立ててました？ゴシップの香りがしますよ…もう少しで核心に迫れたのに！";
            iconClass = 'fas fa-magnifying-glass'; 
        } else if (percentage >= 20) {
            rank = 'c'; rankTitle = "迷宮のコメンテーター";
            message = "あれれ…？そのコメント、どの次元から…？大丈夫、きっと明日は違う電波を受信できますよ。たぶん。";
            iconClass = 'fas fa-broadcast-tower'; 
        } else { 
            rank = 'd'; rankTitle = "異世界チャッター"; 
            message = "…もしかして、まだチュートリアルでした？心配ご無用！誰だって最初はそんなものです（と、思いたい）。さぁ、深呼吸してもう一度！";
            iconClass = 'fas fa-egg'; 
        }
        
        resultIconContainer.className = `result-icon-container rank-${rank}`; 
        resultIconContainer.innerHTML = `<i class="${iconClass}"></i>`;
        resultRankTitleElement.textContent = rankTitle;
        resultRankTitleElement.className = `result-rank-title rank-${rank}`; 
        resultMessageElement.textContent = message;
        animateValue(finalScoreValueElement, 0, score, 700 + score * 50);
        progressBarElement.style.width = '100%';
        progressTextElement.textContent = `全 ${totalAnswered} 問完了！`;
    }
    
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) { window.requestAnimationFrame(step); }
        };
        window.requestAnimationFrame(step);
    }

    function shuffleArray(array) { 
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    function randomRange(min, max) { return Math.random() * (max - min) + min; }
    
    document.getElementById('current-year').textContent = new Date().getFullYear();
    nextQuestionBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < currentQuizSet.length) {
            displayQuestion();
            updateProgress(); 
        } else {
            progressBarElement.style.width = '100%'; 
            progressTextElement.textContent = `結果を計算中...`; 
            showResults();
        }
    });
    restartBtn.addEventListener('click', () => {
        prepareNewQuizSet(); 
        startGame();
    });
    initializeQuiz();
});
