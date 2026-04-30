const display = document.getElementById("display");
const status = document.getElementById("timer-status");

const btn1 = document.getElementById("massagem1");
const btn2 = document.getElementById("massagem2");

let intervalo = null;
let tempoRestante = 0;
let botaoAtivo = null;

// 🔊 Som (mantido — não interfere com leitor)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function bip(freq = 500, dur = 0.3) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

// 🗣️ Apenas via aria-live (sem speechSynthesis)
function falar(texto) {
    status.textContent = texto;
}

// ⏱
function formatarTempo(seg) {
    const min = Math.floor(seg / 60);
    const sec = seg % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function atualizarDisplay() {
    display.textContent = formatarTempo(tempoRestante);

    // Atualiza leitor de forma controlada
    if (tempoRestante % 60 === 0 && tempoRestante > 0) {
        bip(440, 0.25); // aviso suave por minuto
        falar(`${tempoRestante / 60} minuto restante`);
    }
}

// Vibração
function vibrar(padrao = [200]) {
    if ("vibrate" in navigator) {
        navigator.vibrate(padrao);
    }
}

// Parar
function pararTimer() {
    clearInterval(intervalo);
    intervalo = null;

    if (botaoAtivo) {
        botaoAtivo.setAttribute("aria-pressed", "false");
    }

    botaoAtivo = null;

    falar("Timer parado");
}

// Iniciar
function iniciarTimer(minutos, botao) {

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    // Mesmo botão = toggle
    if (botaoAtivo === botao) {
        pararTimer();
        return;
    }

    // Outro ativo
    if (intervalo) {
        pararTimer();
    }

    tempoRestante = minutos * 60;
    botaoAtivo = botao;

    botao.setAttribute("aria-pressed", "true");

    atualizarDisplay();

    falar(`Iniciando massagem de ${minutos} minutos`);
    vibrar([150, 100, 150]);

    intervalo = setInterval(() => {
        tempoRestante--;
        atualizarDisplay();

        if (tempoRestante <= 0) {
            clearInterval(intervalo);
            intervalo = null;

            botao.setAttribute("aria-pressed", "false");
            botaoAtivo = null;

            vibrar([300, 150, 300, 150, 500]);

            bip(440, 0.2);
            setTimeout(() => bip(520, 0.2), 250);
            setTimeout(() => bip(660, 0.35), 500);

            falar("Massagem finalizada");
        }

    }, 1000);
}

// Eventos
btn1.addEventListener("click", () => iniciarTimer(2, btn1));
btn2.addEventListener("click", () => iniciarTimer(3, btn2));

// Foco inicial (importante)
window.addEventListener("load", () => {
    document.querySelector("main").focus();

    setTimeout(() => {
        btn1.focus();
    }, 500);
});