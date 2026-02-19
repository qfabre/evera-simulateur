# Simulateur AEN — Logique de calcul

Documentation complète des formules, barèmes et règles métier du simulateur Avantage en Nature (AEN) Evera.

---

## Table des matières

1. [Paramètres d'entrée](#1-paramètres-dentrée)
2. [Règles par motorisation](#2-règles-par-motorisation)
3. [Calcul du coût énergie](#3-calcul-du-coût-énergie)
4. [Calcul de l'AEN — Méthode Forfait](#4-calcul-de-laen--méthode-forfait)
5. [Calcul de l'AEN — Méthode Réel](#5-calcul-de-laen--méthode-réel)
6. [Les 4 scénarios électriques](#6-les-4-scénarios-électriques)
7. [Décomposition des coûts](#7-décomposition-des-coûts)
8. [Calcul de l'économie](#8-calcul-de-léconomie)
9. [Barèmes fiscaux](#9-barèmes-fiscaux)
10. [Valeurs par défaut](#10-valeurs-par-défaut)
11. [Exemples chiffrés](#11-exemples-chiffrés)

---

## 1. Paramètres d'entrée

| Variable | Description | Unité |
|----------|-------------|-------|
| `L` | Loyer annuel TTC (LLD/LOA/Crédit-bail) ou coût d'achat TTC | € |
| `F` | Frais annexes = Assurance + Entretien + Pneumatiques | € / an |
| `co` | Consommation du véhicule | L/100km ou kWh/100km |
| `px` | Prix du carburant / de l'énergie | € / L ou € / kWh |
| `kmT` | Kilométrage total annuel | km |
| `kmP` | Kilométrage personnel annuel | km |
| `tS` | Taux de cotisations salariales | % |
| `tP` | Taux de cotisations patronales | % |
| `TMI` | Tranche marginale d'imposition | % |
| `fl` | Nombre de véhicules (flotte) | entier ≥ 1 |
| `carbI` | Carburant pris en charge par l'employeur | oui (1) / non (0) |

### Ratio personnel

```
r = kmP / kmT
```

Le ratio `r` représente la part d'usage personnel du véhicule. C'est le levier principal de la méthode au réel.

---

## 2. Règles par motorisation

| Motorisation | Consommation | Prix énergie | Carburant toggle | Forfait | Réel |
|---|---|---|---|---|---|
| **Diesel** | L/100km (défaut 6) | €/L (défaut 1.70) | Activable | 67% ou 50% | × r |
| **Essence** | L/100km (défaut 6) | €/L (défaut 1.70) | Activable | 67% ou 50% | × r |
| **Hybride** | L/100km (défaut 5) | €/L (défaut 1.70) | Activable | 67% ou 50% | × r |
| **Hybride recharg.** | L/100km (défaut 4) | €/L (défaut 1.70) | Activable | 67% ou 50% | × r |
| **Électrique** | kWh/100km (défaut 25) | €/kWh (défaut 0.40) | Désactivé (forcé OFF) | × 50% | × r |
| **Élec. éco-scoré** | kWh/100km (défaut 25) | €/kWh (défaut 0.40) | Désactivé (forcé OFF) | × 50% × 30% | × r × 50% |

### Toggle carburant

- **ON** → Forfait à **67%** : l'énergie est incluse dans le calcul de l'AEN
- **OFF** → Forfait à **50%** : l'énergie n'est pas incluse
- **Véhicules électriques** → Toggle verrouillé sur OFF, l'énergie n'entre jamais dans l'AEN

---

## 3. Calcul du coût énergie

### Coût énergie total (nT)

```
nT = (kmT × co / 100) × px
```

Exemple diesel : `(30 000 × 6 / 100) × 1.70 = 3 060 €`

### Coût énergie professionnel (nP)

```
nP = ((kmT − kmP) × co / 100) × px
```

Exemple diesel : `((30 000 − 9 000) × 6 / 100) × 1.70 = 2 142 €`

### Énergie dans les coûts véhicule (nE)

| Cas | nE (dans coût véhicule) |
|-----|-------------------------|
| Combustion + carburant inclus | `nP` (coût pro uniquement) |
| Combustion + carburant non inclus | `0` |
| Électrique / Éco-scoré | `0` |

---

## 4. Calcul de l'AEN — Méthode Forfait

L'AEN forfaitaire dépend de la motorisation et de la prise en charge du carburant.

### Thermique / Hybride — carburant inclus (67%)

```
AEN_forfait = (L + F + nT) × 0.67
```

L'énergie totale (`nT`) est intégrée à l'assiette, puis un abattement de 33% est appliqué.

### Thermique / Hybride — carburant non inclus (50%)

```
AEN_forfait = (L + F) × 0.50
```

Sans énergie, l'abattement passe à 50%.

### Électrique (50%)

```
AEN_forfait = (L + F) × 0.50
```

Pas d'énergie dans l'assiette. Abattement standard de 50%.

### Électrique éco-scoré (50% × 30% = 15%)

```
AEN_forfait = (L + F) × 0.50 × 0.30
```

Double abattement : 50% standard + bonus 70% (Art. 3 arrêté 2025). Le résultat net est **15% du coût véhicule** — c'est le scénario le plus avantageux.

---

## 5. Calcul de l'AEN — Méthode Réel

L'AEN au réel se base sur le ratio d'usage personnel `r`.

### Thermique / Hybride — carburant inclus

```
AEN_réel = (L + F + nT) × r
```

### Thermique / Hybride — carburant non inclus

```
AEN_réel = (L + F) × r
```

### Électrique

```
AEN_réel = (L + F) × r
```

### Électrique éco-scoré

```
AEN_réel = (L + F) × r × 0.50
```

Abattement de 50% appliqué en plus du ratio personnel.

---

## 6. Les 4 scénarios électriques

En complément des scénarios thermiques, le simulateur projette une hypothèse de passage à l'électrique éco-scoré :

| Scénario | AEN | Description |
|----------|-----|-------------|
| `s[0]` — Forfait actuel | Selon motorisation choisie | Méthode courante |
| `s[1]` — Réel actuel | Selon motorisation choisie | Avec suivi km Evera Fleet |
| `s[2]` — Forfait élec. | `(L + F) × 0.50 × 0.30` | Projection VE éco-scoré |
| `s[3]` — Réel élec. | `(L + F) × r × 0.50` | Projection VE éco-scoré + suivi |

L'énergie (`nE`) est toujours `0` pour les scénarios électriques.

---

## 7. Décomposition des coûts

Pour chaque scénario, les coûts sont décomposés côté salarié et côté employeur.

### Côté salarié

```
Charges salariales = AEN × tS
Impôt sur le revenu = AEN × TMI
Coût total salarié  = Charges salariales + Impôt
```

### Côté employeur

```
Coût véhicule       = L + F + nE
Charges patronales   = AEN × tP
Coût total employeur = Coût véhicule + Charges patronales
```

### Coût total par véhicule

```
Coût total = Coût total salarié + Coût total employeur
```

---

## 8. Calcul de l'économie

### Économie par véhicule / an

```
Économie = Coût total Forfait − Coût total Réel
         = (tS_forfait + tE_forfait) − (tS_réel + tE_réel)
```

Si le résultat est positif → le passage au Réel est avantageux.

### Économie flotte / an

```
Économie flotte = Économie × fl
```

---

## 9. Barèmes fiscaux

### Cotisations salariales

| Taux | Contexte |
|------|----------|
| 18% | Minimum |
| 20% | — |
| **22%** | **Standard (défaut)** |
| 24% | — |
| 25% | Cadre |

### Cotisations patronales

| Taux | Contexte |
|------|----------|
| 35% | Minimum |
| 38% | — |
| **42%** | **Standard (défaut)** |
| 45% | Cadre |
| 48% | Maximum |

### Tranche marginale d'imposition (TMI)

| Taux | Tranche de revenu |
|------|-------------------|
| 0% | Jusqu'à 11 294 € |
| 11% | De 11 295 à 28 797 € |
| **30%** | **De 28 798 à 82 341 € (défaut)** |
| 41% | De 82 342 à 177 106 € |
| 45% | Au-delà de 177 106 € |

---

## 10. Valeurs par défaut

| Paramètre | Valeur |
|-----------|--------|
| Motorisation | Diesel |
| Acquisition | LLD / LOA |
| Loyer annuel TTC | 12 000 € |
| Consommation | 6 L/100km |
| Prix carburant | 1,70 €/L |
| Carburant inclus | Oui |
| Assurance | 1 000 €/an |
| Entretien | 800 €/an |
| Pneumatiques | 400 €/an |
| Kilométrage total | 30 000 km |
| Kilométrage personnel | 9 000 km (30%) |
| Cotisations salariales | 22% |
| Cotisations patronales | 42% |
| TMI | 30% |

---

## 11. Exemples chiffrés

### Exemple 1 — Diesel, carburant inclus

**Entrées** : Diesel, LLD, loyer 12 000 €, frais 2 200 €, 6 L/100km, 1.70 €/L, 30 000 km total, 9 000 km perso (r = 0.30), tS 22%, tP 42%, TMI 30%.

**Énergie** :
```
nT = (30 000 × 6 / 100) × 1.70 = 3 060 €
nP = (21 000 × 6 / 100) × 1.70 = 2 142 €
```

**AEN** :
```
Forfait = (12 000 + 2 200 + 3 060) × 0.67 = 11 564 €
Réel    = (12 000 + 2 200 + 3 060) × 0.30 =  5 178 €
```

**Forfait** :
| | Montant |
|---|---|
| AEN | 11 564 € |
| Charges salariales | 2 544 € |
| Impôt | 3 469 € |
| **Coût salarié** | **6 013 €** |
| Coût véhicule + énergie | 16 342 € |
| Charges patronales | 4 857 € |
| **Coût employeur** | **21 199 €** |
| **Total** | **27 212 €** |

**Réel** :
| | Montant |
|---|---|
| AEN | 5 178 € |
| Charges salariales | 1 139 € |
| Impôt | 1 553 € |
| **Coût salarié** | **2 692 €** |
| Coût véhicule + énergie | 16 342 € |
| Charges patronales | 2 175 € |
| **Coût employeur** | **18 517 €** |
| **Total** | **21 209 €** |

**Économie** : 27 212 − 21 209 = **6 003 € / véhicule / an**

---

### Exemple 2 — Électrique éco-scoré

**Entrées** : Éco-scoré, LLD, loyer 12 000 €, frais 2 200 €, 25 kWh/100km, 0.40 €/kWh, 30 000 km total, 9 000 km perso (r = 0.30), tS 22%, tP 42%, TMI 30%.

**Énergie** : `nE = 0` (non prise en compte)

**AEN** :
```
Forfait = (12 000 + 2 200) × 0.50 × 0.30 = 2 130 €
Réel    = (12 000 + 2 200) × 0.30 × 0.50 = 2 130 €
```

> Pour un ratio perso de 30%, Forfait et Réel éco-scoré convergent. Le Forfait est plus avantageux dès que `r > 15%`.

**Forfait** :
| | Montant |
|---|---|
| AEN | 2 130 € |
| Charges salariales | 469 € |
| Impôt | 639 € |
| **Coût salarié** | **1 108 €** |
| Coût véhicule | 14 200 € |
| Charges patronales | 895 € |
| **Coût employeur** | **15 095 €** |
| **Total** | **16 203 €** |

---

## Tableau récapitulatif des formules AEN

| Scénario | Assiette | Taux forfait | Formule Forfait | Formule Réel |
|---|---|---|---|---|
| Thermique, carburant inclus | L + F + nT | 67% | `(L+F+nT) × 0.67` | `(L+F+nT) × r` |
| Thermique, carburant non inclus | L + F | 50% | `(L+F) × 0.50` | `(L+F) × r` |
| Électrique | L + F | 50% | `(L+F) × 0.50` | `(L+F) × r` |
| Élec. éco-scoré | L + F | 15% | `(L+F) × 0.50 × 0.30` | `(L+F) × r × 0.50` |

**Légende** : L = loyer annuel, F = frais annexes, nT = coût énergie total, r = kmP / kmT
