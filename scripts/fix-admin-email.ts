import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Busca o usuário pelo nome ou pelo email antigo (name = "admin" ou qualquer usuário existente)
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, active: true },
    orderBy: { id: "asc" },
  });

  console.log("Usuários encontrados:");
  users.forEach(u => console.log(`  id=${u.id} name="${u.name}" email="${u.email}" active=${u.active}`));

  if (users.length === 0) {
    console.log("Nenhum usuário encontrado. Criando usuário admin...");
    const hash = await bcrypt.hash("admin123", 12);
    const user = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@admin.com",
        password: hash,
        active: true,
      },
    });
    console.log(`Usuário criado: id=${user.id} email=${user.email}`);
    return;
  }

  // Pega o primeiro usuário (ou o que tem name="admin")
  const target = users.find(u => u.name.toLowerCase() === "admin") ?? users[0];
  console.log(`\nAtualizando usuário id=${target.id} (${target.name})...`);

  // Só atualiza o email — mantém senha, campanhas e tudo mais
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      email: "admin@admin.com",
      active: true,
    },
    include: { _count: { select: { campaigns: true } } },
  });

  console.log(`✓ Email atualizado para: ${updated.email}`);
  console.log(`  Campanhas vinculadas: ${updated._count.campaigns}`);
  console.log(`\nAgora acesse /admin/login com:`);
  console.log(`  Email: admin@admin.com`);
  console.log(`  Senha: admin123`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
