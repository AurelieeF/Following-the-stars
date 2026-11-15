# Utilisation de l’IA — AuFX (brouillon à compléter par Lily)

> Les règles de NASA Space Apps demandent d’indiquer clairement où et comment l’IA a été utilisée.
> Les lignes marquées **[À confirmer]** sont à vérifier ou compléter par Lily.

## Résumé

| Partie du projet | Qui / quoi | IA ? |
|---|---|---|
| Idée du jeu, histoire, personnages, émotion visée, fin | Lily | Non. Discussions avec Claude pour structurer et proposer des options ; les choix finaux sont de Lily |
| Storyboard (images) | Lily, avec un générateur d’images **[À confirmer : quel outil]** | **Oui** — filigrane « Images générées par IA » sur chaque planche |
| Images de référence de l’astronaute | **[À confirmer : outil]** | **Oui** |
| Modèle 3D de l’astronaute dans Blender | Script Python Blender écrit par Lily **[À confirmer]**, ajusté avec Claude | Partiel |
| Modèles 3D dans le jeu (astronaute, robot, vaisseau, satellite, planètes) | Générés par code (Three.js) | **Oui** — code écrit avec Claude |
| Code du jeu (scènes, mini-jeux, API NASA, interface) | Claude (IA), dirigé et testé par Lily | **Oui** |
| Textes du jeu (dialogues FR/EN) | Écrits avec Claude à partir des idées de Lily, revus par Lily | **Oui (co-écrit)** |
| Sons et voix | **[À compléter : enregistrés par Lily / banque de sons / générés]** | **[À compléter]** |
| Photos NASA | Vraies données NASA (EPIC/DSCOVR, NASA Image and Video Library) | Non |

## Chronologie

1. **7 novembre** — Inscription de l’équipe AuFX (seule). Choix du défi *Space Mission Design Game*.
2. **7 novembre** — Design de l’astronaute : images de référence (IA), puis modélisation dans Blender par script Python (Claude, puis version de Lily).
3. **14 novembre (matin)** — Choix d’un jeu web en 3D (Three.js). Définition des missions : satellite, puis Lune, avec vraies photos NASA.
4. **14 novembre** — Écriture de l’histoire « Tu me trouveras dans les étoiles » (idée et direction de Lily ; options proposées par Claude). Storyboard en images IA par Lily.
5. **14 novembre** — Programmation du jeu avec Claude : 7 scènes, construction du vaisseau (budget/masse/portée), esquive de météorites, sortie dans l’espace, alunissage, révélation, générique, scène du robot.
6. **14 novembre** — Version française et anglaise.
7. **15 novembre** — Playtest complet avec Claude, corrections (vraies photos NASA, équilibre), puis ajout de l’instrument, de l’antenne, de l’énergie, du mode équipe (1 à 4 joueurs) et du rapport de mission avec score, pour coller aux objectifs du défi. Code écrit avec Claude, choix validés par Lily.
8. **[À compléter]** — Sons, voix, déploiement sur Vercel, vidéo de démo.

## Où l’IA est signalée dans le projet
- Générique de fin du jeu : « Code écrit avec l’aide d’une IA (Claude) » et « Images du storyboard générées par IA ».
- Images IA : filigrane visible.
- Ce fichier, dans le dépôt GitHub.
