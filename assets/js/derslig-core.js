/**
 * DERSLIG GAME CORE SDK v1.0
 * Bu dosya tüm oyunların temelini oluşturur.
 * - Header'ı otomatik basar.
 * - 1920x1080 alanını ekrana sığdırır (Scale).
 * - Storyline ile puan alışverişini yapar.
 */

const Derslig = (function () {
    // --- KONFİGÜRASYON ---
    const CONFIG = {
        maxScore: 20, // Maksimum puan 20 (Oyun içi mantık için)
        width: 1920,
        height: 1080,
        storylineRoot: window, // Storyline player'ın olduğu scope (genelde window veya parent)
    };

    // --- DURUM DEĞİŞKENLERİ ---
    let state = {
        totalQuestions: 0,
        pointsPerQuestion: 0,
        currentScore: 0,
        correctCount: 0,
        wrongCount: 0,
        isCompleted: false,
        gameTitle: "Derslig Etkinlik",
        gameInfo: "Yönerge bulunamadı.",
        cikisLink: "https://www.derslig.com/2-sinif/matematik/dogal-sayilarda-carpma-ve-bolme-maarif-model",
        okulTuru: "ortaokul" // Varsayılan değer
    };

    // --- LTI/SCORM/STORYLINE BAĞLANTISI ---
    function getScormAPI() {
        let win = window;
        while (win && win.parent && win.parent !== win) {
            try {
                if (win.API) return win.API; // SCORM 1.2
                if (win.API_1484_11) return win.API_1484_11; // SCORM 2004
            } catch (e) { /* CORS error */ }
            win = win.parent;
        }
        try {
            if (window.API) return window.API;
            if (window.API_1484_11) return window.API_1484_11;
        } catch (e) { }
        return null;
    }

    window.commitScorm = function () {
        const api = getScormAPI();
        if (api) {
            try {
                if (api.LMSFinish) {
                    api.LMSCommit("");
                    api.LMSFinish("");
                } else if (api.Terminate) {
                    api.Commit("");
                    api.Terminate("");
                }
            } catch (e) { console.error("SCORM Commit Error:", e); }
        }
    };

    // --- LRS / xAPI REPORTING ---
    function _sendXAPI() {
        const puan = state.currentScore;
        const maxpuan = CONFIG.maxScore;

        // SCORM Cloud LRS bilgileri
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
                    "raw": puan
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
                    console.log("✅ [xAPI] Puan başarıyla gönderildi.");
                    console.log("puan:" + puan);
                    console.log("maxscore:" + maxpuan);
                } else {
                    console.error("❌ [xAPI] Gönderim Hatası:", xhr.status, xhr.responseText);
                }
            }
        };
        xhr.send(JSON.stringify(statement));
    }

    // --- TEMEL FONKSİYONLAR ---

    /**
     * Oyunu başlatır ve ayarları yapar.
     * @param {Object} options - { title: "...", info: "...", soruSayisi: 10 }
     */
    function init(options) {
        state.gameTitle = options.title || "Etkinlik";
        state.gameInfo = options.info || "Başarılar!";
        if (options.cikisLink) state.cikisLink = options.cikisLink;
        if (options.okulTuru) state.okulTuru = options.okulTuru;

        // Puan hesaplaması (Maksimum 20 üzerinden)
        if (options.soruSayisi === 0) {
            state.isSimulation = true;
            state.totalQuestions = 0;
            state.pointsPerQuestion = 0;
        } else if (!options.soruSayisi || options.soruSayisi < 1) {
            console.warn("UYARI: soruSayisi belirtilmedi veya geçersiz! Varsayılan olarak her soru 2 puan kabul edilecek.");
            state.pointsPerQuestion = 2;
            state.totalQuestions = CONFIG.maxScore / state.pointsPerQuestion;
        } else {
            state.totalQuestions = options.soruSayisi;
            state.pointsPerQuestion = CONFIG.maxScore / state.totalQuestions;
        }

        // Arayüzü oluştur
        _createUI();
        _startScaler();

        // Intro'yu gösterir. Bittiğinde veya bypass edildiğinde _createModal çağrılır.
        _showIntro();

        /* TEST İÇİN: 's' tuşuna basınca özet ekranını göster
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' || e.key === 'S') {
                _showSummary();
            }
        });*/

        // Storyline artık kullanılmıyor.

        const api = getScormAPI();
        if (api) {
            try {
                if (api.LMSInitialize) api.LMSInitialize("");
                else if (api.Initialize) api.Initialize("");
            } catch (e) { console.warn("SCORM Init error", e); }
        }

        console.log(`Derslig Core Başlatıldı. Soru Başına Puan: ${state.pointsPerQuestion}`);
    }

    /**
     * Doğru cevap verildiğinde çağrılacak.
     */
    function dogru() {
        state.correctCount++;
        state.currentScore += state.pointsPerQuestion;
        try { new Audio('assets/audio/correct.mp3').play().catch(e => console.log(e)); } catch (e) { }
        console.log(`[Doğru] D:${state.correctCount}, Y:${state.wrongCount}, Puan:${state.currentScore}`);
    }

    function yanlis() {
        state.wrongCount++;
        try { new Audio('assets/audio/wrong.mp3').play().catch(e => console.log(e)); } catch (e) { }
        console.log(`[Yanlış] D:${state.correctCount}, Y:${state.wrongCount}, Puan:${state.currentScore}`);
    }

    /**
     * Dışarıdan puanı manuel set etmek için (v167)
     */
    function setPuan(puan) {
        state.currentScore = Number(puan) || 0;
        console.log(`[setPuan] Yeni Puan: ${state.currentScore}`);
    }

    /**
     * Oyun bittiğinde çağrılacak.
     */
    function bitir() {
        if (state.isCompleted) return;
        state.isCompleted = true;

        // Puanı son kez gönder (virgül hatası olmasın diye tam sayıya yuvarlayabiliriz ama şimdilik olduğu gibi atıyoruz)
        // player.SetVar("quizCompleted", 1); // <-- Removed as per user request (moved to Next button click)

        console.log("Oyun Bitti! Puan: " + state.currentScore);

        // Özet ekranını göster
        _showSummary();
    }

    // --- YARDIMCI FONSİYONLAR (Private) ---

    function _updateSCORM() {
        const api = getScormAPI();
        if (api) {
            const max = CONFIG.maxScore;
            const ratio = state.currentScore / max;
            const status = ratio >= 0.5 ? "passed" : "failed";

            try {
                // v92: Orijinal 20 puanlık raporlamaya geri dönüldü (Yüzdelik hesaplamanın doğru olması için)
                const finalPuan = Math.round(state.currentScore); 
                const finalMax = CONFIG.maxScore;

                if (api.LMSSetValue) {
                    api.LMSSetValue("cmi.core.score.raw", finalPuan);
                    api.LMSSetValue("cmi.core.score.max", finalMax);
                    api.LMSSetValue("cmi.core.score.min", 0);
                    api.LMSSetValue("cmi.core.lesson_status", status);
                    api.LMSCommit("");
                } else if (api.SetValue) {
                    api.SetValue("cmi.score.raw", finalPuan);
                    api.SetValue("cmi.score.max", finalMax);
                    api.SetValue("cmi.score.min", 0);
                    api.SetValue("cmi.success_status", status);
                    api.Commit("");
                }
            } catch (e) { console.warn("SCORM SetValue err", e); }
        }
    }

    function _createUI() {
        const assetPath = 'assets';

        // Header HTML (Classic Derslig SDK Structure)
        const headerHTML = `
            <div id="derslig-header">
                <div class="header-left">
                    <div class="game-title">${state.gameTitle}</div>
                </div>
                <div class="header-right" style="display: flex; align-items: center;">
                    <img src="${assetPath}/img/logo.svg" class="header-logo" alt="Derslig Logo">
                    <button class="ctrl-btn" onclick="Derslig.restart()" title="Yeniden Başlat"><i class="fas fa-sync-alt"></i></button>
                    <button class="ctrl-btn" id="info-btn" title="Nasıl Oynanır?"><i class="fas fa-question"></i></button>
                </div>
            </div>
            
            <!-- Bilgi Modalı -->
            <div id="info-modal" class="modal-backdrop">
                <div class="info-content">
                    <h3>Nasıl Oynanır?</h3>
                    <p>${state.gameInfo}</p>
                    <button class="btn btn-primary mt-3" onclick="document.getElementById('info-modal').style.display='none'">Anladım</button>
                </div>
            </div>

            <!-- Bitiş Ekranı -->
            <div id="next-overlay">
                 <h1 style="font-size: 60px; color: #0DBFC7; margin-bottom: 20px;">Tebrikler!</h1>
                 <p style="font-size: 30px; margin-bottom: 40px;">Etkinliği tamamladınız.</p>
                 <button class="next-btn" onclick="Derslig.goNext()">İLERLE <i class="fas fa-arrow-right"></i></button>
            </div>
        `;

        document.getElementById('game-wrapper').insertAdjacentHTML('afterbegin', headerHTML);

        // Info butonu eventi - Aynı modalı "ANLADIM" butonuyla aç
        document.getElementById('info-btn').addEventListener('click', () => {
            // Varsa önce temizle veya içeriği güncelle, ama basitçe yeniden oluşturabiliriz (kontrol _createModal içinde)
            _createModal("ANLADIM");
        });

        // KaTeX font override'ını KaTeX CSS'inden SONRA inject et
        _injectKaTeXFontOverride();
    }

    /**
     * KaTeX fontlarını Nunito ile değiştirmek için @font-face override inject eder.
     * KaTeX CSS yüklendikten sonra çalışır (sıralama önemli).
     */
    function _injectKaTeXFontOverride() {
        const nunitoUrl = 'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshRTY9jo7eTWk.woff2';
        const overrideCSS = `
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

        function inject() {
            const style = document.createElement('style');
            style.id = 'katex-nunito-override';
            style.textContent = overrideCSS;
            document.head.appendChild(style);
        }

        // KaTeX CSS yüklenmiş mi kontrol et
        const katexLink = document.querySelector('link[href*="katex"]');
        if (katexLink) {
            // KaTeX CSS zaten varsa, hemen sonrasına inject et
            if (katexLink.sheet) {
                inject();
            } else {
                katexLink.addEventListener('load', inject);
            }
        } else {
            // KaTeX CSS henüz yoksa, 500ms sonra dene
            setTimeout(inject, 500);
        }
    }

    function _showNextButton() {
        const overlay = document.getElementById('next-overlay');
        overlay.style.display = 'flex';

        // Konfeti efekti (Varsa)
        if (window.confetti) {
            window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    }

    function _showIntro() {
        const wrapper = document.getElementById('game-wrapper');
        const assetPath = 'assets';
        let introUrl = assetPath + '/scorm_wrapper/intro_ortaokul.html'; // Default
        if (state.okulTuru === 'ilkokul') introUrl = assetPath + '/scorm_wrapper/intro_ilkokul.html';
        else if (state.okulTuru === 'lise') introUrl = assetPath + '/scorm_wrapper/intro_lise.html';

        const overlayHTML = `
            <div id="intro-iframe-overlay" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: #fff; z-index: 30000;
            ">
                <iframe src="${introUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        `;
        wrapper.insertAdjacentHTML('beforeend', overlayHTML);

        window.addEventListener('message', function introListener(e) {
            if (e.data === 'introEnded') {
                window.removeEventListener('message', introListener);
                const introEl = document.getElementById('intro-iframe-overlay');
                if (introEl) {
                    introEl.style.transition = 'opacity 0.5s';
                    introEl.style.opacity = '0';
                    setTimeout(() => {
                        introEl.remove();
                        _createModal("BAŞLA");
                    }, 500);
                }
            }
        });
    }

    function _createModal(btnText) {
        // Ensure parent has relative positioning
        const wrapper = document.getElementById('game-wrapper');

        // Önce varsa eskini kaldır (temizlik)
        const existing = document.getElementById('intro-overlay');
        if (existing) existing.remove();

        const overlayHTML = `
            <div id="intro-overlay" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.85); z-index: 20000; display: flex;
                flex-direction: column; justify-content: center; align-items: center;
                backdrop-filter: blur(5px);
            ">
                <div style="
                    background: white; padding: 0; border-radius: 30px;
                    text-align: center; max-width: 700px; width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                    overflow: hidden; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                ">
                    <!-- Modal Header -->
                    <div style="background: #0DBFC7; padding: 20px; color: white;">
                        <h2 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px;">YÖNERGE</h2>
                    </div>

                    <!-- Modal Body -->
                    <div style="padding: 40px;">
                        <h1 style="color: #E50069 !important; -webkit-text-fill-color: #E50069 !important; -webkit-text-stroke: 0 !important; text-shadow: none !important; margin-bottom: 20px; font-size: 36px; font-weight: 800;">${state.gameTitle}</h1>
                        <div style="font-size: 24px; color: #555; margin-bottom: 40px; line-height: 1.6;">
                            ${state.gameInfo}
                        </div>
                        
                        <button id="start-game-btn" class="btn-primary" style="
                            background: #e50069; color: white; border: none;
                            padding: 15px 50px; font-size: 28px; font-weight: 800;
                            border-radius: 15px; cursor: pointer;
                            box-shadow: 0 6px 0 #b30052;
                            transition: all 0.1s;
                            min-width: 200px;
                        ">${btnText}</button>
                    </div>
                </div>
            </div>
            <style>
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            </style>
        `;
        wrapper.insertAdjacentHTML('beforeend', overlayHTML);

        const btn = document.getElementById('start-game-btn');
        btn.addEventListener('click', () => {
            const overlay = document.getElementById('intro-overlay');
            overlay.style.transition = 'opacity 0.3s';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                window.dispatchEvent(new CustomEvent('derslig-basla'));
            }, 300);
        });

        // Add active press effect via JS or CSS injection
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'translateY(4px)';
            btn.style.boxShadow = '0 2px 0 #b30052';
        });
        btn.addEventListener('mouseup', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 6px 0 #b30052';
        });
    }

    function _showSummary() {
        const overlay = document.getElementById('next-overlay');
        if (!overlay) return;

        const scoreRounded = Math.round(state.currentScore);

        overlay.innerHTML = `
            <div style="
                background: white; padding: 0; border-radius: 30px;
                text-align: center; max-width: 700px; width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                overflow: hidden; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
                <!-- Modal Header -->
                <div style="background: #0DBFC7; padding: 20px; color: white;">
                    <h2 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 1px;">ETKİNLİK SONUCU</h2>
                </div>

                <!-- Modal Body -->
                <div style="padding: 40px;">
                    <h1 style="color: #333; margin-bottom: 30px; font-size: 36px; font-weight: 800;">ETKİNLİK TAMAMLANDI</h1>
                    
                    <div style="font-size: 24px; color: #555; margin-bottom: 40px; line-height: 1.6;">
                        Tebrikler! Etkinliği başarıyla tamamladınız!
                    </div>

                    <button id="finish-game-btn" style="
                        background: #e50069; color: white; border: none;
                        padding: 15px 60px; font-size: 32px; font-weight: 800;
                        border-radius: 15px; cursor: pointer;
                        box-shadow: 0 6px 0 #b30052;
                        transition: all 0.1s;
                        width: 100%;
                    ">BİTİR</button>
                </div>
            </div>
            <style>
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            </style>
        `;

        overlay.style.display = 'flex';
        overlay.style.background = 'rgba(0, 0, 0, 0.85)';
        overlay.style.backdropFilter = 'blur(5px)';
        overlay.style.zIndex = '20000';

        if (window.confetti) {
            window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        const btn = document.getElementById('finish-game-btn');
        let isSubmitted = false;
        btn.addEventListener('click', () => {
            if (isSubmitted) return;
            isSubmitted = true;
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.7';
            btn.innerHTML = 'BEKLEYİNİZ...';

            // xAPI gönderimi
            _sendXAPI();

            // SCORM güncellenmesi
            _updateSCORM();

            if (!state.isSimulation && state.totalQuestions > 0) {
                overlay.style.display = 'none';
                _showOutro(scoreRounded);
            } else {
                overlay.innerHTML = '<h1 style="color: white; font-size: 48px; font-weight: 900;">AKTİVİTE TAMAMLANDI</h1>';
                setTimeout(() => { if (window.parent && window.parent.commitScorm) window.parent.commitScorm(); }, 2000);
            }
        });

        // Add active press effect
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'translateY(4px)';
            btn.style.boxShadow = '0 2px 0 #b30052';
        });
        btn.addEventListener('mouseup', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 6px 0 #b30052';
        });
    }

    function _showOutro(score) {
        const wrapper = document.getElementById('game-wrapper');
        const assetPath = 'assets';
        let outroUrl = assetPath + '/scorm_wrapper/outro_ortaokul.html'; // Default
        if (state.okulTuru === 'ilkokul') outroUrl = assetPath + '/scorm_wrapper/outro_ilkokul.html';
        else if (state.okulTuru === 'lise') outroUrl = assetPath + '/scorm_wrapper/outro_lise.html';

        const existing = document.getElementById('next-overlay');
        if (existing) existing.style.display = 'none';

        const overlayHTML = `
            <div id="outro-iframe-overlay" style="
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: #fff; z-index: 30000;
            ">
                <iframe id="outro-iframe" src="${outroUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        `;
        wrapper.insertAdjacentHTML('beforeend', overlayHTML);

        const iframe = document.getElementById('outro-iframe');
        iframe.onload = () => {
            if (iframe.contentWindow && typeof iframe.contentWindow.setScore === 'function') {
                iframe.contentWindow.setScore(score, CONFIG.maxScore);
            }
        };
    }

    // Storyline'da bir sonraki slayta geçiş (Opsiyonel, genelde Storyline trigger'ı quizCompleted değişkenini izler)
    function goNext() {
        console.log("İlerle butonuna basıldı. Storyline trigger'ı bekleniyor.");
        // Eğer manuel tetikleme gerekiyorsa buraya eklenebilir.
        // Örneğin: player.SetVar("NextSlide", 1);
    }

    /**
     * Oyunu ve tüm değişkenleri sıfırlar, sayfayı yeniler.
     */
    function restart() {
        console.log("Oyun yeniden başlatılıyor...");
        state.currentScore = 0;
        state.correctCount = 0;
        state.wrongCount = 0;
        state.isCompleted = false;
        location.reload();
    }

    /**
     * İstisnai durumlarda puandan eksiltmek için
     */
    function puanEksilt(miktar) {
        state.currentScore -= miktar;
        if (state.currentScore < 0) state.currentScore = 0;
        _updateSCORM();
    }

    // --- ÖZET EKRANI (Eski kalıntı blok temizlendi) ---

    // --- SCALER (Ölçekleyici) ---
    function _startScaler() {
        const wrapper = document.getElementById('game-wrapper');

        // Mobil uyumluluk için Viewport Meta ekle / güncelle
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        // 1920x1080 fixed sığdırma için user-scalable=no ve init scale ayarlarına gerek yok,
        // çünkü biz transform scale yapıyoruz. Ancak mobil tarayıcının kendi zoom'unu kapatmak iyi olabilir.
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

        // Orientation Warn Overlay (Sadece portrait'te göster)
        if (!document.getElementById('orientation-overlay')) {
            const warningHTML = `
                <div id="orientation-overlay" style="
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: #2c3e50; z-index: 99999; display: none;
                    flex-direction: column; justify-content: center; align-items: center; text-align: center;
                    color: white; padding: 20px;
                ">
                    <i class="fas fa-mobile-alt" style="font-size: 80px; margin-bottom: 20px; animation: rotatePhone 2s infinite ease-in-out;"></i>
                    <h2 style="font-size: 32px; margin-bottom: 10px;">Lütfen Cihazınızı Çevirin</h2>
                    <p style="font-size: 18px;">Bu etkinlik en iyi yatay modda görüntülenir.</p>
                </div>
                <style>
                    @keyframes rotatePhone {
                        0% { transform: rotate(0deg); }
                        25% { transform: rotate(90deg); }
                        50% { transform: rotate(90deg); }
                        75% { transform: rotate(0deg); }
                        100% { transform: rotate(0deg); }
                    }
                </style>
            `;
            document.body.insertAdjacentHTML('beforeend', warningHTML);
        }

        function resize() {
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const targetW = CONFIG.width;
            const targetH = CONFIG.height;

            // --- Orientation Check ---
            const overlay = document.getElementById('orientation-overlay');
            // Basit kontrol: Eğer mobilse ve yükseklik genişlikten büyükse (Portrait)
            // (Masaüstünde pencereyi daraltınca da çıkabilir ama istenen genelde budur)
            if (winH > winW) {
                if (overlay) overlay.style.display = 'flex';
            } else {
                if (overlay) overlay.style.display = 'none';
            }

            // --- Strict Dimension Enforcement with Fixed Positioning ---
            // CSS'deki flex yapısını bypass etmek için fixed kullanıyoruz.
            wrapper.style.position = 'fixed';
            wrapper.style.left = '50%';
            wrapper.style.top = '50%';
            wrapper.style.width = targetW + 'px';
            wrapper.style.height = targetH + 'px';

            // En boy oranına göre scale miktarını hesapla
            const scale = Math.min(winW / targetW, winH / targetH);

            // Translate ve Scale işlemini aynı anda yap
            wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
            wrapper.style.transformOrigin = 'center center';

            // Mobilde dikey/yatay değişimlerinde ve klavye açılmalarında bazen scroll oluşabilir
            document.body.style.width = '100vw';
            document.body.style.height = '100vh';
            document.body.style.overflow = 'hidden';
            document.body.style.margin = '0'; // Garanti olsun
        }

        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => {
            // Orientation change eventinden hemen sonra boyutlar güncellenmeyebilir, biraz bekleyelim
            setTimeout(resize, 100);
            setTimeout(resize, 500);
        });
        resize(); // İlk açılışta çalıştır
    }

    // Global helper functions (Outro tarafından çağrılabilmesi için)
    window.exitDersligGame = function () {
        console.log("Derslig SDK: Oyundan çıkılıyor...");
        const api = getScormAPI();
        if (api) {
            try {
                if (api.LMSFinish) api.LMSFinish("");
                else if (api.Terminate) api.Terminate("");
            } catch (e) { console.warn("SCORM Finish error", e); }
        }
        window.location.href = window.GLOBAL_CIKIS_LINK || state.cikisLink;
    };

    window.setSCORMScore = function (score) {
        state.currentScore = score;
        _updateSCORM();
    };

    // --- MATEMATİK FORMÜL DESTEĞİ (KaTeX) ---

    /**
     * LaTeX ifadesini HTML'e çevirir (inline mod).
     * Kullanım: element.innerHTML = Derslig.math("\\frac{5}{2}");
     * @param {string} latex - LaTeX formatında matematik ifadesi
     * @returns {string} - Render edilmiş HTML
     */
    function math(latex) {
        if (typeof katex === 'undefined') {
            console.warn("KaTeX yüklenmemiş! Düz metin döndürülüyor.");
            return latex;
        }
        try {
            return katex.renderToString(latex, {
                throwOnError: false,
                displayMode: false,
                output: 'html'
            });
        } catch (e) {
            console.error("KaTeX render hatası:", e);
            return latex;
        }
    }

    /**
     * LaTeX ifadesini HTML'e çevirir (display/blok mod - büyük ve ortalanmış).
     * Kullanım: element.innerHTML = Derslig.mathBlock("\\frac{5}{2}");
     * @param {string} latex - LaTeX formatında matematik ifadesi
     * @returns {string} - Render edilmiş HTML
     */
    function mathBlock(latex) {
        if (typeof katex === 'undefined') {
            console.warn("KaTeX yüklenmemiş! Düz metin döndürülüyor.");
            return latex;
        }
        try {
            return katex.renderToString(latex, {
                throwOnError: false,
                displayMode: true,
                output: 'html'
            });
        } catch (e) {
            console.error("KaTeX render hatası:", e);
            return latex;
        }
    }

    /**
     * Bir DOM elementinin içindeki tüm $...$ ve $$...$$ ifadelerini otomatik render eder.
     * Kullanım: Derslig.renderMath(document.getElementById("soru-alani"));
     * @param {HTMLElement} element - İçeriği render edilecek DOM elementi
     */
    function renderMath(element) {
        if (typeof renderMathInElement === 'undefined') {
            console.warn("KaTeX auto-render yüklenmemiş!");
            return;
        }
        try {
            renderMathInElement(element, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false },
                    { left: "\\(", right: "\\)", display: false },
                    { left: "\\[", right: "\\]", display: true }
                ],
                throwOnError: false
            });
        } catch (e) {
            console.error("KaTeX auto-render hatası:", e);
        }
    }

    /**
     * Güncel puanı döndürür.
     */
    function getPuan() {
        return state.currentScore;
    }

    /**
     * Soru başına düşen puan miktarını döndürür.
     */
    function getPointsPerQuestion() {
        return state.pointsPerQuestion;
    }

    // Dışarıya açılan API
    return {
        baslat: init,
        dogru: dogru,
        yanlis: yanlis,
        bitir: bitir,
        goNext: goNext,
        restart: restart,
        puanEksilt: puanEksilt,
        setPuan: setPuan, // v167
        getPuan: getPuan,
        getPointsPerQuestion: getPointsPerQuestion,
        exit: window.exitDersligGame,
        math: math,
        mathBlock: mathBlock,
        renderMath: renderMath
    };
})();
