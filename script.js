const form = document.querySelector("#qr-form");
const input = document.querySelector("#link-input");
const button = document.querySelector("#generate-button");
const statusMessage = document.querySelector("#status-message");
const qrRender = document.querySelector("#qr-render");
const qrPreview = document.querySelector("#qr-preview");
const qrPreviewWrapper = document.querySelector("#qr-preview-wrapper");

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`.trim();
}

function normalizeUrl(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Digite ou cole um link antes de continuar.");
  }

  const valueWithProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    return new URL(valueWithProtocol).href;
  } catch {
    throw new Error("Digite um link válido, como https://exemplo.com.br.");
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
        reject(new Error("Não foi possível preparar o QR Code."));
      }
    }, 50);
  });
}

function createQrWithMargin(sourceCanvas) {
  const moduleMargin = 32;
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = sourceCanvas.width + moduleMargin * 2;
  finalCanvas.height = sourceCanvas.height + moduleMargin * 2;

  const context = finalCanvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
  context.drawImage(sourceCanvas, moduleMargin, moduleMargin);

  return finalCanvas;
}

function updatePreview(canvas) {
  qrPreview.innerHTML = "";
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = canvas.width;
  previewCanvas.height = canvas.height;
  previewCanvas.getContext("2d").drawImage(canvas, 0, 0);
  qrPreview.appendChild(previewCanvas);
  qrPreviewWrapper.hidden = false;
}

function downloadCanvas(canvas) {
  const downloadLink = document.createElement("a");
  downloadLink.download = `qrcode-${Date.now()}.png`;
  downloadLink.href = canvas.toDataURL("image/png");
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    if (typeof QRCode === "undefined") {
      throw new Error("A biblioteca de QR Code não carregou. Verifique sua conexão e tente novamente.");
    }

    const url = normalizeUrl(input.value);
    input.value = url;

    button.disabled = true;
    button.textContent = "Gerando...";
    showStatus("Preparando seu QR Code...");

    qrRender.innerHTML = "";

    new QRCode(qrRender, {
      text: url,
      width: 512,
      height: 512,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    const generatedCanvas = await waitForQrCanvas();
    const finalCanvas = createQrWithMargin(generatedCanvas);

    updatePreview(finalCanvas);
    downloadCanvas(finalCanvas);
    showStatus("QR Code gerado e baixado com sucesso.", "success");
  } catch (error) {
    showStatus(error.message || "Ocorreu um erro ao gerar o QR Code.", "error");
    input.focus();
  } finally {
    button.disabled = false;
    button.textContent = "Gerar e baixar QR Code";
  }
});
