// Creates the first admin user. Reads the account from environment variables so the
// password never lands in the repository or the shell history:
//   ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... npm run admin:create
// Uses better-auth's own context, so the password is hashed exactly as on a normal sign-in.
import "dotenv/config";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MIN_PASSWORD_LENGTH = 12;

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !name || !password) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must have at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (await db.user.findUnique({ where: { email } })) {
    throw new Error(`A user with email ${email} already exists.`);
  }

  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser(
    { email, name, emailVerified: true, role: "admin" },
    { method: "admin" },
  );
  try {
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await ctx.password.hash(password),
    });
  } catch (error) {
    // Without a credential the user cannot sign in and a retry would hit "already exists".
    await db.user.delete({ where: { id: user.id } }).catch((cleanupError) => {
      console.error(`Could not remove the incomplete user ${email}; delete it by hand.`, cleanupError);
    });
    throw error;
  }

  console.log(`admin created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
