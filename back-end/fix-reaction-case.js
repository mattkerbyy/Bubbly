import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const REACTION_MAP = {
  'LIKE': 'Like',
  'HEART': 'Heart',
  'LAUGHING': 'Laughing',
  'WOW': 'Wow',
  'SAD': 'Sad',
  'ANGRY': 'Angry'
}

async function fixReactionCase() {
  console.log('🔄 Starting reaction case fix...')

  try {
    // Fix Share Reactions
    console.log('📝 Fixing share reactions...')
    const shareReactions = await prisma.shareReaction.findMany()
    
    for (const reaction of shareReactions) {
      const uppercaseType = reaction.reactionType.toUpperCase()
      const correctType = REACTION_MAP[uppercaseType]
      
      if (correctType && reaction.reactionType !== correctType) {
        await prisma.shareReaction.update({
          where: { id: reaction.id },
          data: { reactionType: correctType }
        })
        console.log(`  ✅ Updated share reaction ${reaction.id}: ${reaction.reactionType} → ${correctType}`)
      }
    }

    console.log(`✅ Fixed ${shareReactions.length} share reactions`)
    console.log('🎉 All reactions have been fixed!')
    
  } catch (error) {
    console.error('❌ Error fixing reactions:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixReactionCase()
