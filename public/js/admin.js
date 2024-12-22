document
  .getElementById("createCardForm")
  .addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const hp = parseInt(document.getElementById("hp").value, 10);
    const image = document.getElementById("image").value;
    const type = document.getElementById("type").value;

    const attackName = document.getElementById("attack_name").value;
    const attackPower = parseInt(
      document.getElementById("attack_power").value,
      10
    );
    const attackDescription =
      document.getElementById("attack_description").value;

    const rarityLevel = parseInt(document.getElementById("rarity").value, 10);
    const rarityLabels = [
      "Très commun",
      "Commun",
      "Peu commun",
      "Rare",
      "Très rare",
    ];
    const rarityLabel = rarityLabels[rarityLevel];

    // Objet à envoyer
    const cardData = {
      attack: {
        name: attackName,
        power: attackPower,
        description: attackDescription,
      },
      rarity: {
        level: rarityLevel,
        label: rarityLabel,
      },
      name,
      hp,
      image,
      type,
    };

    console.log(cardData); // À remplacer par un envoi via fetch ou autre méthode
    alert(
      "Carte créée avec succès ! Consultez la console pour vérifier les données."
    );
  });

// Attachez un événement de soumission à chaque formulaire de suppression
document.querySelectorAll(".delete-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Empêche le rechargement de la page

    // Confirmation de la suppression
    if (confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) {
      const cardId = form.action.split("/").pop(); // Récupère l'ID de la carte à partir de l'URL

      try {
        // Effectue la requête DELETE
        const response = await fetch(`/api/cards/${cardId}`, {
          method: "DELETE", // Utilise DELETE au lieu de POST
        });

        if (response.ok) {
          alert("Carte supprimée avec succès");
          location.reload(); // Recharge la page pour mettre à jour la liste
        } else {
          alert("Erreur lors de la suppression de la carte");
        }
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  });
});
