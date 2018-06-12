let default_personal_stats =
{
  "sickPr": 0,
  "health": 10,
  "rebirthPr": 0.002,
  "strength": 1,
  "speed": 4,
  "levelUpPr": 0.0005,
  "deadHunger": 5,
  "dHunger": 0.018,
  "dAge": 0.01,
  "age": 0,
  "hunger": 0
};

let personals_traits_deltas =
{
  "bear":
  [
    "Very high tolerance for hunger. Very high strength, Lower rebirth and level up rates",
    {
      "rebirthPr": -0.001,
      "strength": +2,
      "levelUpPr": -0.0003,
      "deadHunger": +10
    }
  ],

  "butterfly":
  [
    "Pretty average. Most well balanced.",
    {

    }
  ],

  "crab":
  [
    "Very healthy. A little bit hungrier and slower.",
    {
      "health": +10,
      "dHunger": 0.03,
      "speed": -1
    }
  ],

  "dog":
  [
    "Reproduces a lot. Lower health.",
    {
      "health": -3,
      "rebirthPr": 0.0015
    }
  ],

  "shark":
  [
    "Very fast. More likely to upgrade. Lower reproduction. Lower health.",
    {
      "health": -1,
      "levelUpPr": +0.0005,
      "rebirthPr": -0.0005,
      "speed": +2
    }
  ]

};

let personal_stats = {};
let personal_descriptions = {};
for (let i in personals_traits_deltas)
{
  personal_descriptions[i] = personals_traits_deltas[i][0];
  let temp = {};
  for (let j in default_personal_stats)
  {
    if (personals_traits_deltas[i][1][j])
    {
      temp[j] = default_personal_stats[j] + personals_traits_deltas[i][1][j];
    }
    else {
      temp[j] = default_personal_stats[j];
    }
  }
  personal_stats[i] = temp;
}

// let predator_traits =
// {
//   "dino":
//   [
//     "Typical Predator",
//     {
//       "health": 100,
//       "power": 1,
//       "speed": 3.2,
//       "sightR": 500
//     }
//   ]
//
// };
//
// let prey_traits =
// {
//   "pizza":
//   [
//     "default",
//     {
//     }
//   ],
//   "cake":
//   [
//     "default",
//     {
//     }
//   ]
// };