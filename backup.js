// Babbler – backup & transfer of the learning progress.
// Everything Babbler stores lives on the device (localStorage, keys starting with "babbler-").
// "Sicherung speichern" puts all of it into one small file; "Sicherung laden" reads such a file
// back – e.g. to move your progress from the Mac to the iPhone (send the file via AirDrop).

const BACKUP_PREFIX = "babbler-";

function babblerKeys() {
  return Object.keys(localStorage).filter((key) => key.startsWith(BACKUP_PREFIX));
}

function collectBackup() {
  const data = {};
  for (const key of babblerKeys()) data[key] = localStorage.getItem(key);
  return { app: "Babbler", format: 1, created: new Date().toISOString(), data: data };
}

// Save: on iPhone/Mac Safari the share sheet opens (AirDrop, Dateien, Mail …),
// elsewhere the file is downloaded normally.
async function saveBackup() {
  let backup;
  try {
    backup = collectBackup();
  } catch (err) {
    alert("Der Speicher dieses Geräts ist nicht erreichbar.");
    return;
  }
  const name = "babbler-sicherung-" + dateString(0) + ".json";
  const file = new File([JSON.stringify(backup)], name, { type: "application/json" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Babbler-Sicherung" });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;  // closed the share sheet – nothing to do
      // sharing failed for another reason → fall back to a download
    }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// Load: check the file, ask before replacing, then restart the app with the loaded progress.
function loadBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let backup = null;
    try {
      backup = JSON.parse(reader.result);
    } catch (err) {
      // not JSON – handled below
    }
    if (!backup || backup.app !== "Babbler" || typeof backup.data !== "object") {
      alert("Diese Datei ist keine Babbler-Sicherung.");
      return;
    }
    const date = new Date(backup.created).toLocaleDateString("de-DE");
    const question = "Sicherung vom " + date + " laden?\nDer Fortschritt auf diesem Gerät wird dadurch ersetzt.";
    if (!confirm(question)) return;
    try {
      for (const key of babblerKeys()) localStorage.removeItem(key);
      for (const [key, value] of Object.entries(backup.data)) {
        if (key.startsWith(BACKUP_PREFIX)) localStorage.setItem(key, value);
      }
    } catch (err) {
      alert("Die Sicherung konnte nicht gespeichert werden.");
      return;
    }
    location.reload();
  };
  reader.readAsText(file);
}

$("btn-backup-save").addEventListener("click", saveBackup);
$("btn-backup-load").addEventListener("click", () => $("backup-file").click());
$("backup-file").addEventListener("change", (e) => {
  if (e.target.files[0]) loadBackup(e.target.files[0]);
  e.target.value = "";  // so the same file can be chosen again later
});
