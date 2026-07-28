document.getElementById('btn-analyser').addEventListener('click', async () => {
  const resultatDiv = document.getElementById('resultat');
  
  // Afficher l'état de chargement
  resultatDiv.className = "loading";
  resultatDiv.innerText = "⏳ Analyse en cours auprès du serveur distant...";

  // 1. Récupérer l'onglet actif
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 2. Extraire le texte sélectionné par l'utilisateur
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  }, async (results) => {
    const texteSelectionne = results[0]?.result;

    if (!texteSelectionne || texteSelectionne.trim() === "") {
      resultatDiv.className = "erreur";
      resultatDiv.innerText = "⚠️ Veuillez d'abord surligner du texte sur la page web.";
      return;
    }

    // 3. Envoyer au serveur distant (nous utiliserons cette fonction)
    envoyerAuServeur(texteSelectionne, resultatDiv);
  });
});

async function envoyerAuServeur(texte, el) {
  // Adresse de votre serveur local Node.js
  const URL_SERVEUR = "http://localhost:3000/api/verify-text"; 

  try {
    const response = await fetch(URL_SERVEUR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texteAAnalyser: texte })
    });

    if (!response.ok) throw new Error("Erreur de connexion avec le serveur.");

    const data = await response.json();

    // Affichage dynamique en fonction du verdict renvoyé par le serveur
    if (data.verdict === "CONFIRME") {
      el.className = "valide";
      el.innerHTML = `<strong>🟢 Information Confirmée</strong><br>${data.explication}`;
    } else if (data.verdict === "MOYEN") {
      el.className = "douteux";
      el.innerHTML = `<strong>🟡 Fiabilité Moyenne</strong><br>${data.explication}`;
    } else {
      el.className = "fake";
      el.innerHTML = `<strong>🔴 Probable Fake News</strong><br>${data.explication}`;
    }

  } catch (erreur) {
    el.className = "erreur";
    el.innerText = "❌ Impossible de joindre le serveur distant.";
  }
}