<?php
require_once __DIR__ . '/../model/Signalement.php';
require_once __DIR__ . '/../model/Intervention.php';
require_once __DIR__ . '/../../../config.php';

echo "--- DÉBUT DES TESTS CIVICPLUS ELITE ---\n\n";

// 1. TEST PRIORITÉ AUTOMATIQUE
echo "1. Test Priorité Automatique :\n";
$s1 = new Signalement(null, 123, "Fuite de GAZ majeure", "Il y a une odeur de gaz dans la rue de la Paix", null);
$priorite = $s1->calculerPrioriteAutomatique();
echo "   > Texte : 'Fuite de GAZ majeure'\n";
echo "   > Priorité détectée : " . $priorite . " (Attendu: Critique)\n\n";

// 2. TEST EXTRACTION DE RUE
echo "2. Test Extraction de Rue :\n";
$rue = $s1->extraireRue();
echo "   > Description : '...rue de la Paix'\n";
echo "   > Rue extraite : " . $rue . " (Attendu: rue de la Paix)\n\n";

// 3. TEST ESTIMATION DE TEMPS
echo "3. Test Estimation de Temps :\n";
$estimation = Intervention::estimerTempsResolution('Éclairage');
echo "   > Type : 'Éclairage'\n";
echo "   > Temps estimé : " . $estimation . " (Attendu: 2-4 heures)\n\n";

// 4. TEST VERROUILLAGE DE CLÔTURE
echo "4. Test Verrouillage de Clôture :\n";
$i1 = new Intervention(null, 1, 'Réparation', 'Equipe A', '2026-04-24', 'termine', '');
$peutTerminer = $i1->peutEtreTerminee() ? "OUI" : "NON";
echo "   > Rapport technique : (vide)\n";
echo "   > Peut être terminée ? : " . $peutTerminer . " (Attendu: NON)\n";

$i1 = new Intervention(null, 1, 'Réparation', 'Equipe A', '2026-04-24', 'termine', 'Réparation du poteau effectuée avec succès.');
$peutTerminer = $i1->peutEtreTerminee() ? "OUI" : "NON";
echo "   > Rapport technique : 'Réparation du poteau...'\n";
echo "   > Peut être terminée ? : " . $peutTerminer . " (Attendu: OUI)\n\n";

echo "--- FIN DES TESTS ---";
?>
