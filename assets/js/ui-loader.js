/**
 * UI Loader & Game Controller
 * Bu script tüm oyunların ortak yaşam döngüsünü (Intro -> Game -> Outro) yönetir.
 */

window.GameManager = {
    config: {
        title: "Derslig Oyun",
        maxScore: 20,
        introAnim: "../../assets/json/intro.json",
        outroAnim: "../../assets/json/animation.json",
        onStart: null, // Oyun başladığında çalışacak fonksiyon
        onReset: null  // Tekrar oyna denildiğinde çalışacak fonksiyon
    },

    dom: {},

    /**
     * Oyunu başlatır ve yapılandırır
     * @param {Object} userConfig - Oyun başlığı, animasyon yolları vb.
     */
    init: function (userConfig) {
        this.config = { ...this.config, ...userConfig };

        // 1. Gerekli CSS'leri göm
        this.injectStyles();

        // 2. HTML Yapısını Oluştur (Intro, Header, Outro)
        this.buildStructure();

        // 3. Olayları Bağla (Butonlar vb.)
        this.bindEvents();

        // 4. İlk Ölçeklemeyi Yap
        this.resizeGame();
        window.addEventListener('resize', () => this.resizeGame());

        // 5. Intro Aşamasını Göster
        this.showStage('intro');

        // 6. Global Hint Fonksiyonunu Tanımla
        window.setHint = this.setHint;

        console.log("GameManager initialized for: " + this.config.title);
    },

    /**
     * Standart CSS stillerini sayfaya ekler
     */
    injectStyles: function () {
        const css = `
            /* --- LAYOUT & STAGES --- */
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #f7fbfd; font-family: 'Nunito', sans-serif; }
            #main-app { width: 100%; height: 100%; position: relative; }
            .stage-section { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; flex-direction: column; align-items: center; justify-content: center; }
            .stage-section.active { display: flex; }
            
            /* --- INTRO STAGE --- */
            #intro-stage { background: #e0f7fa; z-index: 50; }
            #intro-scaler { width: 1920px; height: 1080px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #e0f7fa; transform-origin: center center; }
            #intro-animation-container { width: 800px; height: 600px; display: flex; justify-content: center; align-items: center; margin-bottom: 2rem; }
            #start-btn { margin-top: 2rem; padding: 1.5rem 5rem; font-size: 3rem; font-weight: 800; color: white; background: #E50069; border: none; border-radius: 80px; box-shadow: 0 10px 20px rgba(229, 0, 105, 0.3); cursor: pointer; transition: transform 0.2s; animation: pulse-btn 2s infinite; }
            #start-btn:hover { transform: scale(1.05); background: #c40056; }
            @keyframes pulse-btn { 0% { box-shadow: 0 0 0 0 rgba(229, 0, 105, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(229, 0, 105, 0); } 100% { box-shadow: 0 0 0 0 rgba(229, 0, 105, 0); } }

            /* --- GAME STAGE --- */
            #game-stage { background: #f9fafb; z-index: 20; }
            #game-scaler { transform-origin: center center; box-shadow: 0 20px 50px rgba(0,0,0,0.15); background: white; overflow: hidden; flex-shrink: 0; display: flex; flex-direction: column; }
            #app-header { width: 100%; height: 100px; background: #0DBFC7; border-bottom: 3px solid #00acc1; display: flex; align-items: center; padding: 0 50px; justify-content: space-between; flex-shrink: 0; z-index: 50; }
            .header-title { font-weight: 800; color: white; font-size: 2.2rem; letter-spacing: 1px; }
            .header-controls .control-btn { background: none; border: none; font-size: 2rem; color: rgba(255,255,255,0.9); margin-left: 25px; cursor: pointer; transition: all 0.2s; }
            .header-controls .control-btn:hover { color: white; transform: scale(1.1); }

            /* --- OUTRO STAGE --- */
            #outro-stage { background: rgba(255,255,255,0.95); z-index: 60; backdrop-filter: blur(5px); }
            #outro-scaler { width: 1920px; height: 1080px; display: flex; justify-content: center; align-items: center; transform-origin: center center; background: white; border: 4px solid #4DD0E1; border-radius: 40px; box-shadow: 0 10px 40px rgba(77, 208, 225, 0.2); padding: 4rem; position: relative; }
            .outro-content { flex: 1; padding-right: 3rem; }
            .outro-anim { flex: 0 0 50%; height: 100%; position: relative; }
            .score-box { background: linear-gradient(90deg, #00BCD4 0%, #80DEEA 100%); padding: 30px 50px; border-radius: 60px; display: flex; align-items: center; justify-content: center; gap: 20px; color: white; font-size: 4rem; font-weight: 800; margin: 40px 0; box-shadow: 0 8px 20px rgba(0,188,212,0.3); }
            .btn-group { display: flex; gap: 30px; margin-top: 40px; }
            .btn-custom { border: none; border-radius: 60px; padding: 20px 50px; font-weight: 700; font-size: 1.8rem; color: white; cursor: pointer; display: flex; align-items: center; gap: 15px; transition: transform 0.2s; }
            .btn-retry { background: #FCD638; }
            .btn-exit { background: #E91E63; }
            .btn-custom:hover { transform: translateY(-3px); box-shadow: 0 5px 10px rgba(0,0,0,0.2); }

            /* --- WARNING --- */
            #orientation-warning { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #263238; color: white; z-index: 10000; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
            @media screen and (orientation: portrait) { #orientation-warning { display: flex; } #main-app { display: none; } }
        `;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);

        // KaTeX CSS ve JS yükleme (Matematik formül desteği)
        if (!document.querySelector('link[href*="katex"]')) {
            const katexCSS = document.createElement('link');
            katexCSS.rel = 'stylesheet';
            katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css';
            document.head.appendChild(katexCSS);

            const katexJS = document.createElement('script');
            katexJS.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js';
            document.head.appendChild(katexJS);

            const katexAutoRender = document.createElement('script');
            katexAutoRender.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js';
            katexJS.onload = () => document.head.appendChild(katexAutoRender);

            // KaTeX font override (Nunito uyumu)
            const katexFontCSS = document.createElement('style');
            const nunitoUrl = 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTY9jo7eTWk.woff2';
            katexFontCSS.textContent = `
                @font-face {
                    font-family: 'KaTeX_Main';
                    src: url('${nunitoUrl}') format('woff2');
                    font-weight: normal; font-style: normal;
                    unicode-range: U+0030-0039, U+0041-005A, U+0061-007A, U+00C0-024F, U+0400-04FF;
                }
                @font-face {
                    font-family: 'KaTeX_Main';
                    src: url('${nunitoUrl}') format('woff2');
                    font-weight: bold; font-style: normal;
                    unicode-range: U+0030-0039, U+0041-005A, U+0061-007A, U+00C0-024F, U+0400-04FF;
                }
                @font-face {
                    font-family: 'KaTeX_Main';
                    src: url('${nunitoUrl}') format('woff2');
                    font-weight: normal; font-style: italic;
                    unicode-range: U+0030-0039, U+0041-005A, U+0061-007A, U+00C0-024F, U+0400-04FF;
                }
                @font-face {
                    font-family: 'KaTeX_Math';
                    src: url('${nunitoUrl}') format('woff2');
                    font-weight: normal; font-style: italic;
                    unicode-range: U+0030-0039, U+0041-005A, U+0061-007A, U+00C0-024F;
                }
                .katex { font-size: 1em !important; }
            `;
            document.head.appendChild(katexFontCSS);
        }
    },

    buildStructure: function () {
        const appContainer = document.getElementById('main-app') || document.body;

        // 1. INTRO
        const introHTML = `
            <div id="intro-stage" class="stage-section">
                <div id="intro-scaler">
                    <div id="intro-animation-container"></div>
                    <button id="start-btn"><i class="fas fa-play me-2"></i> BAŞLA</button>
                </div>
            </div>
        `;

        // 2. HEADER
        // Header'ı var olan #app-header içine basacağız. 
        // Eğer index.html içinde #app-header doğru yerdeyse (game-scaler dışında) bu çalışır.
        const headerTarget = document.getElementById('app-header');
        if (headerTarget) {
            headerTarget.innerHTML = `
                <div class="header-title">${this.config.title}</div>
                <div class="header-controls">
                    <button id="btn-restart" class="control-btn" title="Yeniden Başlat"><i class="fas fa-redo"></i></button>
                    <button id="btn-hint" class="control-btn" title="İpucu" data-bs-toggle="modal" data-bs-target="#hintModal"><i class="fas fa-lightbulb"></i></button>
                    <button id="btn-fullscreen" class="control-btn" title="Tam Ekran"><i class="fas fa-expand"></i></button>
                </div>
            `;
        }

        // 3. OUTRO
        const outroHTML = `
            <div id="outro-stage" class="stage-section">
                <div id="outro-scaler">
                    <div class="outro-content">
                        <h1 style="color: #00BCD4; font-size: 5rem; font-weight: 800; margin-bottom: 2rem;">TEBRİKLER! 🎉</h1>
                        <p style="color: #546E7A; font-weight: 700; font-size: 2rem;">Kazandığın Puan</p>
                        <div class="score-box">
                            <span id="outro-score-val">0</span>
                            <span style="font-size: 2.5rem; opacity: 0.8;">/ ${this.config.maxScore}</span>
                            <i class="fas fa-star" style="color: #FCD638; font-size: 4rem;"></i>
                        </div>
                        <p id="outro-feedback" style="color: #546E7A; margin-bottom: 3rem; font-size: 1.8rem;">Harika bir iş çıkardın!</p>
                        <div class="btn-group">
                            <button class="btn-custom btn-retry" onclick="GameManager.retryGame()"><i class="fas fa-redo"></i> Tekrar Dene</button>
                            <button class="btn-custom btn-exit" onclick="GameManager.exitGame()"><i class="fas fa-sign-out-alt"></i> Çıkış</button>
                        </div>
                    </div>
                    <div class="outro-anim" id="outro-animation-container"></div>
                </div>
            </div>
        `;

        // Intro ve Outro'yu DOM'a ekle (Sadece oyun stage'i zaten DOM'da olmalı)
        // Intro'yu en başa, Outro'yu en sona ekleyelim
        appContainer.insertAdjacentHTML('afterbegin', introHTML);
        appContainer.insertAdjacentHTML('beforeend', outroHTML);

        // Orientation Warning
        const warningHTML = `
            <div id="orientation-warning">
                <i class="fas fa-mobile-alt fa-3x" style="transform: rotate(-90deg); margin-bottom: 2rem; color: #4DD0E1;"></i>
                <h2>Lütfen Cihazı Yan Çevirin</h2>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', warningHTML);
    },

    bindEvents: function () {
        // Event Delegation
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            if (target.id === 'start-btn') {
                this.startGame();
            }
            else if (target.id === 'btn-restart') {
                if (confirm("Etkinliği yeniden başlatmak istiyor musunuz?")) this.retryGame();
            }
            else if (target.id === 'btn-fullscreen') {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                else if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    },

    showStage: function (stageName) {
        // Hepsini gizle
        document.querySelectorAll('.stage-section').forEach(el => el.classList.remove('active'));

        if (stageName === 'intro') {
            const intro = document.getElementById('intro-stage');
            if (intro) {
                intro.classList.add('active');
                this.loadLottie('intro-animation-container', this.config.introAnim, true);
                this.resizeGame();
            }
        }
        else if (stageName === 'game') {
            // Oyun alanını aktif et
            const game = document.getElementById('game-stage');
            if (game) {
                game.classList.add('active');
                // Oyuna geçince tekrar resize çağır ki header varsa hesaplasın
                this.resizeGame();
            }
        }
        else if (stageName === 'outro') {
            const outro = document.getElementById('outro-stage');
            if (outro) {
                outro.classList.add('active');
                this.loadLottie('outro-animation-container', this.config.outroAnim, false);
                this.resizeGame();
            }

            if (window.parent) {
                const scoreVal = parseInt(document.getElementById('outro-score-val').innerText);
                window.parent.postMessage({
                    type: 'GAME_COMPLETE',
                    score: scoreVal,
                    maxScore: this.config.maxScore
                }, "*");
            }
        }
    },

    startGame: function () {
        // Intro'dan Game'e geçiş
        this.showStage('game');

        if (this.config.onStart) {
            try {
                this.config.onStart();
            } catch (e) {
                console.error("GameManager: onStart error", e);
            }
        }
    },

    finishGame: function (score) {
        document.getElementById('outro-score-val').innerText = score;

        // Basit feedback mantığı
        const ratio = score / this.config.maxScore;
        const fbEl = document.getElementById('outro-feedback');
        if (ratio >= 0.8) fbEl.innerHTML = "Mükemmel! Konuyu tam olarak kavramışsın.";
        else if (ratio >= 0.5) fbEl.innerHTML = "Güzel! Biraz daha pratik yapabilirsin.";
        else fbEl.innerHTML = "Tekrar deneyerek daha iyisini yapabilirsin!";

        this.showStage('outro');

        this.sendXAPI(score);

        // Konfeti
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
    },

    retryGame: function () {
        if (this.config.onReset) {
            this.config.onReset(); // Oyun içi sıfırlama (soft reset)
            document.getElementById('outro-stage').classList.remove('active');
            this.showStage('intro'); // İsteğe bağlı: Introya dönmek yerine direkt oyuna da dönebiliriz.
            // Şimdilik introya dönelim, temiz başlangıç.
        } else {
            location.reload(); // Hard reset
        }
    },

    exitGame: function () {
        if (window.parent && window.parent !== window) {
            // Eğer iframe içindeysek ve bir kapatma protokolü varsa
            window.parent.postMessage({ type: 'GAME_EXIT' }, "*");
        } else {
            window.close();
        }
    },

    loadLottie: function (containerId, path, loop) {
        if (typeof lottie === 'undefined') return;
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: loop,
            autoplay: true,
            path: path
        });
    },

    resizeGame: function () {
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // 1. Intro Scaler (1920x1080)
        const introScaler = document.getElementById('intro-scaler');
        if (introScaler) {
            const scale = Math.min(winW / 1920, winH / 1080);
            introScaler.style.transform = `scale(${scale})`;
        }

        // 2. Game Scaler (1920x1080)
        const gameScaler = document.getElementById('game-scaler');
        if (gameScaler) {
            const scale = Math.min(winW / 1920, winH / 1080);
            gameScaler.style.transform = `scale(${scale})`;
            // Ortalamayı flex parent (game-stage) halleder.
            gameScaler.style.marginTop = '0';
        }

        // 2. Outro Scaler (1920x1080)
        const outroScaler = document.getElementById('outro-scaler');
        if (outroScaler) {
            const scale = Math.min(winW / 1920, winH / 1080);
            outroScaler.style.transform = `scale(${scale})`;
        }
    },

    setHint: function (text) {
        const body = document.querySelector('#hintModal .modal-body');
        if (body) body.innerHTML = text;
    },

    sendXAPI: function (score) {
        const maxpuan = this.config.maxScore;
        const endpoint = "https://cloud.scorm.com/lrs/1RWFILBDU2/statements";
        const username = "PAV1LTI-0BHgITOByUs";
        const password = "sHRJ1DinbBxgExdU7tI";

        const auth = "Basic " + btoa(username + ":" + password);

        const statement = {
            "actor": {
                "name": "Kullanici",
                "mbox": "mailto:anon@example.com"
            },
            "verb": {
                "id": "http://adlnet.gov/expapi/verbs/experienced",
                "display": { "en-US": "experienced" }
            },
            "object": {
                "id": "http://example.com/puan",
                "definition": {
                    "name": { "en-US": "Kullanici Puani" }
                }
            },
            "result": {
                "score": {
                    "raw": score,
                    "min": 0,
                    "max": maxpuan
                }
            }
        };

        const xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint, true);
        xhr.setRequestHeader("Authorization", auth);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-Experience-API-Version", "1.0.3");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 204) {
                    console.log("xAPI Success - Score:" + score);
                } else {
                    console.error("xAPI Error:", xhr.status, xhr.responseText);
                }
            }
        };
        xhr.send(JSON.stringify(statement));
    }
};

// Alias for backward compatibility if needed, though strictly we use GameManager now
window.UILoader = GameManager;
