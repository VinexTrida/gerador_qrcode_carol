const form = document.querySelector("#qr-form");
const input = document.querySelector("#link-input");
const button = document.querySelector("#generate-button");
const statusMessage = document.querySelector("#status-message");
const qrRender = document.querySelector("#qr-render");
const qrPreview = document.querySelector("#qr-preview");
const qrPreviewWrapper = document.querySelector("#qr-preview-wrapper");


// ===============================
// CONFIGURAÇÕES DO ARQUIVO
// ===============================

const DPI = 300;

const larguraMM = 70;
const alturaMM = 40;

function mmParaPixels(mm) {
    return Math.round((mm / 25.4) * DPI);
}

const larguraFinal = mmParaPixels(larguraMM); // 827 px
const alturaFinal = mmParaPixels(alturaMM);   // 472 px


function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`.trim();
}


function normalizeUrl(value) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        throw new Error("Digite ou cole um link antes de continuar.");
    }

    const valueWithProtocol =
        /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmedValue)
            ? trimmedValue
            : `https://${trimmedValue}`;

    try {
        return new URL(valueWithProtocol).href;
    } catch {
        throw new Error(
            "Digite um link válido, como https://exemplo.com.br."
        );
    }
}


function waitForQrCanvas() {
    return new Promise((resolve, reject) => {

        let attempts = 0;
        const maxAttempts = 30;

        const intervalId = window.setInterval(() => {

            attempts += 1;

            const canvas = qrRender.querySelector("canvas");

            if (canvas) {
                window.clearInterval(intervalId);
                resolve(canvas);
                return;
            }

            if (attempts >= maxAttempts) {
                window.clearInterval(intervalId);

                reject(
                    new Error(
                        "Não foi possível preparar o QR Code."
                    )
                );
            }

        }, 50);

    });
}


// ===============================
// CRIA O ARQUIVO FINAL
// 70mm x 40mm
// COM DOIS QR CODES
// ===============================

function createDoubleQrCanvas(sourceCanvas) {

    const finalCanvas = document.createElement("canvas");

    finalCanvas.width = larguraFinal;
    finalCanvas.height = alturaFinal;

    const context = finalCanvas.getContext("2d");


    // Fundo branco
    context.fillStyle = "#ffffff";

    context.fillRect(
        0,
        0,
        finalCanvas.width,
        finalCanvas.height
    );


    // -------------------------------
    // TAMANHO DOS QR CODES
    // -------------------------------

    // 34 mm de altura aproximadamente
    const qrSize = mmParaPixels(34);


    // Espaço entre os dois QR Codes
    const gap = mmParaPixels(2);


    // Largura total ocupada
    const larguraQrs =
        (qrSize * 2) + gap;


    // Centraliza horizontalmente
    const startX =
        (larguraFinal - larguraQrs) / 2;


    // Centraliza verticalmente
    const y =
        (alturaFinal - qrSize) / 2;


    // Primeiro QR Code
    context.drawImage(
        sourceCanvas,
        startX,
        y,
        qrSize,
        qrSize
    );


    // Segundo QR Code
    context.drawImage(
        sourceCanvas,
        startX + qrSize + gap,
        y,
        qrSize,
        qrSize
    );


    return finalCanvas;
}


// ===============================
// PREVIEW
// ===============================

function updatePreview(canvas) {

    qrPreview.innerHTML = "";

    const previewCanvas =
        document.createElement("canvas");

    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;

    previewCanvas
        .getContext("2d")
        .drawImage(canvas, 0, 0);

    qrPreview.appendChild(previewCanvas);

    qrPreviewWrapper.hidden = false;
}


// ===============================
// DOWNLOAD
// ===============================

function downloadCanvas(canvas) {

    const downloadLink =
        document.createElement("a");

    downloadLink.download =
        `qrcode-duplo-70x40mm-${Date.now()}.png`;

    downloadLink.href =
        canvas.toDataURL("image/png");

    document.body.appendChild(downloadLink);

    downloadLink.click();

    downloadLink.remove();
}


// ===============================
// GERAR QR CODE
// ===============================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        try {

            if (typeof QRCode === "undefined") {

                throw new Error(
                    "A biblioteca de QR Code não carregou. " +
                    "Verifique sua conexão e tente novamente."
                );

            }


            const url =
                normalizeUrl(input.value);

            input.value = url;


            button.disabled = true;

            button.textContent =
                "Gerando...";

            showStatus(
                "Preparando os QR Codes..."
            );


            qrRender.innerHTML = "";


            // QR original em alta resolução
            new QRCode(qrRender, {

                text: url,

                width: 512,
                height: 512,

                colorDark: "#000000",
                colorLight: "#ffffff",

                correctLevel:
                    QRCode.CorrectLevel.H

            });


            const generatedCanvas =
                await waitForQrCanvas();


            // Cria a imagem 70mm x 40mm
            const finalCanvas =
                createDoubleQrCanvas(
                    generatedCanvas
                );


            updatePreview(
                finalCanvas
            );


            downloadCanvas(
                finalCanvas
            );


            showStatus(
                "QR Codes gerados em 70 x 40 mm.",
                "success"
            );


        } catch (error) {

            showStatus(
                error.message ||
                "Ocorreu um erro ao gerar o QR Code.",
                "error"
            );

            input.focus();

        } finally {

            button.disabled = false;

            button.textContent =
                "Gerar e baixar QR Code";

        }

    }
);
