const display = document.getElementById("display");
const status = document.getElementById("timer-status");

const btn1 = document.getElementById("massagem1");
const btn2 = document.getElementById("massagem2");

let intervalo = null;
let tempoRestante = 0;
let tempoFinal = 0;
let botaoAtivo = null;
let aviso20SegundosDado = false;
let ultimoMinutoAnunciado = null;

// 🔊 Contexto de áudio
let audioCtx = null;

function iniciarAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

// 🔔 Bip suave e confortável
function bip(freq = 720, dur = 0.45, volume = 0.18) {
    try {
        iniciarAudio();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + dur);

    } catch (erro) {
        console.log("Áudio indisponível:", erro);
    }
}

// 🌿 Aviso suave por minuto
function avisoMinuto() {
    bip(720, 0.45, 0.16);

    setTimeout(() => {
        bip(760, 0.45, 0.16);
    }, 600);
}

// ⏳ Aviso faltando 20 segundos
function aviso20Segundos() {
    bip(680, 0.35, 0.14);

    setTimeout(() => {
        bip(720, 0.35, 0.14);
    }, 500);
}

// 🧘 Finalização tranquila
function avisoFinal() {
    bip(432, 0.7, 0.16);

    setTimeout(() => {
        bip(528, 0.7, 0.16);
    }, 900);

    setTimeout(() => {
        bip(639, 1, 0.18);
    }, 1800);
}

// 🗣️ Leitor de tela
function falar(texto) {
    status.textContent = "";

    setTimeout(() => {
        status.textContent = texto;
    }, 100);
}

// 📳 Vibração
function vibrar(padrao = [200]) {
    if ("vibrate" in navigator) {
        navigator.vibrate(padrao);
    }
}

// ⏱️ Formatação
function formatarTempo(seg) {
    const min = Math.floor(seg / 60);
    const sec = seg % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// 🔄 Atualização visual
function atualizarDisplay() {
    display.textContent = formatarTempo(tempoRestante);
}

// ⛔ Parar
function pararTimer() {
    clearInterval(intervalo);
    intervalo = null;

    if (botaoAtivo) {
        botaoAtivo.setAttribute("aria-pressed", "false");
    }

    botaoAtivo = null;

    vibrar([120, 80, 120]);
    falar("Timer parado");
}

// ▶️ Iniciar
function iniciarTimer(minutos, botao) {

    // Mesmo botão = parar
    if (botaoAtivo === botao) {
        pararTimer();
        return;
    }

    // Outro timer ativo
    if (intervalo) {
        pararTimer();
    }

    tempoRestante = minutos * 60;
    tempoFinal = Date.now() + (tempoRestante * 1000);

    botaoAtivo = botao;
    aviso20SegundosDado = false;
    ultimoMinutoAnunciado = null;

    botao.setAttribute("aria-pressed", "true");

    atualizarDisplay();

    vibrar([150, 100, 150]);
    falar(`Iniciando massagem de ${minutos} minutos`);

    intervalo = setInterval(() => {

        tempoRestante = Math.max(
            0,
            Math.ceil((tempoFinal - Date.now()) / 1000)
        );

        atualizarDisplay();

        // 🌿 Aviso por minuto (evita repetição)
        if (
            tempoRestante > 0 &&
            tempoRestante % 60 === 0 &&
            tempoRestante !== ultimoMinutoAnunciado
        ) {
            ultimoMinutoAnunciado = tempoRestante;

            avisoMinuto();
            vibrar([180, 120, 180]);

            const minutosRestantes = tempoRestante / 60;

            falar(
                `${minutosRestantes} minuto${minutosRestantes > 1 ? "s" : ""} restante${minutosRestantes > 1 ? "s" : ""}`
            );
        }

        // ⏳ Aviso faltando 20 segundos
        if (
            tempoRestante === 20 &&
            !aviso20SegundosDado
        ) {
            aviso20Segundos();
            vibrar([250, 120, 250]);

            falar("Faltam 20 segundos para finalizar");

            aviso20SegundosDado = true;
        }

        // 🧘 Finalização
        if (tempoRestante <= 0) {
            clearInterval(intervalo);
            intervalo = null;

            botao.setAttribute("aria-pressed", "false");
            botaoAtivo = null;

            vibrar([250, 150, 250, 150, 400]);

            avisoFinal();

            falar("Massagem finalizada");
        }

    }, 500);
}

// 🔄 Corrigir ao retornar da tela bloqueada
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && intervalo) {

        tempoRestante = Math.max(
            0,
            Math.ceil((tempoFinal - Date.now()) / 1000)
        );

        atualizarDisplay();
    }
});

// 🎯 Eventos
btn1.addEventListener("click", () => iniciarTimer(2, btn1));
btn2.addEventListener("click", () => iniciarTimer(3, btn2));

// 🚀 Inicialização
window.addEventListener("load", () => {

    setTimeout(() => {
        btn1.focus();
    }, 500);

    falar("Masso Timer carregado. Deslize para navegar entre as opções.");
});