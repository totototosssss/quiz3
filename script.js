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
    const stakesNotificationArea = document.getElementById('stakes-notification-area');
    const stakesTextElement = document.getElementById('stakes-text');

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
    const QUIZ_DATA_FILE = "misattributed_context_quiz_data_v3.json"; 

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
        if (quizAreaElement) {
            quizAreaElement.innerHTML = `<p class="error-message">${message}</p>`;
            quizAreaElement.style.display = 'block';
        }
        if (resultAreaElement) resultAreaElement.style.display = 'none';
        const header = document.querySelector('.quiz-header');
        if(header) header.style.display = 'none';
    }

    function startGame() {
        currentQuestionIndex = 0;
        score = 0;
        if(currentScoreValueElement) currentScoreValueElement.textContent = '0';
        if(currentScoreDisplayElement) currentScoreDisplayElement.classList.remove('score-updated');
        
        if (resultAreaElement) resultAreaElement.style.display = 'none';
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { 
            resultCard.style.opacity = '0';
            resultCard.style.transform = 'translateY(30px) scale(0.95)';
            resultCard.style.animation = 'none'; 
            resultCard.offsetHeight; 
            resultCard.style.animation = ''; 
        }
        
        if (quizAreaElement) quizAreaElement.style.display = 'block';
        if(attributionQuestionArea) attributionQuestionArea.style.display = 'block'; 
        if(stakesNotificationArea) stakesNotificationArea.style.display = 'none'; 
        if (choicesAreaElement) choicesAreaElement.className = 'choices-container binary-choices'; 

        if (nextQuestionBtn) nextQuestionBtn.style.display = 'none';
        if (feedbackTextElement) {
            feedbackTextElement.textContent = '';
            feedbackTextElement.className = 'feedback-text'; 
        }
        
        if (currentQuizSet.length === 0) {
            displayError("出題できるクイズがありません。");
            return;
        }
        updateProgress();
        displayQuestion();
    }

    function displayQuestion() {
        if(feedbackTextElement) feedbackTextElement.className = 'feedback-text';
        if(stakesNotificationArea) {
            stakesNotificationArea.style.display = 'none';
            stakesNotificationArea.classList.remove('visible');
        }


        if (currentQuestionIndex < currentQuizSet.length) {
            const q = currentQuizSet[currentQuestionIndex];
            
            if (q.prev_message_text && prevMessageContainer) {
                prevSpeakerNameElement.textContent = q.prev_speaker_display || "";
                prevMessageTextElement.innerHTML = q.prev_message_text.replace(/\n/g, '<br>');
                prevMessageContainer.style.display = 'block';
            } else if (prevMessageContainer) {
                prevMessageContainer.style.display = 'none';
                if(prevSpeakerNameElement) prevSpeakerNameElement.textContent = "";
                if(prevMessageTextElement) prevMessageTextElement.innerHTML = "";
            }

            if(messageTextContentElement) {
                if (q.main_quote_text) {
                    messageTextContentElement.innerHTML = q.main_quote_text.replace(/\n/g, '<br>');
                } else {
                    messageTextContentElement.innerHTML = "[クイズ文の読み込みエラー]"; 
                }
            }
            
            if (q.next_message_text && nextMessageContainer) {
                nextSpeakerNameElement.textContent = q.next_speaker_display || "";
                nextMessageTextElement.innerHTML = q.next_message_text.replace(/\n/g, '<br>');
                nextMessageContainer.style.display = 'block';
            } else if (nextMessageContainer) { 
                nextMessageContainer.style.display = 'none';
                if(nextSpeakerNameElement) nextSpeakerNameElement.textContent = "";
                if(nextMessageTextElement) nextMessageTextElement.innerHTML = "";
            }
            
            if(attributedSpeakerNameElement) attributedSpeakerNameElement.textContent = q.attributed_speaker_display;
            if(attributionQuestionArea) attributionQuestionArea.style.display = 'block';

            if(stakesTextElement && stakesNotificationArea && q.stake_label) {
                stakesTextElement.textContent = q.stake_label;
                stakesNotificationArea.className = `stakes-notification stakes-${q.stake_type || 'normal'}`;
                stakesNotificationArea.style.display = 'block';
                setTimeout(() => stakesNotificationArea.classList.add('visible'), 50); // Animation trigger
            }


            if (choicesAreaElement) choicesAreaElement.innerHTML = ''; 
            const yesButton = document.createElement('button');
            yesButton.innerHTML = `<span>はい、この人の発言！</span>`;
            yesButton.dataset.answer = "yes";
            yesButton.addEventListener('click', () => handleAnswer("yes"));
            if (choicesAreaElement) choicesAreaElement.appendChild(yesButton);

            const noButton = document.createElement('button');
            noButton.innerHTML = `<span>いいえ、違う人の発言！</span>`;
            noButton.dataset.answer = "no";
            noButton.addEventListener('click', () => handleAnswer("no"));
            if (choicesAreaElement) choicesAreaElement.appendChild(noButton);
            
            if(nextQuestionBtn) nextQuestionBtn.style.display = 'none';
        } else {
            showResults();
        }
    }

    function handleAnswer(userYesNoChoice) { 
        const currentQuestion = currentQuizSet[currentQuestionIndex];
        const isCorrectAttribution = currentQuestion.is_attribution_correct;
        const attributedSpeaker = currentQuestion.attributed_speaker_display;
        const actualSpeaker = currentQuestion.main_quote_actual_speaker_display;
        const correctPoints = currentQuestion.stake_correct_points || 1;
        const incorrectPoints = currentQuestion.stake_incorrect_points || 0;

        if (choicesAreaElement) {
            const buttons = choicesAreaElement.getElementsByTagName('button');
            for (let btn of buttons) {
                btn.disabled = true;
            }
        }
        
        let answeredCorrectly = false;
        let pointsEarned = 0;

        if (userYesNoChoice === "yes") {
            answeredCorrectly = isCorrectAttribution;
        } else if (userYesNoChoice === "no") {
            answeredCorrectly = !isCorrectAttribution;
        }

        if (answeredCorrectly) {
            pointsEarned = correctPoints;
            if (feedbackTextElement) feedbackTextElement.textContent = `正解！ ${pointsEarned > 0 ? `+${pointsEarned}点！` : (pointsEarned < 0 ? `${pointsEarned}点…` : (pointsEarned === 0 ? '' : '+0点'))} 🎉`;
        } else {
            pointsEarned = incorrectPoints;
            if (feedbackTextElement) {
                if (userYesNoChoice === "yes") { 
                    feedbackTextElement.textContent = `残念…！これは ${attributedSpeaker} さんの発言ではありませんでした。本当は ${actualSpeaker} さんのセリフです。 ${pointsEarned < 0 ? `${pointsEarned}点…` : (pointsEarned === 0 ? '' : `+${pointsEarned}点`)}`;
                } else { 
                    feedbackTextElement.textContent = `ありゃ、これは本当に ${attributedSpeaker} さんの発言だったんですよ。 ${pointsEarned < 0 ? `${pointsEarned}点…` : (pointsEarned === 0 ? '' : `+${pointsEarned}点`)}`;
                }
            }
        }
        score += pointsEarned;
        
        if(currentScoreValueElement) currentScoreValueElement.textContent = score;
        if(currentScoreDisplayElement) {
            currentScoreDisplayElement.classList.add('score-updated');
            setTimeout(() => currentScoreDisplayElement.classList.remove('score-updated'), 300);
        }

        if (feedbackTextElement) feedbackTextElement.className = 'feedback-text visible'; 
        if (answeredCorrectly) {
            if (feedbackTextElement) feedbackTextElement.classList.add('correct');
            if (choicesAreaElement) Array.from(choicesAreaElement.getElementsByTagName('button')).find(btn => btn.dataset.answer === userYesNoChoice)?.classList.add('correct');
            if (typeof confetti === 'function' && currentQuestionIndex < TARGET_NUM_QUESTIONS -1 ) { 
                 confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, angle: randomRange(80,100), scalar: 1, zIndex: 10000});
            }
        } else {
            if (feedbackTextElement) {
                feedbackTextElement.classList.add('wrong');
                feedbackTextElement.classList.add('feedback-text-shake');
                setTimeout(() => {
                    feedbackTextElement.classList.remove('feedback-text-shake');
                }, 400); 
            }
            if (choicesAreaElement) Array.from(choicesAreaElement.getElementsByTagName('button')).find(btn => btn.dataset.answer === userYesNoChoice)?.classList.add('wrong');
        }

        if (choicesAreaElement) { // Reveal true nature of choices
            if(isCorrectAttribution) { 
                 Array.from(choicesAreaElement.getElementsByTagName('button')).find(btn => btn.dataset.answer === "yes")?.classList.add('reveal-correct-binary');
            } else { 
                 Array.from(choicesAreaElement.getElementsByTagName('button')).find(btn => btn.dataset.answer === "no")?.classList.add('reveal-correct-binary');
            }
        }

        if (nextQuestionBtn) nextQuestionBtn.style.display = 'inline-flex';
    }

    function updateProgress() {
        const totalQuestionsInSet = currentQuizSet.length;
        if (totalQuestionsInSet > 0) {
            if (progressBarElement) progressBarElement.style.width = `${((currentQuestionIndex) / totalQuestionsInSet) * 100}%`;
            if (progressTextElement) progressTextElement.textContent = `問題 ${currentQuestionIndex + 1} / ${totalQuestionsInSet}`;
        } else {
            if (progressBarElement) progressBarElement.style.width = `0%`;
            if (progressTextElement) progressTextElement.textContent = `問題 - / -`;
        }
    }

    function showResults() {
        if (quizAreaElement) quizAreaElement.style.display = 'none';
        if(attributionQuestionArea) attributionQuestionArea.style.display = 'none';
        if(stakesNotificationArea) stakesNotificationArea.style.display = 'none';
        if (resultAreaElement) resultAreaElement.style.display = 'block'; 
        
        const resultCard = document.querySelector('.result-card');
        if(resultCard) { 
            resultCard.style.opacity = '0'; 
            resultCard.style.transform = 'translateY(30px) scale(0.95)';
            resultCard.style.animation = 'none'; 
            resultCard.offsetHeight; 
            resultCard.style.animation = ''; 
        }
        
        const totalAnswered = currentQuizSet.length;
        if(totalQuestionsOnResultElement) totalQuestionsOnResultElement.textContent = totalAnswered; // Display total questions answered

        let rank = '', rankTitle = '', message = '', iconClass = ''; 
        const finalScore = score; 

        // Score Tiers for 10 questions, with points: +5, +3, +2, +1 correct; -2, -1, 0 incorrect
        // Max possible: 10 * 5 = 50. Min possible: 10 * -2 = -20. Range of 70 points.
        // Let's define tiers based on this potential range.
        if (finalScore >= 40) { 
            rank = 'godlike'; rankTitle = "中毒お疲れ様です🤡";
            message = "このスコア…常人には到達不可能な領域です。さては、あなた…未来、視えてます？日常生活に支障が出ない範囲でお願いしますね！";
            iconClass = 'fas fa-infinity';
             if (typeof confetti === 'function') { 
                const end = Date.now() + (4.5 * 1000); 
                const colors = ['#1f2937', '#5e5af9', '#f59e0b', '#ef4444', '#ec4899', '#7b1fa2'];
                (function frame() {
                    confetti({ particleCount: 10, angle: randomRange(0, 360), spread: randomRange(60, 120), startVelocity: randomRange(25,45), origin: { x: Math.random(), y: Math.random() - 0.2 }, colors: colors, scalar: Math.random() * 1 + 0.6, drift: Math.random() * 1 - 0.5, zIndex:10000 });
                    if (Date.now() < end) { requestAnimationFrame(frame); }
                }());
                setTimeout(() => { confetti({ particleCount: 250, spread: 180, origin: { y: 0.5 }, colors: colors, scalar: 1.5, zIndex: 10001, ticks: 400 }); }, 300);
            }
        } else if (finalScore >= 30) { 
            rank = 'ss'; rankTitle = "未来予知レベル";
            message = "もはやエスパー！次の一手どころか、会話の未来まで読んでますね？その力、宝くじにも活かせそうです！";
            iconClass = 'fas fa-crystal-ball';
        } else if (finalScore >= 20) { 
            rank = 's'; rankTitle = "トークサイコメトラー";
            message = "発言に込められた思念まで読み取る特殊能力者ですか？素晴らしい！その力、悪用厳禁ですよ！";
            iconClass = 'fas fa-brain';
        } else if (finalScore >= 10) { 
            rank = 'a_plus'; rankTitle = "戦略的コミュニケーター";
            message = "リスクを恐れぬ勇気と的確な判断力！あなたは会話を有利に進める術を知っていますね！";
            iconClass = 'fas fa-chess-king';
        } else if (finalScore >= 5) { 
            rank = 'a'; rankTitle = "駆け引き上手";
            message = "なかなかやりますね！勝負どころを見極めるのが上手い！その勝負勘、磨けば光ります！";
            iconClass = 'fas fa-dice-d20';
        } else if (finalScore >= 1) { 
            rank = 'b_plus'; rankTitle = "堅実派プレイヤー";
            message = "着実にポイントを重ねましたね！ローリスク・ローリターンも立派な戦略です。安定感が光ります！";
            iconClass = 'fas fa-shield-alt';
        } else if (finalScore === 0) { 
            rank = 'b'; rankTitle = "振り出しに戻る";
            message = "おっと、プラスマイナスゼロ！まるで人生ゲームのようですね。次の一投に全てを賭けますか？";
            iconClass = 'fas fa-dice';
        } else if (finalScore >= -5) { 
            rank = 'c_plus'; rankTitle = "ちょっぴり空回り";
            message = "うーん、今回はツキがなかったかも？大丈夫、そんな日もあります。次こそは大当たりを狙いましょう！";
            iconClass = 'fas fa-compact-disc fa-spin';
        } else if (finalScore >= -10) { 
            rank = 'c'; rankTitle = "大胆なチャレンジャー（敗北）";
            message = "果敢に攻めた結果のマイナス…その心意気や良し！ただし、現実は非情である。次こそ勝利を！";
            iconClass = 'fas fa-bomb';
        } else if (finalScore >= -15) { 
            rank = 'd_plus'; rankTitle = "逆神様ご降臨";
            message = "ここまでくると逆に清々しい！あなたが選ばなかった方が正解なのでは…？ある意味、未来が見えてますね（逆方向に）。";
            iconClass = 'fas fa-poo';
        } else {  
            rank = 'd'; rankTitle = "破滅的ギャンブラー";
            message = "…素晴らしいマイナススコア、記録更新です！もはや伝説。…え？褒めてませんよ？全然褒めてませんからね！？";
            iconClass = 'fas fa-biohazard';
        }
        
        if (resultIconContainer) resultIconContainer.className = `result-icon-container rank-${rank}`; 
        if (resultIconContainer) resultIconContainer.innerHTML = `<i class="${iconClass}"></i>`;
        if (resultRankTitleElement) resultRankTitleElement.textContent = rankTitle;
        if (resultRankTitleElement) resultRankTitleElement.className = `result-rank-title rank-${rank}`; 
        if (resultMessageElement) resultMessageElement.textContent = message;
        if (finalScoreValueElement) animateValue(finalScoreValueElement, 0, finalScore, 800 + Math.abs(finalScore) * 25); 
        if (progressBarElement) progressBarElement.style.width = '100%';
        if (progressTextElement) progressTextElement.textContent = `全 ${totalAnswered} 問完了！`;
    }
    
    function animateValue(element, start, end, duration) {
        if (!element) return;
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
    
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) currentYearElement.textContent = new Date().getFullYear();

    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', () => {
            currentQuestionIndex++;
            if (currentQuestionIndex < currentQuizSet.length) {
                displayQuestion();
                updateProgress(); 
            } else {
                if(progressBarElement) progressBarElement.style.width = '100%'; 
                if(progressTextElement) progressTextElement.textContent = `結果を計算中...`; 
                showResults();
            }
        });
    }
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            prepareNewQuizSet(); 
            startGame();
        });
    }
    
    initializeQuiz();
});
