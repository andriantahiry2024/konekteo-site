# Image statique minimale : nginx sert le site tel quel.
# Aucune étape de compilation : ce dépôt contient du HTML/CSS/JS déjà prêt.
FROM nginx:alpine

# Configuration nginx principale : cache par type, compression, en-têtes de sécurité
COPY nginx.conf /etc/nginx/nginx.conf

# Contenu public uniquement — jamais le Dockerfile, le README ni la configuration nginx
COPY index.html favicon.svg manifest.webmanifest robots.txt sitemap.xml /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
