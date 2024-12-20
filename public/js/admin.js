document
  .querySelector("#createCardForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Empêche le comportement par défaut du formulaire

    // Récupère les données du formulaire
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData); // Transforme les données du formulaire en un objet

    // Envoie la requête POST avec les données en JSON
    const response = await fetch("/api/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Assurez-vous que le serveur attend bien du JSON
      },
      body: JSON.stringify(data), // Transforme l'objet en JSON
    });

    if (response.ok) {
      alert("Carte créée avec succès !");
      location.reload(); // Recharge la page pour afficher la nouvelle carte
    } else {
      alert("Erreur lors de la création de la carte.");
    }
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
