const vscode = require("vscode");
const { exec } = require("child_process");

let statusBarItem;
let intervalId;

function activate(context) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.tooltip = "GPU Memory / Temp / Frequency";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const interval = vscode.workspace
    .getConfiguration("gpuStatusBar")
    .get("updateInterval", 2000);

  updateGpuInfo();

  intervalId = setInterval(updateGpuInfo, interval);

  context.subscriptions.push({
    dispose: () => {
      if (intervalId) clearInterval(intervalId);
    },
  });
}

function updateGpuInfo() {
  const cmd = `LC_ALL=C nvidia-smi --query-gpu=memory.used,temperature.gpu,clocks.sm --format=csv,noheader,nounits`;

  exec(cmd, (err, stdout) => {
    if (err) {
      statusBarItem.text = "$(alert) GPU Error";
      statusBarItem.color = new vscode.ThemeColor("errorForeground");
      return;
    }

    const [memUsed, temp, smClock] = stdout
      .trim()
      .split(",")
      .map((s) => s.trim());

    let tempColor = "#4EC9B0";
    if (parseInt(temp) > 80) {
      tempColor = "#F44747";
    } else if (parseInt(temp) > 70) {
      tempColor = "#CCA700";
    }

    statusBarItem.text = `$(circuit-board) ${memUsed} MiB  $(flame) ${temp}°C  $(dashboard) ${smClock} MHz`;
    statusBarItem.color = tempColor;
  });
}

function deactivate() {
  if (intervalId) clearInterval(intervalId);
}

module.exports = { activate, deactivate };
