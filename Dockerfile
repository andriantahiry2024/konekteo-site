# Image statique minimale : nginx sert le dossier tel quel.
# Aucune étape de build : le site est du HTML/CSS/JS déjà prêt.
FROM nginx:alpine

# Configuration de service : cache long, compression, en-têtes de sécurité
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Contenu du site
COPY . /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
