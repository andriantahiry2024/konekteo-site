# Konekteo — site vitrine

Site vitrine **statique** (HTML + CSS + JavaScript, aucune dépendance, aucun build) qui présente
trois services : **sites & plateformes web**, **applications mobiles**, **automatisations & IA**.

- Direction artistique sombre et éditoriale, accent **or `#fbbf24`** réservé aux appels à l'action.
- Animations au défilement, galerie horizontale épinglée, curseur personnalisé, bandeau défilant.
- Responsive du téléphone (390 px) au grand écran, avec replis sans JavaScript et en mouvement réduit.
- Aucun appel réseau externe : polices auto-hébergées, visuels dessinés en CSS.

## Aperçu en local

```bash
cd konekteo-site
python3 -m http.server 4321
# puis ouvrir http://127.0.0.1:4321/
```

N'importe quel serveur statique convient (`npx serve`, `php -S`, nginx, Apache…).
Ouvrir `index.html` directement par double-clic fonctionne aussi, sauf les polices dans certains
navigateurs qui bloquent `file://` — mieux vaut passer par un petit serveur.

## Arborescence

```
konekteo-site/
├── index.html                  # tout le contenu, en français, commenté par section
├── favicon.svg                 # cube Konekteo
├── manifest.webmanifest        # installation sur mobile
├── robots.txt · sitemap.xml    # référencement
├── Dockerfile · nginx.conf     # service en production (nginx + cache + en-têtes)
└── assets/
    ├── css/main.css            # design system + mise en page + animations
    ├── js/main.js              # interactions, découpé en modules numérotés
    ├── fonts/                  # Bricolage Grotesque, Inter, Instrument Serif (woff2, latin)
    └── img/og.png              # image de partage social 1200 × 630
```

## À personnaliser avant mise en ligne

Tout est dans `index.html`, repérable par les commentaires `<!-- ==== SECTION ==== -->`.

| Quoi | Où | Valeur actuelle (à remplacer) |
| --- | --- | --- |
| E-mail | section Contact + pied de page + JSON-LD | `contact@konekteo.com` |
| WhatsApp | section Contact + pied de page | `+261 34 00 000 00` et `https://wa.me/261340000000` |
| Nom de domaine | `<link rel="canonical">`, Open Graph, `robots.txt`, `sitemap.xml` | `https://vitrine.konekteo.com/` |
| Ville / zone | section Contact (`Zone`) | « À distance, partout » |
| Études de cas | section `#realisations` | 4 projets réels ; adaptez les titres et périmètres |
| Témoignages | bloc commenté en fin de `<main>` | à activer **uniquement** avec de vrais retours clients |

Les chiffres de la section « Engagements » (3, 24 h, 100 %, 30 j) décrivent le fonctionnement,
pas un palmarès : gardez-les exacts.

### Modifier les couleurs ou les typographies

Tout part des jetons en haut de `assets/css/main.css` :

```css
--gold: #fbbf24;   /* accent, appels à l'action uniquement */
--ink:  #08090b;   /* fond principal */
--cream:#f1eee6;   /* section « manifeste », en clair */
```

### Remplacer le logo

`favicon.svg` et les trois `<svg viewBox="0 0 100 100">` en ligne (en-tête, préchargeur, pied de page)
partagent le même dessin. Remplacez les `<polygon>` par vos formes en conservant `fill: currentColor`
ou la couleur `--gold`.

## Le formulaire de contact

Il fonctionne **sans serveur** : à la validation, il compose un e-mail pré-rempli vers l'adresse
configurée et ouvre le logiciel de messagerie du visiteur. Les champs obligatoires sont vérifiés
côté navigateur, le premier champ en erreur reprend le focus, et le statut est annoncé aux lecteurs
d'écran (`aria-live`).

Pour recevoir les demandes dans une boîte mail sans passer par le client du visiteur, branchez un
service de formulaire (Formspree, Web3Forms, Netlify Forms, ou votre propre API) : dans
`assets/js/main.js`, fonction `form()`, remplacez la ligne qui définit `href` par un `fetch()` vers
votre point d'entrée (méthode `POST`, corps `FormData`), puis affichez le message de confirmation
déjà prévu dans `#formStatus`.

## Déploiement

Le dossier est autonome : déposez-le tel quel chez l'hébergeur.

- **Netlify / Cloudflare Pages / Vercel** : glisser-déposer le dossier, aucune commande de build.
- **Hébergement classique (FTP, nginx, Apache)** : copiez le contenu à la racine du site.
- **GitHub Pages** : poussez le dossier sur la branche publiée ; le `.nojekyll` n'est pas nécessaire,
  aucun fichier ne commence par un souligné.

En-têtes recommandés côté serveur (optionnel) :

```
Cache-Control: public, max-age=31536000, immutable   # /assets/fonts/*, /assets/img/*
Cache-Control: public, max-age=3600                  # /*.html, /assets/css/*, /assets/js/*
```

## Qualité

- **Accessibilité** : lien d'évitement, structure sémantique, `aria-expanded` sur les accordéons et le
  menu, piège à focus et `Échap` dans le menu plein écran, cibles tactiles ≥ 40 px, contrastes
  vérifiés, `prefers-reduced-motion` respecté (aucune animation, préchargeur désactivé).
- **Robustesse** : sans JavaScript, tout le contenu reste lisible et navigable ; chaque module JS est
  isolé pour qu'une erreur n'entraîne pas les autres.
- **Performance** : aucune bibliothèque, ~30 Ko de CSS et JS, polices limitées au latin (≈ 285 Ko),
  animations en `transform`/`opacity` uniquement.

## Licence

Contenu et code produits pour Konekteo. Les polices sont sous SIL Open Font License
(Bricolage Grotesque, Inter, Instrument Serif).
