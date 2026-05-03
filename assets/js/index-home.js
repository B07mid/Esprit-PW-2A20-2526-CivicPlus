document.addEventListener('DOMContentLoaded', function () {
    const cta = document.querySelector('[data-hide-when-auth="true"]');
    if (!cta) return;

    fetch('Modules/User/Controller/auth.php')
        .then(response => response.json())
        .then(session => {
            if (session && session.logged_in) {
                cta.remove();
            }
        })
        .catch(() => {
            // If auth cannot be checked, keep the visitor CTA visible.
        });
});
