import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const passwordHash = await bcrypt.hash('admin123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@whatsapp-mvp.com' },
    update: {},
    create: {
      email: 'admin@whatsapp-mvp.com',
      passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create default bot config
  const botConfig = await prisma.botConfig.upsert({
    where: { id: 'default-bot-config' },
    update: {},
    create: {
      id: 'default-bot-config',
      name: 'Default Assistant',
      systemPrompt: 'You are a helpful customer service assistant. Be friendly, concise, and professional. Answer questions about our products and services. If you cannot help with something, let the customer know that a human agent will be available shortly.',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1024,
      isActive: true,
    },
  });
  console.log('Bot config created:', botConfig.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
