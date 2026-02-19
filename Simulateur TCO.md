# Simulateur TCO (Total Cost of Ownership)

## Objectif

Le simulateur TCO permet aux gestionnaires de flotte de **comparer le coût total de possession** entre un véhicule actuel (thermique, hybride ou électrique) et un véhicule électrique cible, en intégrant tous les postes de dépense : énergie, acquisition, taxes et fiscalité.

---

## Fonctionnalités

### 1. Deux modes de saisie

| Mode | Description |
|---|---|
| **Estimation rapide** | Sélection d'une catégorie de véhicule avec valeurs pré-remplies |
| **Données personnalisées** | Saisie manuelle de tous les paramètres du véhicule actuel et cible |

### 2. Catégories de véhicules (mode rapide)

| Catégorie | Exemple thermique | Exemple électrique |
|---|---|---|
| Citadine | Renault Clio | Peugeot e-208 |
| Compact | VW Golf | Renault Mégane E-Tech |
| Berline | Škoda Octavia | Tesla Model 3 |
| SUV | Peugeot 3008 | Tesla Model Y |

### 3. Motorisations supportées

- **Diesel** / **Essence** : traitement thermique classique
- **Hybride** / **Hybride rechargeable** : fiscalement traités comme thermique (essence)
- **Électrique** : pour comparer un VE actuel vs un VE cible optimisé

---

## Paramètres de saisie

### Véhicule actuel

| Paramètre | Description | Défaut (catégorie) |
|---|---|---|
| Motorisation | Diesel, Essence, Hybride, Hybride rechargeable, Électrique | — |
| Consommation | L/100km ou kWh/100km | Selon catégorie |
| Émissions CO2 | g/km (WLTP) | Selon catégorie |
| Masse en ordre de marche | kg | Selon catégorie |
| Loyer mensuel | €/mois | Selon catégorie |
| Assurance annuelle | €/an | Selon catégorie |
| Prix d'achat | € (pour calcul amortissement) | Selon catégorie |

### Véhicule cible (toujours électrique)

| Paramètre | Description | Défaut (catégorie) |
|---|---|---|
| Consommation | kWh/100km | Selon catégorie |
| Masse | kg | Selon catégorie |
| Loyer mensuel | €/mois | Selon catégorie |
| Assurance annuelle | €/an | Selon catégorie |
| Prix d'achat | € | Selon catégorie |
| Prix batterie | € (pour plafond amortissement) | Selon catégorie |

### Paramètres communs

| Paramètre | Défaut |
|---|---|
| Kilométrage annuel | Saisi par l'utilisateur |
| % recharge privée | Slider 0–100% |
| Prix carburant | 1,72 €/L (diesel), 1,84 €/L (essence) |
| Prix kWh privé | 0,25 €/kWh |
| Prix kWh public | 0,55 €/kWh |
| Taux charges employeur | 45% |
| Taux IS | 25% |

---

## Structure des résultats (TCODetaillee)

Pour chaque véhicule (actuel et cible), le simulateur calcule :

### 1. Coût énergie

- **Consommation annuelle** : (conso/100) × km annuel
- **Coût énergie annuel** : consommation × prix unitaire
- **Coût par km** et **coût aux 100 km**

Pour les VE, le prix kWh est une moyenne pondérée : `(prix privé × % privé) + (prix public × % public)`

### 2. Coût acquisition & détention

- **Loyer annuel** : loyer mensuel × 12
- **Assurance** annuelle
- **Pneumatiques** : 360 €/an (fixe)

### 3. Taxes (réforme 2025/2026)

#### Taxe polluants (Crit'Air)

| Type | Montant |
|---|---|
| Diesel (Crit'Air 2) | 100 €/an |
| Essence (Crit'Air 1) | 100 €/an |
| Électrique | 0 € |

#### Taxe CO2 WLTP 2026 (barème marginal)

| Tranche (g/km) | Tarif par g |
|---|---|
| 0–4 | 0 € |
| 5–45 | 1 €/g |
| 46–53 | 2 €/g |
| 54–85 | 3 €/g |
| 86–105 | 4 €/g |
| 106–125 | 10 €/g |
| 126–145 | 50 €/g |
| 146–165 | 60 €/g |
| ≥ 166 | 65 €/g |

> Les VE sont exonérés de taxe CO2.

#### Taxe masse en ordre de marche 2026

| Tranche (kg) | Tarif par kg |
|---|---|
| ≤ 1499 | 0 € |
| 1500–1699 | 10 €/kg |
| 1700–1799 | 15 €/kg |
| 1800–1899 | 20 €/kg |
| 1900–1999 | 25 €/kg |
| ≥ 2000 | 30 €/kg |

> Les VE bénéficient d'une **exonération totale** (Loi de finances 2026).
> Le montant est amorti sur 5 ans.

### 4. Coûts fiscaux (réforme AEN février 2025)

#### Amortissements Non Déductibles (AND)

| Type | Plafond amortissement |
|---|---|
| Thermique | 18 300 € |
| Électrique | 30 000 € |

```
Base amortissement annuelle = prix achat / 5
Montant non déductible = max(0, base − plafond/5)
Coût IS = montant non déductible × taux IS (25%)
```

#### Avantage en Nature (AEN) forfaitaire

```
Base AEN = loyer annuel + assurance + pneumatiques
AEN forfaitaire = base × 50% (taux LLD hors carburant)
```

**Pour les VE :**
```
Abattement = min(AEN forfaitaire × 70%, 4 582 €)
AEN net = max(0, AEN forfaitaire − abattement)
```

**Pour les thermiques :** pas d'abattement.

```
Coût AEN = AEN net × taux charges employeur (45%)
Total fiscal = coût IS + coût AEN
```

### 5. Coût global

```
Coût global annuel = coût énergie + acquisition & taxes + coûts fiscaux
Coût global mensuel = coût global annuel / 12
```

---

## Résultats de comparaison

| Indicateur | Formule |
|---|---|
| **Économie annuelle** | Coût global actuel − Coût global cible |
| **Économie en %** | Économie / Coût actuel × 100 |

---

## Logique de comparaison

```
Véhicule actuel (thermique/hybride/VE)
        ↓ comparé à ↓
Véhicule cible (toujours VE)
        ↓
Économie = coût actuel − coût cible
```

> Si le véhicule actuel est déjà électrique, la comparaison porte sur un VE optimisé de la même catégorie.

---

## Capture de leads

Avant l'affichage des résultats, une modale propose à l'utilisateur de laisser ses coordonnées. Le header affiche le montant d'économie pré-calculé pour encourager la conversion.

---

## Stack technique

- **Frontend** : React + TypeScript + Tailwind CSS + shadcn/ui
- **Calculs** : `src/lib/tco-calculations.ts` (logique pure, sans dépendance externe)
- **Tests** : `src/test/tco-calculations.test.ts` (Vitest)
- **Graphiques** : Recharts (barres comparatives)
