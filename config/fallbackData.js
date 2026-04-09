const fallbackCharacters = [
  { letter: 'L', name: 'Monkey D. Luffy', chapter: '1', episode: '1', year: '1997', note: 'Seed dataset' },
  { letter: 'R', name: 'Roronoa Zoro', chapter: '3', episode: '2', year: '1997', note: 'Seed dataset' },
  { letter: 'N', name: 'Nami', chapter: '8', episode: '1', year: '1997', note: 'Seed dataset' },
  { letter: 'U', name: 'Usopp', chapter: '23', episode: '8', year: '1997', note: 'Seed dataset' },
  { letter: 'S', name: 'Sanji', chapter: '43', episode: '20', year: '1998', note: 'Seed dataset' },
  { letter: 'T', name: 'Tony Tony Chopper', chapter: '134', episode: '81', year: '2000', note: 'Seed dataset' },
  { letter: 'N', name: 'Nico Robin', chapter: '114', episode: '67', year: '1999', note: 'Seed dataset' },
  { letter: 'F', name: 'Franky', chapter: '329', episode: '233', year: '2004', note: 'Seed dataset' },
  { letter: 'B', name: 'Brook', chapter: '442', episode: '337', year: '2006', note: 'Seed dataset' },
  { letter: 'J', name: 'Jinbe', chapter: '528', episode: '430', year: '2008', note: 'Seed dataset' },
  { letter: 'S', name: 'Shanks', chapter: '1', episode: '4', year: '1997', note: 'Seed dataset' },
  { letter: 'P', name: 'Portgas D. Ace', chapter: '154', episode: '91', year: '2000', note: 'Seed dataset' },
  { letter: 'T', name: 'Trafalgar D. Water Law', chapter: '498', episode: '392', year: '2008', note: 'Seed dataset' },
  { letter: 'E', name: 'Eustass Kid', chapter: '498', episode: '392', year: '2008', note: 'Seed dataset' },
  { letter: 'B', name: 'Boa Hancock', chapter: '516', episode: '409', year: '2008', note: 'Seed dataset' }
];

const fallbackCrews = [
  { letter: 'S', name: 'Straw Hat Pirates', numberOfMembers: '10', chapter: '6', episode: '3', year: '1997', note: 'Seed dataset' },
  { letter: 'R', name: 'Red Hair Pirates', numberOfMembers: 'Core + fleet', chapter: '1', episode: '4', year: '1997', note: 'Seed dataset' },
  { letter: 'B', name: 'Blackbeard Pirates', numberOfMembers: '10 Titanic Captains', chapter: '223', episode: '146', year: '2002', note: 'Seed dataset' },
  { letter: 'H', name: 'Heart Pirates', numberOfMembers: 'Approx. 20', chapter: '498', episode: '392', year: '2008', note: 'Seed dataset' },
  { letter: 'K', name: 'Kid Pirates', numberOfMembers: 'Core crew', chapter: '498', episode: '392', year: '2008', note: 'Seed dataset' }
];

const fallbackCharacterDetails = [
  { name: 'Monkey D. Luffy', status: 'Alive', age: '19', birthday: 'May 5', height: '174 cm', affiliations: 'Straw Hat Pirates', occupations: 'Pirate Captain' },
  { name: 'Roronoa Zoro', status: 'Alive', age: '21', birthday: 'November 11', height: '181 cm', affiliations: 'Straw Hat Pirates', occupations: 'Combatant' },
  { name: 'Nami', status: 'Alive', age: '20', birthday: 'July 3', height: '170 cm', affiliations: 'Straw Hat Pirates', occupations: 'Navigator' },
  { name: 'Usopp', status: 'Alive', age: '19', birthday: 'April 1', height: '176 cm', affiliations: 'Straw Hat Pirates', occupations: 'Sniper' },
  { name: 'Sanji', status: 'Alive', age: '21', birthday: 'March 2', height: '180 cm', affiliations: 'Straw Hat Pirates', occupations: 'Cook' }
];

module.exports = {
  fallbackCharacters,
  fallbackCrews,
  fallbackCharacterDetails
};
