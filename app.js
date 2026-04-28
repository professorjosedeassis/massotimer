const display = document.getElementById("display");
const btn1 = document.getElementById("massagem1");
const btn2 = document.getElementById("massagem2");

let intervalo = null;
let tempoRestante = 0;
let botaoAtivo = null;
let wakeLock = null;

ativarWakeLock();

async function ativarWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) {
        console.log("Wake Lock não suportado");
    }
}

// Região para leitor de tela
const liveRegion = document.createElement("div");
liveRegion.setAttribute("aria-live", "assertive");
liveRegion.classList.add("sr-only");
document.body.appendChild(liveRegion);

// Áudio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 🔊 Bip suave
function bip(freq = 500, dur = 0.3) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

// 🔔 Aviso a cada minuto
function avisoMinuto() {
    bip(720, 0.35);
    setTimeout(() => bip(720, 0.35), 500);
}

// ⏰ Final tranquilo
function avisoFinal() {
    bip(432, 0.8);
    setTimeout(() => bip(528, 0.8), 900);
    setTimeout(() => bip(639, 1.2), 1800);
}

// 🗣 Voz
function falar(texto) {
    liveRegion.textContent = texto;

    speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = "pt-BR";
    msg.rate = 1.05;
    msg.pitch = 1;
    msg.volume = 1;

    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
        msg.voice = voices.find(v => v.lang.includes("pt")) || voices[0];
    }

    speechSynthesis.speak(msg);
}



// ⏱ Formatar
function formatarTempo(seg) {
    const min = Math.floor(seg / 60);
    const sec = seg % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Atualizar
function atualizarDisplay() {
    display.textContent = formatarTempo(tempoRestante);
}

// Vibração opcional
function vibrar(padrao = [200]) {
    if ("vibrate" in navigator) {
        navigator.vibrate(padrao);
    }
}

// Parar
function pararTimer() {
    clearInterval(intervalo);
    intervalo = null;
    botaoAtivo = null;

    falar("Timer parado");
}

// Iniciar
function iniciarTimer(minutos, botao) {

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    // Mesmo botão
    if (botaoAtivo === botao) {
        pararTimer();
        return;
    }

    // Outro timer ativo
    if (intervalo) {
        pararTimer();
    }

    tempoRestante = minutos * 60;
    botaoAtivo = botao;

    atualizarDisplay();

    falar(`Iniciando massagem de ${minutos} minutos`);
    vibrar([150, 100, 150]);

    intervalo = setInterval(() => {
        tempoRestante--;
        atualizarDisplay();

        // Aviso a cada minuto
        if (tempoRestante > 0 && tempoRestante % 60 === 0) {
            avisoMinuto();
            vibrar([200, 100, 200]);
        }

        // Final
        if (tempoRestante <= 0) {
            clearInterval(intervalo);
            intervalo = null;
            botaoAtivo = null;

            avisoFinal();
            vibrar([300, 150, 300, 150, 500]);

            setTimeout(() => {
                falar("Massagem finalizada");
            }, 3200);
        }

    }, 1000);
}

// Foco acessível com confirmação leve
function configurarBotao(botao) {

    botao.setAttribute("tabindex", "0");

    botao.addEventListener("focus", () => {
        bip(700, 0.15);
    });

    botao.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            botao.click();
        }
    });
}

// Eventos
btn1.addEventListener("click", () => iniciarTimer(2, btn1));
btn2.addEventListener("click", () => iniciarTimer(3, btn2));

configurarBotao(btn1);
configurarBotao(btn2);

window.addEventListener("load", () => {
    speechSynthesis.getVoices();

    setTimeout(() => {
        falar("Masso Timer carregado. Deslize para navegar entre as opções de massagem e toque duas vezes para ativar.");
    }, 300);
});