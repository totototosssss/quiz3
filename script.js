document.addEventListener('DOMContentLoaded', () => {
    const messageTextContentElement = document.getElementById('message-text-content');
    const choicesAreaElement = document.getElementById('choices-area');
    const feedbackTextElement = document.getElementById('feedback-text');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizAreaElement = document.getElementById('quiz-area');
    const resultAreaElement = document.getElementById('result-display-area');
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
        if(appContainer) {
             setTimeout(() => appContainer.classList.add('loaded'), 50);
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
            resultCard.style.opacity = '0';
            resultCard.style.transform = 'translateY(30px) scale(0.95)';
            resultCard.style.animation = 'none'; 
            resultCard.offsetHeight; 
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
        feedbackTextElement.className = 'feedback-text';
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
            yesButton.innerHTML = `<span>はい、この人の発言！</span>`;
            yesButton.dataset.answer = "yes";
            yesButton.addEventListener('click', () => handleAnswer("yes"));
            choicesAreaElement.appendChild(yesButton);

            const noButton = document.createElement('button');
            noButton.innerHTML = `<span>いいえ、違う人の発言！</span>`;
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
                feedbackTextElement.textContent = `残念…！これは ${attributedSpeaker} さんの発言ではありませんでした。本当は ${actualSpeaker} さんのセリフです。`;
            }
        } else if (userChoice === "no") {
            if (!isCorrectAttribution) {
                answeredCorrectly = true;
                feedbackTextElement.textContent = `お見事！その通り、 ${attributedSpeaker} さんの発言ではありませんでした！（本当は ${actualSpeaker} さんです）👍`;
            } else {
                feedbackTextElement.textContent = `ありゃ、これは本当に ${attributedSpeaker} さんの発言だったんですよ。`;
            }
        }
        
        feedbackTextElement.className = 'feedback-text visible'; 
        if (answeredCorrectly) {
            score++;
            if(currentScoreValueElement) currentScoreValueElement.textContent = score;
            if(currentScoreDisplayElement) {
                currentScoreDisplayElement.classList.add('score-updated');
                setTimeout(() => currentScoreDisplayElement.classList.remove('score-updated'), 300);
            }
            feedbackTextElement.classList.add('correct');
            Array.from(buttons).find(btn => btn.dataset.answer === userChoice)?.classList.add('correct');
            if (typeof confetti === 'function' && score < TARGET_NUM_QUESTIONS) {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 10000, scalar: 1.15, angle: randomRange(75,105) });
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

    // --- 結果表示 (称号・メッセージ大幅更新) ---
    function showResults() {
        quizAreaElement.style.display = 'none';
        if(attributionQuestionArea) attributionQuestionArea.style.display = 'none';
        resultAreaElement.style.display = 'block'; 
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { 
            resultCard.style.opacity = '0'; 
            resultCard.style.transform = 'translateY(30px) scale(0.95)';
            resultCard.style.animation = 'none'; 
            resultCard.offsetHeight; 
            resultCard.style.animation = ''; 
        }
        
        const totalAnswered = currentQuizSet.length;
        totalQuestionsOnResultElement.textContent = totalAnswered;
        let rank = '', rankTitle = '', message = '', iconClass = ''; 
        const correctAnswers = score;

        // ★★★ 新しいランクとメッセージ定義 ★★★
        switch (correctAnswers) {
            case 10:
                rank = 'godlike'; rankTitle = "中毒お疲れ様です🤡";
                message = "全問パーフェクト！…あなた、このトーク履歴がないと生きていけない体になってませんか？日常生活、ちゃんと送れてます？マジで心配です（棒読み）。";
                iconClass = 'fas fa-skull-crossbones';
                if (typeof confetti === 'function') {
                    const end = Date.now() + (3.5 * 1000); 
                    const colors = ['#1f2937', '#5e5af9', '#f59e0b', '#ef4444', '#f3e5f5', '#7b1fa2'];

                    (function frame() {
                        confetti({
                            particleCount: 7, angle: 60, spread: 75, origin: { x: 0, y: 0.6 },
                            colors: colors, scalar: Math.random() * 0.7 + 0.8, drift: Math.random() * 0.7 - 0.35, zIndex:10000
                        });
                        confetti({
                            particleCount: 7, angle: 120, spread: 75, origin: { x: 1, y: 0.6 },
                            colors: colors, scalar: Math.random() * 0.7 + 0.8, drift: Math.random() * -0.7 + 0.35, zIndex:10000
                        });
                        if (Date.now() < end) { requestAnimationFrame(frame); }
                    }());
                    setTimeout(() => { 
                        confetti({ particleCount: 200, spread: 150, origin: { y: 0.55 }, colors: colors, scalar: 1.4, zIndex: 10001, ticks: 350 });
                    }, 300);
                     setTimeout(() => { 
                        confetti({ particleCount: 100, spread: 180, origin: { y: 0.45 }, colors: ['#FFFFFF', '#fef08a'], scalar: 0.9, shapes: ['star'], zIndex: 10002, ticks: 250 });
                    }, 600);
                }
                break;
            case 9:
                rank = 'ss'; rankTitle = "神眼の主";
                message = "おしい！あと一問で中毒者の仲間入り…いや、神の領域でした！その慧眼、常人には理解不能ッ！";
                iconClass = 'fas fa-eye'; 
                break;
            case 8:
                rank = 's'; rankTitle = "トーク賢者";
                message = "驚異的な正解率！あなたは会話の深層心理まで見抜いている…！畏敬の念を禁じ得ません！";
                iconClass = 'fas fa-hat-wizard';
                break;
            case 7:
                rank = 'a_plus'; rankTitle = "超読心術師";
                message = "鋭い！相手の思考が手に取るようにわかるレベルですね！もはや尊敬の対象です。";
                iconClass = 'fas fa-award';
                break;
            case 6:
                rank = 'a'; rankTitle = "名探偵の片鱗";
                message = "なかなかの推理力！重要な手がかりを見逃しませんね。次こそ全貌解明だ！";
                iconClass = 'fas fa-magnifying-glass-plus';
                break;
            case 5:
                rank = 'b_plus'; rankTitle = "聞き耳上手";
                message = "ちょうど半分！会話にはしっかり参加できていますね。…もしかして、盗み聞きも得意だったり？ニヤリ。";
                iconClass = 'fas fa-ear-listen';
                break;
            case 4:
                rank = 'b'; rankTitle = "時々、宇宙と交信";
                message = "うーん、惜しいような、そうでもないような…？大丈夫、たまにはトンチンカンな返事もご愛嬌です！…たぶんね。";
                iconClass = 'fas fa-satellite-dish';
                break;
            case 3:
                rank = 'c_plus'; rankTitle = "天然記念物級の誤解";
                message = "その解釈は新しすぎるッ！もはや芸術の域では…？いや、ただの勘違いか。次、頑張りましょう！";
                iconClass = 'fas fa-monument'; // モニュメントや疑問符など
                break;
            case 2:
                rank = 'c'; rankTitle = "異文化コミュニケーター(自称)";
                message = "…えっと、どこの星の会話ルールでしたっけ？このトークルームでは、もうちょっと…ね？でも、グローバルな視点、大事！";
                iconClass = 'fas fa-user-astronaut';
                break;
            case 1:
                rank = 'd_plus'; rankTitle = "ある意味ミラクル";
                message = "逆にすごい！ここまでくると、もはや何かの才能を感じずにはいられません！…何の才能かは不明ですが。";
                iconClass = 'fas fa-dice-one';
                break;
            case 0:
            default:
                rank = 'd'; rankTitle = "伝説のノーコンタクト";
                message = "全問不正解！おめでとうございます（？）。あなたは誰とも会話が噛み合わないという稀有な才能の持ち主かもしれません！いや、本当にすごい（色んな意味で）。";
                iconClass = 'fas fa-ghost';
                break;
        }
        // ★★★ここまで★★★
        
        resultIconContainer.className = `result-icon-container rank-${rank}`; 
        resultIconContainer.innerHTML = `<i class="${iconClass}"></i>`;
        resultRankTitleElement.textContent = rankTitle;
        resultRankTitleElement.className = `result-rank-title rank-${rank}`; 
        resultMessageElement.textContent = message;
        animateValue(finalScoreValueElement, 0, score, 700 + score * 60);
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
