import colors from 'colors';
import inquirer from 'inquirer';
import { promises as fs } from 'fs';

import { readTextFile } from './readTextFile';
import { readAbilities } from './abilityDecoder';
import { readComponents, structureComponents } from './abilityComponents';
import { structureAbilities, AbilityData } from './structureAbilities';
import { stringMatch, logAbilityError } from './utilities';

import { CareerLine, AbilityType, AbilityFlags, Stats } from './types';

import archmage from '../src/data/abilities/archmage.json';
import blackOrc from '../src/data/abilities/black-orc.json';
import blackGuard from '../src/data/abilities/black-guard.json';
import brightWizard from '../src/data/abilities/bright-wizard.json';
import choppa from '../src/data/abilities/choppa.json';
import chosen from '../src/data/abilities/chosen.json';
import discipleOfKhaine from '../src/data/abilities/disciple-of-khaine.json';
import engineer from '../src/data/abilities/engineer.json';
import ironbreaker from '../src/data/abilities/ironbreaker.json';
import knightOfTheBlazingSun from '../src/data/abilities/knight-of-the-blazing-sun.json';
import magus from '../src/data/abilities/magus.json';
import marauder from '../src/data/abilities/marauder.json';
import runePriest from '../src/data/abilities/rune-priest.json';
import shadowWarrior from '../src/data/abilities/shadow-warrior.json';
import shaman from '../src/data/abilities/shaman.json';
import slayer from '../src/data/abilities/slayer.json';
import sorcerer from '../src/data/abilities/sorcerer.json';
import squigHerder from '../src/data/abilities/squig-herder.json';
import swordMaster from '../src/data/abilities/sword-master.json';
import warriorPriest from '../src/data/abilities/warrior-priest.json';
import whiteLion from '../src/data/abilities/white-lion.json';
import witchElf from '../src/data/abilities/witch-elf.json';
import witchHunter from '../src/data/abilities/witch-hunter.json';
import zealot from '../src/data/abilities/zealot.json';

import { Career, Ability } from '../src/helpers/abilities';
import { validateNote } from './validateNote';
import { validateDescription } from './validateDescription';
import { validateComponentValues } from './validateComponentValues';
import { validateAPCost } from './validateAPCost';
import { validateCooldown } from './validateCooldown';
import { validateMinRank } from './validateMinRank';
import { validateCastTime } from './validateCastTime';
import { validateRange } from './validateRange';
import { validateName } from './validateName';
import { validateMastery } from './validateMastery';
import { validateType } from './validateType';

const careerData: {
  archmage: Career;
  'black-guard': Career;
  'black-orc': Career;
  'bright-wizard': Career;
  choppa: Career;
  chosen: Career;
  'disciple-of-khaine': Career;
  engineer: Career;
  ironbreaker: Career;
  'knight-of-the-blazing-sun': Career;
  magus: Career;
  marauder: Career;
  'rune-priest': Career;
  'shadow-warrior': Career;
  shaman: Career;
  slayer: Career;
  sorcerer: Career;
  'squig-herder': Career;
  'sword-master': Career;
  'warrior-priest': Career;
  'white-lion': Career;
  'witch-elf': Career;
  'witch-hunter': Career;
  zealot: Career;
} = {
  archmage,
  'black-guard': blackGuard,
  'black-orc': blackOrc,
  'bright-wizard': brightWizard,
  choppa,
  chosen,
  'disciple-of-khaine': discipleOfKhaine,
  engineer,
  ironbreaker,
  'knight-of-the-blazing-sun': knightOfTheBlazingSun,
  magus,
  marauder,
  'rune-priest': runePriest,
  'shadow-warrior': shadowWarrior,
  shaman,
  slayer,
  sorcerer,
  'squig-herder': squigHerder,
  'sword-master': swordMaster,
  'warrior-priest': warriorPriest,
  'white-lion': whiteLion,
  'witch-elf': witchElf,
  'witch-hunter': witchHunter,
  zealot,
} as const;

