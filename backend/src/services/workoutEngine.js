const generatePremiumWorkout = (daysCount) => {
  const parsedDays = Number(daysCount) || 2;

  if (parsedDays === 2) {
    return {
      type: "Full body - 2 dana",
      description:
        "Blagi program sa sopstvenom težinom. Započni sa pet minuta laganog zagrevanja, odmaraj između serija i prilagodi pokret svom nivou. Prekini ako osetiš bol ili vrtoglavicu.",
      schedule: [
        {
          day: "Dan 1: Osnovna snaga",
          exercises: [
            {
              name: "Čučanj do stolice",
              volume: "2-3 serije x 8-12 ponavljanja",
              form: "Stani ispred stabilne stolice, pomeri kukove unazad i spusti se samo do udobne dubine. Ustani kontrolisano; koristi naslon za oslonac ako je potrebno.",
            },
            {
              name: "Sklek uz zid",
              volume: "2-3 serije x 8-12 ponavljanja",
              form: "Postavi dlanove u visini grudi na zid. Savij laktove i približi se polako, pa se odgurni bez zadržavanja daha.",
            },
            {
              name: "Podizanje kukova",
              volume: "2 serije x 8-12 ponavljanja",
              form: "Lezi na leđa sa savijenim kolenima. Podigni kukove do udobne visine, kratko zategni zadnjicu i spusti se kontrolisano.",
            },
          ]
        },
        {
          day: "Dan 2: Stabilnost i ravnoteža",
          exercises: [
            {
              name: "Podizanje na prste uz oslonac",
              volume: "2-3 serije x 8-12 ponavljanja",
              form: "Drži se stabilne površine, podigni pete i spusti ih polako. Radi u opsegu koji ti prija.",
            },
            {
              name: "Bird dog",
              volume: "2 serije x 6-8 ponavljanja po strani",
              form: "Na sve četiri, ispruži suprotnu ruku i nogu bez uvrtanja leđa. Zadrži kratko i vrati se kontrolisano; smanji opseg ako je potrebno.",
            },
            {
              name: "Marširanje u mestu uz oslonac",
              volume: "2 serije x 30-45 sekundi",
              form: "Drži se za stolicu po potrebi i naizmenično podiži stopala. Održavaj tempo pri kom možeš normalno da razgovaraš.",
            },
          ]
        }
      ]
    };
  }

  return {
    type: "Full body - 3 dana",
    description:
      "Tri kratka treninga nedeljno sa danom odmora između. Započni lagano, odmori između serija i koristi samo udoban opseg pokreta. Prekini ako osetiš bol ili vrtoglavicu.",
    schedule: [
      {
        day: "Dan 1: Pokretljivost i snaga",
        exercises: [
          {
            name: "Čučanj do stolice",
            volume: "2-3 serije x 8-12 ponavljanja",
            form: "Spusti se polako ka stabilnoj stolici do udobne dubine i ustani kontrolisano. Koristi oslonac ako je potreban.",
          },
          {
            name: "Sklek uz zid",
            volume: "2-3 serije x 8-12 ponavljanja",
            form: "Osloni dlanove o zid u visini grudi. Približi se polako i odgurni se bez zaključavanja laktova.",
          },
          {
            name: "Podizanje kukova",
            volume: "2 serije x 8-12 ponavljanja",
            form: "Lezi na leđa, savij kolena i podigni kukove do udobne visine. Spuštaj se polako.",
          },
        ]
      },
      {
        day: "Dan 2: Kontrola i ravnoteža",
        exercises: [
          {
            name: "Podizanje na prste uz oslonac",
            volume: "2-3 serije x 8-12 ponavljanja",
            form: "Drži se stabilne površine, podigni pete i spusti ih polako.",
          },
          {
            name: "Bird dog",
            volume: "2 serije x 6-8 ponavljanja po strani",
            form: "Na sve četiri, ispruži suprotnu ruku i nogu bez uvrtanja leđa. Vrati se kontrolisano.",
          },
          {
            name: "Marširanje u mestu uz oslonac",
            volume: "2 serije x 30-45 sekundi",
            form: "Podiži naizmenično stopala uz stabilan oslonac, tempom pri kom možeš normalno da razgovaraš.",
          },
        ]
      },
      {
        day: "Dan 3: Lagano ponavljanje",
        exercises: [
          {
            name: "Ustajanje sa stolice",
            volume: "2 serije x 8-10 ponavljanja",
            form: "Ustani sa stabilne stolice koristeći ruke kao oslonac ako je potrebno. Vrati se polako i kontrolisano.",
          },
          {
            name: "Sklek uz zid",
            volume: "2 serije x 8-12 ponavljanja",
            form: "Drži telo pravo i pomeraj se polako prema zidu i od njega.",
          },
          {
            name: "Bird dog",
            volume: "2 serije x 6 ponavljanja po strani",
            form: "Ispruži suprotnu ruku i nogu samo koliko možeš uz stabilan trup.",
          },
        ]
      }
    ]
  };
};

module.exports = { generatePremiumWorkout };
