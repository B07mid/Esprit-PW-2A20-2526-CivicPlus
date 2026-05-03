/* ── Admin : Liste des Commentaires ────────────────────────────────────────── */

/** Affiche une alerte Bootstrap temporaire (4 secondes) dans la zone #flashBox.
 *  @param {string} msg  - Texte du message à afficher
 *  @param {string} type - Type Bootstrap : 'success', 'danger', 'warning', etc. */
function showFlash(msg, type = 'success') {
  const box = document.getElementById('flashBox');
  box.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show rounded-4 shadow-sm" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  setTimeout(() => { const a = box.querySelector('.alert'); if (a) a.remove(); }, 4000);
}

/** Formate une chaîne de date ISO en format lisible 'JJ/MM/AAAA HH:MM' en français.
 *  Retourne '—' si la date est nulle ou invalide. */
function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
       + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Tronque une chaîne de texte à un nombre de caractères maximum et ajoute '…'.
 *  Retourne '—' si la chaîne est vide ou nulle. */
function truncate(str, max = 90) {
  if (!str) return '—';
  return str.length > max ? str.substring(0, max) + '…' : str;
}

/** Récupère tous les commentaires depuis l'API et les affiche dans le tableau backoffice.
 *  Chaque ligne inclut les badges de statut, un bouton d'édition, de blocage et de suppression. */
function chargerCommentaires() {
  fetch('../controller/CommentaireController.php?action=getAll')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('commentairesTableBody');
      tbody.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              <i class="bi bi-chat-dots me-2 fs-5"></i>Aucun commentaire trouvé
            </td>
          </tr>`;
        return;
      }

      data.forEach(c => {
        const tr = document.createElement('tr');
        if (c.statut === 'bloqué') tr.classList.add('table-danger', 'opacity-75');

        const auteur = (c.auteur && c.auteur.trim()) ? c.auteur : c.num_cin || '—';
        const projet  = c.titre_projet ? c.titre_projet : `#${c.id_projet}`;
        const statutBadge = c.statut === 'bloqué'
          ? '<span class="badge bg-danger">Bloqué</span>'
          : '<span class="badge bg-success">Visible</span>';
        const userBloquéBadge = c.statut_compte === 'bloqué_commentaires'
          ? ' <span class="badge bg-danger bg-opacity-75 ms-1" title="Utilisateur bloqué des commentaires"><i class="bi bi-ban"></i> Bloqué</span>'
          : '';
        const lockIcon = c.statut === 'bloqué' ? 'bi-unlock' : 'bi-lock';
        const lockTitle = c.statut === 'bloqué' ? 'Débloquer' : 'Bloquer';

        tr.innerHTML = `
          <td><span class="badge bg-secondary">#${c.id_commentaire}</span></td>
          <td class="text-nowrap fw-semibold">${auteur}${userBloquéBadge}<br><code class="text-primary small">${c.num_cin || ''}</code></td>
          <td class="text-truncate" style="max-width:130px;" title="${projet}">
            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill">${truncate(projet, 25)}</span>
          </td>
          <td class="text-truncate" style="max-width:220px;" title="${(c.contenu || '').replace(/"/g,'&quot;')}">${truncate(c.contenu)}</td>
          <td class="text-nowrap text-muted small">${formatDate(c.date_publication)}</td>
          <td>${statutBadge}</td>
          <td class="text-center text-nowrap">
            <button class="btn btn-sm btn-outline-primary me-1" title="Modifier"
                    onclick="ouvrirEdit(${c.id_commentaire}, ${JSON.stringify(c.contenu || '')})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning me-1" title="${lockTitle}"
                    onclick="toggleBlock(${c.id_commentaire}, this)">
              <i class="bi ${lockIcon}"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" title="Supprimer"
                    onclick="supprimerCommentaire(${c.id_commentaire}, this)">
              <i class="bi bi-trash3"></i>
            </button>
          </td>`;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error('Erreur chargement commentaires:', err);
      showFlash('Erreur lors du chargement des commentaires.', 'danger');
    });
}

/** Ouvre le modal d'édition et pré-remplit le champ 'contenu' avec le texte du commentaire sélectionné.
 *  @param {number} id      - ID du commentaire à modifier
 *  @param {string} contenu - Texte actuel du commentaire */
function ouvrirEdit(id, contenu) {
  document.getElementById('edit_id').value      = id;
  document.getElementById('edit_contenu').value = contenu;
  new bootstrap.Modal(document.getElementById('editModal')).show();
}

/** Récupère le nouveau contenu du modal et envoie un POST à l'API pour mettre à jour le commentaire.
 *  Ferme le modal, affiche un flash de confirmation et recharge le tableau en cas de succès. */
function sauvegarderEdit() {
  const id      = document.getElementById('edit_id').value;
  const contenu = document.getElementById('edit_contenu').value.trim();
  if (!contenu) { showFlash('Le contenu ne peut pas être vide.', 'warning'); return; }

  const form = new FormData();
  form.append('action', 'update');
  form.append('id', id);
  form.append('contenu', contenu);

  fetch('../controller/CommentaireController.php', { method: 'POST', body: form })
    .then(r => r.json())
    .then(data => {
      bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
      if (data.success) {
        showFlash('Commentaire modifié avec succès.');
        chargerCommentaires();
      } else {
        showFlash('Erreur lors de la modification.', 'danger');
      }
    })
    .catch(() => showFlash('Erreur réseau.', 'danger'));
}

/** Bascule le statut d'un commentaire entre 'visible' et 'bloqué' via l'API.
 *  Bloque ou débloque également le compte citoyen associé, puis recharge le tableau. */
function toggleBlock(id, btn) {
  btn.disabled = true;
  fetch(`../controller/CommentaireController.php?action=block&id=${id}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const msg = data.statut === 'bloqué' ? 'Commentaire bloqué.' : 'Commentaire débloqué.';
        const type = data.statut === 'bloqué' ? 'warning' : 'success';
        showFlash(msg, type);
        chargerCommentaires();
      } else {
        showFlash('Erreur lors du blocage.', 'danger');
        btn.disabled = false;
      }
    })
    .catch(() => { showFlash('Erreur réseau.', 'danger'); btn.disabled = false; });
}

/** Demande confirmation puis supprime définitivement un commentaire via l'API.
 *  Recharge le tableau si la suppression réussit. */
function supprimerCommentaire(id, btn) {
  if (!confirm('Supprimer ce commentaire ?')) return;
  btn.disabled = true;

  fetch(`../controller/CommentaireController.php?action=delete&id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showFlash('Commentaire supprimé avec succès.');
        chargerCommentaires();
      } else {
        showFlash('Erreur lors de la suppression.', 'danger');
        btn.disabled = false;
      }
    })
    .catch(() => {
      showFlash('Erreur réseau.', 'danger');
      btn.disabled = false;
    });
}

document.addEventListener('DOMContentLoaded', () => {
  chargerCommentaires();
  document.getElementById('btnSaveEdit').addEventListener('click', sauvegarderEdit);
});
