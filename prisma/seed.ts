import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.card.deleteMany()
  await prisma.collection.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      email: 'collector@cardledger.app',
      name: 'Brendan',
    },
  })

  const vintageIcons = await prisma.collection.create({
    data: {
      name: 'Vintage Icons',
      description: 'Hall of Fame legends and cornerstone cardboard from the golden era.',
      userId: user.id,
    },
  })

  const cubsCorner = await prisma.collection.create({
    data: {
      name: 'North Side PC',
      description: 'My personal Cubs shelf with modern rookies, favorites, and game-day nostalgia.',
      userId: user.id,
    },
  })

  const rookiesOnDeck = await prisma.collection.create({
    data: {
      name: 'Rookies On Deck',
      description: 'Breakout candidates, first bows, and young stars I am tracking early.',
      userId: user.id,
    },
  })

  await prisma.card.createMany({
    data: [
      {
        playerName: 'Ted Williams',
        year: 1954,
        setName: 'Topps',
        cardTitle: 'Base',
        team: 'Boston Red Sox',
        notes: 'Centering is strong and the color still pops.',
        isFavorite: true,
        collectionId: vintageIcons.id,
      },
      {
        playerName: 'Jackie Robinson',
        year: 1956,
        setName: 'Topps',
        cardTitle: 'Gray Back',
        team: 'Brooklyn Dodgers',
        notes: 'One of the anchors of the vintage box.',
        isFavorite: true,
        collectionId: vintageIcons.id,
      },
      {
        playerName: 'Ernie Banks',
        year: 1958,
        setName: 'Topps All-Star',
        cardTitle: 'All-Star',
        team: 'Chicago Cubs',
        notes: 'Picked up at the Rosemont show last fall.',
        isFavorite: false,
        collectionId: vintageIcons.id,
      },
      {
        playerName: 'Ryne Sandberg',
        year: 1984,
        setName: 'Topps',
        cardTitle: 'Base',
        team: 'Chicago Cubs',
        notes: 'Sharp corners and a clean back.',
        isFavorite: true,
        collectionId: cubsCorner.id,
      },
      {
        playerName: 'Kris Bryant',
        year: 2015,
        setName: 'Topps Chrome',
        cardTitle: 'Rookie Card',
        team: 'Chicago Cubs',
        notes: 'Still one of my favorite modern Cubs rookies.',
        isFavorite: false,
        collectionId: cubsCorner.id,
      },
      {
        playerName: 'Shota Imanaga',
        year: 2025,
        setName: 'Topps Heritage',
        cardTitle: 'High Number SP',
        team: 'Chicago Cubs',
        notes: 'A fun short print from the current box.',
        isFavorite: true,
        collectionId: cubsCorner.id,
      },
      {
        playerName: 'Elly De La Cruz',
        year: 2024,
        setName: 'Bowman Chrome',
        cardTitle: 'Prospect Spotlight',
        team: 'Cincinnati Reds',
        notes: 'Electric player, bought after a weekend series.',
        isFavorite: false,
        collectionId: rookiesOnDeck.id,
      },
      {
        playerName: 'Paul Skenes',
        year: 2025,
        setName: 'Topps Finest',
        cardTitle: 'Rookie Design Variation',
        team: 'Pittsburgh Pirates',
        notes: 'The refractor finish looks great under light.',
        isFavorite: true,
        collectionId: rookiesOnDeck.id,
      },
      {
        playerName: 'Jackson Holliday',
        year: 2024,
        setName: 'Bowman',
        cardTitle: '1st Bowman',
        team: 'Baltimore Orioles',
        notes: 'A cornerstone card for the prospect drawer.',
        isFavorite: false,
        collectionId: rookiesOnDeck.id,
      },
    ],
  })
}

main()
  .then(() => {
    console.log('🌱 Seeded database')
  })
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
