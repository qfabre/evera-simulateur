# Evera — Simulateurs

Simulateurs Evera pour l'optimisation de flottes automobiles, intégrés en embed Webflow.

## Structure du repo

| Branche | Contenu |
|---------|---------|
| `main` | Base commune : design system (`base.css`), template HTML, consignes Claude Code (`CLAUDE.md`) |
| `simulateur-aen` | Simulateur Avantage en Nature (AEN) |
| `simulateur-tco` | Simulateur Total Cost of Ownership (TCO) |

## Créer un nouveau simulateur

```bash
git checkout -b simulateur-{nom} main
```

Voir `CLAUDE.md` pour les conventions et la documentation complète du design system.

## Stack

- HTML / CSS / JS vanilla (pas de build)
- Intégration via embed Webflow
- CDN jsDelivr pour le CSS/JS
- Leads via Zapier webhook
