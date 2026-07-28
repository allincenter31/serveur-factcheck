const SERVEUR_IMAGE_URL = "http://localhost:3000/api/verify-image";

// Détection automatique des images au survol de la souris
document.addEventListener('mouseover', (e) => {
  if (e.target.tagName === 'IMG' && !e.target.dataset.factchecked) {
    const img = e.target;
    
    // On ne vérifie que les images d'une certaine taille (évite de vérifier les petites icônes/logos)
    if (img.width > 150 && img.height > 150) {
      img.dataset.factchecked = "true";
      analyserImageAUTOMATIQUEMENT(img.src, img);
    }
  }
});

async function analyserImageAUTOMATIQUEMENT(url, imageElement) {
  try {
    const response = await fetch(SERVEUR_IMAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url })
    });

    if (!response.ok) return;

    const data = await response.json();

    // Création d'un petit badge visuel directement sur l'image
    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.padding = '6px 10px';
    badge.style.borderRadius = '8px';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = 'bold';
    badge.style.color = 'white';
    badge.style.zIndex = '999999';
    badge.style.marginTop = '10px';
    badge.style.marginLeft = '10px';
    badge.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

    if (data.verdict === "CONFIRME") {
      badge.style.backgroundColor = '#16a34a';
      badge.innerText = `🟢 FactCheck : Confirmé`;
    } else if (data.verdict === "MOYEN") {
      badge.style.backgroundColor = '#ca8a04';
      badge.innerText = `🟡 FactCheck : Douteux`;
    } else {
      badge.style.backgroundColor = '#dc2626';
      badge.innerText = `🔴 FactCheck : Fake News`;
    }

    // Afficher l'explication au survol du badge
    badge.title = `Texte lu: "${data.texteExtrait || 'Aucun'}"\nAnalyse: ${data.explication}`;

    // Placer le badge juste au-dessus de l'image
    imageElement.parentNode.insertBefore(badge, imageElement);

  } catch (err) {
    console.error("Erreur OCR Image :", err);
  }
}