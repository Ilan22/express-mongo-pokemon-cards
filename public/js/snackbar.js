function showSnackbar(message, type = 'success') {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.className = `snackbar ${type} show`;
    
    // Retirer la classe show après 5 secondes
    setTimeout(() => {
        snackbar.className = snackbar.className.replace('show', '');
    }, 5000);
} 