/* ── Admin : Liste des Commentaires ────────────────────────────────────────── */

function showFlash(msg, type = 'success') {
  const box = document.getElementById('flashBox');
  box.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show rounded-4 shadow-sm" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  setTimeout(() => { const a = box.querySelector('.alert'); if (a) a.remove(); }, 4000);
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
       + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function truncate(str, max = 100) {
  if (!str) return '—';
  return str.length > max ? str.substring(0, max) + '…' : str;
}

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
        const auteur = (c.auteur && c.auteur.trim()) ? c.auteur : c.num_cin || '—';
        const projet  = c.titre_projet ? c.titre_projet : (c.id_projet ? `#${c.id_projet}` : '—');
        tr.innerHTML = `
          <td class="text-nowrap">#${c.id_commentaire}</td>
          <td class="text-nowrap"><strong>${auteur}</strong></td>
          <td class="text-nowrap">${c.num_cin || '—'}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${projet}">${projet}</td>
          <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(c.contenu || '').replace(/"/g, '&quot;')}">${truncate(c.contenu, 80)}</td>
          <td class="text-nowrap">${formatDate(c.date_publication)}</td>
          <td class="text-center text-nowrap">
            <button class="btn btn-sm btn-outline-danger"
                    onclick="supprimerCommentaire(${c.id_commentaire}, this)">
              <i class="bi bi-trash"></i> Supprimer
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

document.addEventListener('DOMContentLoaded', chargerCommentaires);
