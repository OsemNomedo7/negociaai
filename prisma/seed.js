const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Admin padrão
  const hash = await bcrypt.hash("admin123", 12);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: hash },
  });

  // Settings padrão
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Devedores de exemplo
  const debtors = [
    {
      name: "João Carlos Silva",
      cpf: "529.982.247-25",
      amount: 2380.0,
      description: "Empréstimo pessoal — Banco XYZ",
      status: "PENDENTE",
    },
    {
      name: "Maria Aparecida Souza",
      cpf: "111.444.777-35",
      amount: 5150.0,
      description: "Cartão de crédito — Financeira ABC",
      status: "PENDENTE",
    },
    {
      name: "Carlos Eduardo Lima",
      cpf: "871.188.656-31",
      amount: 870.0,
      description: "Mensalidade em atraso — Loja DEF",
      status: "PENDENTE",
    },
  ];

  for (const d of debtors) {
    const existing = await prisma.debtor.findFirst({ where: { cpf: d.cpf, campaignId: null } });
    if (!existing) await prisma.debtor.create({ data: d });
  }

  console.log("✅ Seed concluído!");
  console.log("   Admin: admin / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
