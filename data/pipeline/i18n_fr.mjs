// French versions of the texts in rotations.mjs and crops.mjs (the app shows them when the language is FR).
// Keep the same order as the English lists.

export const ROTATIONS_FR = {
  wheat_mono: {
    name: 'Blé sur blé',
    why: 'La céréale en continu est la référence à laquelle on compare les autres stratégies.',
    benefits: [
      'Marché établi et conduite simple',
      'Les agriculteurs ont déjà les semences, le matériel et l’expérience',
    ],
    risks: [
      'Dans notre simulation, le blé est la culture la plus touchée par la chaleur de printemps et les saisons sèches',
      'Cultiver la même céréale chaque année peut favoriser les ravageurs et les maladies des racines des céréales',
      'Dépend de l’engrais azoté, puisqu’aucune légumineuse n’apporte d’azote au sol',
    ],
    gaps: [
      'La fréquence réelle du blé sur blé dans la région, l’usage réel d’engrais et les rendements',
      'La pression locale des ravageurs',
      'La couverture du sol, la matière organique et le fourrage dépendent de la gestion des résidus',
    ],
  },
  wheat_chickpea: {
    name: 'Blé → Pois chiche',
    why: 'Le pois chiche de printemps est une légumineuse qui diversifie une suite de céréales et peut fixer l’azote de l’air.',
    benefits: [
      'Peut laisser de l’azote pour le blé suivant, donc potentiellement moins d’engrais',
      'Peut aider à casser certains cycles de maladies des céréales',
      'Forte valeur au kilo, une deuxième source de revenu',
    ],
    risks: [
      'Le pois chiche est sensible à la chaleur en mai et à l’anthracnose (ascochytose) lors des printemps humides',
      'La récolte demande plus de main-d’œuvre, et les prix varient plus que ceux du blé',
    ],
    gaps: [
      'Le gain en azote dépend de la nodulation et de la gestion des résidus',
      'Les prix et la demande locale de pois chiche',
      'La pression des maladies dans la zone de l’agriculteur',
    ],
  },
  barley_faba: {
    name: 'Orge → Fève',
    why: 'L’orge est la céréale la plus résistante à la sécheresse et se récolte avant la chaleur de fin de printemps. La fève est une légumineuse qui fixe beaucoup d’azote, et ses résidus nourrissent le bétail.',
    benefits: [
      'L’option la plus résistante en saison sèche dans notre simulation sur les données NASA',
      'Gain potentiel en azote et en matière organique grâce aux résidus de fève',
      'Les deux cultures peuvent servir de fourrage, utile pour les fermes avec des moutons ou des vaches',
    ],
    risks: [
      'L’orge rapporte moins par tonne que le blé',
      'La fève a besoin de plus d’eau que les autres légumineuses et elle est sensible à la chaleur à la floraison',
    ],
    gaps: [
      'Si la ferme a du bétail ou un marché du fourrage à proximité',
      'Le fourrage et la couverture du sol dépendent de l’usage des résidus : donnés au bétail, pâturés ou laissés au sol',
      'Le type de sol : la fève pousse mal sur les sols très peu profonds',
    ],
  },
  wheat_lentil_barley: {
    name: 'Blé → Lentille → Orge',
    why: 'Une rotation sur trois ans répartit le risque sur trois cultures aux calendriers différents, et ne garde le blé qu’une année sur trois.',
    benefits: [
      'Casse le cycle du blé, même si le blé et l’orge peuvent partager certains ravageurs et maladies',
      'La lentille fixe l’azote et a un cycle court qui échappe à une partie de la chaleur de printemps',
      'Revenu diversifié : l’échec d’une seule culture ne ruine pas la ferme',
    ],
    risks: [
      'Plus complexe à planifier : trois types de semences et trois périodes de récolte',
      'La lentille est sensible à la chaleur à la floraison (mars - avril)',
    ],
    gaps: [
      'La suite exacte sur trois ans est un scénario à valider localement',
      'L’accès aux semences de lentille et aux acheteurs',
      'Le matériel pour récolter les légumineuses',
    ],
  },
};

export const SOIL_LABELS_FR = {
  nitrogen: 'Apporte de l’azote',
  cover: 'Couvre le sol (moins d’érosion)',
  organic_matter: 'Enrichit en matière organique',
  pest_break: 'Casse les cycles des ravageurs et maladies',
  forage: 'Nourrit le bétail',
};