// Validate single ability
const validateAbility = async (
  ability: Ability,
  abilityData: { [key: number]: AbilityData },
  career: Career,
  careerId: number, // Used to filter out selection of abilities to only ones from current career
  stats: Stats,
): Promise<Ability> => {
  if (ability.gameId === undefined) {
    const matchingName = Object.values(abilityData).filter(
      (gameAbility) =>
        gameAbility.Name === ability.name &&
        (gameAbility.CareerID === 0 || gameAbility.CareerID === careerId) &&
        gameAbility.Description !== undefined,
    );

    // How many characters of description match for each skill
    const descriptionMatch = [
      '',
      ...matchingName.map((gameAbility) => gameAbility.Description || ''),
    ].map((description) => stringMatch(ability.description, description));

    // Only one ability matches, and description seems to match as well
    if (matchingName.length === 1 && descriptionMatch[1] > 0) {
      return { ...ability, gameId: matchingName[0].AbilityID };
    }

    const gameId = await inquirer.prompt({
      type: 'list',
      name: 'gameId',
      message: `Select gameId attribute for ${colors.green(
        ability.name,
      )}\n${colors.yellow(ability.description)}`,
      choices: [
        { name: 'None', value: null },
        ...matchingName.map((gameAbility) => ({
          name: `(CID: ${gameAbility.CareerID}) ${gameAbility.AbilityID}: ${gameAbility.Description}`,
          value: gameAbility.AbilityID,
        })),
      ],
      default: descriptionMatch.findIndex(
        (n) => n === Math.max(...descriptionMatch),
      ),
    });
    if (gameId.gameId) {
      return { ...ability, gameId: gameId.gameId };
    }
    return ability;
  }
  const gameAbility = abilityData[ability.gameId];

  /* if (
    gameAbility.Components.find(
      component => component.Operation === ComponentOP.MECHANIC_CHANGE,
    )
  ) {
    logAbility(gameAbility);
    gameAbility.Components.forEach(logComponent);
  } */

  const updatedAbility = {
    ...ability,
    ...validateCooldown(ability, gameAbility),
    ...validateMinRank(ability, gameAbility),
    ...validateMastery(ability, gameAbility, career),
    ...validateCastTime(ability, gameAbility),
    ...validateRange(ability, gameAbility),
    ...validateAPCost(ability, gameAbility),
    ...validateName(ability, gameAbility),
    ...validateNote(ability, gameAbility),
    ...validateComponentValues(ability, gameAbility, stats, abilityData),
    ...validateType(ability, gameAbility),
  };

  // Use previous values for calculating description
  return {
    ...updatedAbility,
    ...validateDescription(updatedAbility, gameAbility),
  };
};

// Validate one career
const validateCareer = async (
  careerSlug: keyof typeof careerData,
  careerId: number,
  stats: Stats,
  abilityData: { [key: number]: AbilityData },
): Promise<void> => {
  console.log(colors.green(`\nValidating ${careerSlug}`));
  const career = careerData[careerSlug];

  let fixedAbilities = [];
  for (const ability of career.data.filter(
    (ability) => ability.category !== 'TomeTactic',
  )) {
    fixedAbilities.push(
      await validateAbility(ability, abilityData, career, careerId, stats),
    );
  }

  await fs.writeFile(
    `../src/data/abilities/${careerSlug}.json`,
    JSON.stringify(
      {
        ...career,
        data: fixedAbilities,
      },
      undefined,
      2,
    ),
  );
  return;
};

