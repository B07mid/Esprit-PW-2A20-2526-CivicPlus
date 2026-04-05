document.addEventListener("DOMContentLoaded", () => {
  const typesBody = document.getElementById("typesBody");
  const totalTypes = document.getElementById("totalTypes");

  // Exemple de données statiques
  const types = [
    {id: 1, libelle: "Extrait de naissance", prix: "0.500", delai: 3, demandes: 12},
    {id: 2, libelle: "Carte d’identité", prix: "5.000", delai: 7, demandes: 8},
    {id: 3, libelle: "Permis de construire", prix: "10.000", delai: 15, demandes: 3}
  ];

  // Injection dans le tableau
  types.forEach(t => {
    typesBody.innerHTML += `
      <tr>
        <td>${t.id}</td>
        <td>${t.libelle}</td>
        <td>${t.prix}</td>
        <td>${t.delai}</td>
        <td>${t.demandes}</td>
        <td>
          <button class="btn btn-sm btn-warning"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  totalTypes.textContent = types.length + " types";
});