export const CROPS_FR = {
  wheat: {
    name: 'Blé', planting_window: '1er nov - 15 déc', harvest_window: 'Mai - juin',
    notes: 'Principale céréale de la région. Souffre des printemps secs et de la chaleur pendant le remplissage du grain (avril - mai).',
  },
  barley: {
    name: 'Orge', planting_window: '1er nov - 15 déc', harvest_window: 'Mai',
    notes: 'Plus résistante à la sécheresse que le blé et récoltée plus tôt, elle échappe à une partie de la chaleur de fin de saison.',
  },
  chickpea: {
    name: 'Pois chiche', planting_window: 'Janv - févr', harvest_window: 'Juin',
    notes: 'Fixe l’azote, bonne culture après les céréales. Forte valeur au kilo.',
  },
  lentil: {
    name: 'Lentille', planting_window: 'Déc - janv', harvest_window: 'Mai',
    notes: 'Légumineuse à cycle court, sensible à la chaleur à la floraison.',
  },
  faba: {
    name: 'Fève', planting_window: 'Nov', harvest_window: 'Avr - mai',
    notes: 'A besoin de plus d’eau que les autres légumineuses, sensible à la chaleur à la floraison.',
  },
  olive: {
    name: 'Olivier', planting_window: 'Pérenne (plantation nov - mars)', harvest_window: 'Oct - déc',
    notes: 'Très résistant à la sécheresse une fois installé, investissement à long terme (3 à 5 ans avant le plein rendement).',
  },
  tomato: {
    name: 'Tomate (plein champ)', planting_window: 'Mars - avr', harvest_window: 'Juin - août',
    notes: 'Revenu élevé, mais demande une irrigation complète, donc dépend de l’accès à l’eau.',
  },
};

export const METHOD_FR = 'modèle à règles v1 (bilan hydrique + stress thermique + humidité de la zone racinaire)';

const fr = (n, d = 0) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function evidenceFr(r, base, [a, b], legumeCredit) {
  const m = r.metrics;
  const ev = [
    `Rejouée sur les vraies saisons ${a}-${b}, elle aurait perdu de l’argent ${fr(m.failed_seasons, m.failed_seasons % 1 ? 1 : 0)} saison${m.failed_seasons >= 2 ? 's' : ''} sur ${m.seasons}` +
      (r.current ? '.' : ` (blé sur blé : ${fr(base.metrics.failed_seasons, base.metrics.failed_seasons % 1 ? 1 : 0)}).`),
    `Adaptation au climat : ${m.score}/100 aujourd’hui, ${m.baseline_score}/100 avec le climat 1991-2005.`,
    `Lors de la saison récente la plus sèche (${m.dry_year - 1}-${m.dry_year}), ses cultures obtiennent ${m.dry_year_score}/100` +
      (r.current ? '.' : ` (blé sur blé : ${base.metrics.dry_year_score}).`),
    `Il faut environ ${fr(m.extra_water_mm)} mm d’eau en plus par saison pour un plein rendement (${fr(m.extra_water_mm * 10)} m³/ha).`,
  ];
  if (legumeCredit) {
    ev.push(`Le revenu inclut environ ${fr(legumeCredit)} MAD/ha d’engrais azoté économisés pour la céréale qui suit la légumineuse (estimation).`);
  }
  return ev;
}

export function assumptionsFr(effectiveRain, nCredit) {
  return [
    `Pluie efficace : ${fr(effectiveRain * 100)} % de la pluie des mois de culture atteint la culture (hypothèse).`,
    'Pénalité de chaleur : chaque °C de température maximale moyenne au-dessus de la limite de la culture pendant la floraison retire 12,5 % du rendement (hypothèse).',
    `Crédit azote : une céréale après une légumineuse économise environ ${fr(nCredit)} MAD/ha d’engrais (hypothèse, à valider localement).`,
    'Les rendements, les prix et les coûts sont des valeurs provisoires, à vérifier par région, variété et saison.',
    'Les profits, les pertes et les saisons à perte sont des résultats de simulation, pas des résultats observés sur des fermes.',
    'Les notes du sol (0-3) sont qualitatives et dépendent de la gestion des résidus.',
  ];
}