// Read data and validate
const main = async () => {
  const abilityNames = await readTextFile(
    'data/strings/english/abilitynames.txt',
    'utf16be',
  );
  const abilityDescriptions = await readTextFile(
    'data/strings/english/abilitydesc.txt',
    'utf16be',
  );
  const abilityResults = await readTextFile(
    'data-master/strings/english/abilityresults.txt',
    'utf16le',
  );
  const abilityComponents = structureComponents(await readComponents());
  // TODO: Promise.all refactor this
  const abilityData = structureAbilities(
    await readAbilities(),
    abilityNames,
    abilityDescriptions,
    abilityComponents,
    abilityResults,
  );

  // Debug
  const printDebugAbilities: number[] = [14313];
  await Promise.all(
    printDebugAbilities.map((abilityId) => {
      return fs.writeFile(
        `../abilities/${abilityId}_${abilityData[abilityId].Name.replace(
          /[\s']+/,
          '_',
        )}.json`,
        JSON.stringify(abilityData[abilityId], undefined, 2),
      );
    }),
  );

  Object.values(abilityData).forEach((ability) => {
    if (
      /*ability.CareerID !== 0 &&
      ability.Components.find((component) => component?.A07 != 0) */
      ability.Flags & AbilityFlags.FLAG13
    ) {
      console.log(
        colors.cyan(ability.Name),
        colors.red(ability.AbilityID.toString()),
        ability.AbilityType,
        ability.Description,
        ability.Components.map((component) => component?.A07),
      );
    }
  });

  /*
  await validateCareer(
    'ironbreaker',
    CareerLine.IRON_BREAKER,
    {
      strength: 147,
      ballisticSkill: 98,
      intelligence: 74,
      willpower: 172,
    },
    abilityData,
  );
  await validateCareer(
    'slayer',
    CareerLine.SLAYER,
    {
      strength: 221,
      ballisticSkill: 96,
      intelligence: 72,
      willpower: 123,
    },
    abilityData,
  );
  await validateCareer(
    'rune-priest',
    CareerLine.RUNE_PRIEST,
    {
      strength: 98,
      ballisticSkill: 74,
      intelligence: 226,
      willpower: 222,
    },
    abilityData,
  );
  await validateCareer(
    'engineer',
    CareerLine.ENGINEER,
    {
      strength: 137,
      ballisticSkill: 221,
      intelligence: 74,
      willpower: 123,
    },
    abilityData,
  );

  // TODO: fix stats
  await validateCareer(
    'black-orc',
    CareerLine.BLACK_ORC,
    {
      strength: 172,
      ballisticSkill: 98,
      intelligence: 74,
      willpower: 147,
    },
    abilityData,
  );
  await validateCareer(
    'choppa',
    CareerLine.CHOPPA,
    {
      strength: 221,
      ballisticSkill: 68,
      intelligence: 74,
      willpower: 123,
    },
    abilityData,
  );
  await validateCareer(
    'shaman',
    CareerLine.SHAMAN,
    {
      strength: 98,
      ballisticSkill: 74,
      intelligence: 196,
      willpower: 221,
    },
    abilityData,
  );
  await validateCareer(
    'squig-herder',
    CareerLine.SQUIG_HERDER,
    {
      strength: 147,
      ballisticSkill: 221,
      intelligence: 74,
      willpower: 98,
    },
    abilityData,
  );
  await validateCareer(
    'witch-hunter',
    CareerLine.WITCH_HUNTER,
    {
      strength: 172,
      ballisticSkill: 123,
      intelligence: 74,
      willpower: 118,
    },
    abilityData,
  );
  await validateCareer(
    'knight-of-the-blazing-sun',
    CareerLine.KNIGHT_OF_THE_BLAZING_SUN,
    {
      strength: 197,
      ballisticSkill: 74,
      intelligence: 99,
      willpower: 148,
    },
    abilityData,
  );
  await validateCareer(
    'bright-wizard',
    CareerLine.BRIGHT_WIZARD,
    {
      strength: 99,
      ballisticSkill: 74,
      intelligence: 221,
      willpower: 197,
    },
    abilityData,
  );
  await validateCareer(
    'warrior-priest',
    CareerLine.WARRIOR_PRIEST,
    {
      strength: 172,
      ballisticSkill: 74,
      intelligence: 99,
      willpower: 221,
    },
    abilityData,
  );
  await validateCareer(
    'chosen',
    CareerLine.CHOSEN,
    {
      strength: 197,
      ballisticSkill: 74,
      intelligence: 99,
      willpower: 148,
    },
    abilityData,
  );
  await validateCareer(
    'marauder',
    CareerLine.MARAUDER,
    {
      strength: 221,
      ballisticSkill: 99,
      intelligence: 74,
      willpower: 197,
    },
    abilityData,
  );
  await validateCareer(
    'zealot',
    CareerLine.ZEALOT,
    {
      strength: 99,
      ballisticSkill: 74,
      intelligence: 196,
      willpower: 221,
    },
    abilityData,
  );
  await validateCareer(
    'magus',
    CareerLine.MAGUS,
    {
      strength: 98,
      ballisticSkill: 74,
      intelligence: 221,
      willpower: 172,
    },
    abilityData,
  );
  await validateCareer(
    'sword-master',
    CareerLine.SWORD_MASTER,
    {
      strength: 147,
      ballisticSkill: 74,
      intelligence: 123,
      willpower: 98,
    },
    abilityData,
  );
  await validateCareer(
    'shadow-warrior',
    CareerLine.SHADOW_WARRIOR,
    {
      strength: 172,
      ballisticSkill: 221,
      intelligence: 74,
      willpower: 98,
    },
    abilityData,
  );
  await validateCareer(
    'white-lion',
    CareerLine.WHITE_LION,
    {
      strength: 196,
      ballisticSkill: 74,
      intelligence: 98,
      willpower: 123,
    },
    abilityData,
  );
  await validateCareer(
    'archmage',
    CareerLine.ARCHMAGE,
    {
      strength: 98,
      ballisticSkill: 74,
      intelligence: 196,
      willpower: 221,
    },
    abilityData,
  );
  await validateCareer(
    'black-guard',
    CareerLine.BLACK_GUARD,
    {
      strength: 147,
      ballisticSkill: 98,
      intelligence: 74,
      willpower: 133,
    },
    abilityData,
  );
  await validateCareer(
    'witch-elf',
    CareerLine.WITCH_ELF,
    {
      strength: 172,
      ballisticSkill: 74,
      intelligence: 98,
      willpower: 147,
    },
    abilityData,
  );
  await validateCareer(
    'disciple-of-khaine',
    CareerLine.DISCIPLE_OF_KHAINE,
    {
      strength: 172,
      ballisticSkill: 74,
      intelligence: 98,
      willpower: 221,
    },
    abilityData,
  );
  await validateCareer(
    'sorcerer',
    CareerLine.SORCERESS,
    {
      strength: 98,
      ballisticSkill: 74,
      intelligence: 221,
      willpower: 196,
    },
    abilityData,
  ); */
};

main()
  .then()
  .catch((err) => {
    console.error(err);
  });
