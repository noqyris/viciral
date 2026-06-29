/**
 * Phase 2 backfill: give every existing user an Organization (org = brand) and
 * re-point their org-scoped resources to it. Idempotent — safe to run repeatedly
 * (only creates orgs for users that have none; only re-points rows where
 * organizationId IS NULL).
 *
 * Run: node --env-file=.env prisma/backfill-orgs.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(s) {
  const base = (s || "brand")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "brand";
}

async function uniqueSlug(base) {
  let slug = base;
  let n = 1;
  // slug is @unique — append a counter on collision
  while (await prisma.organization.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

async function main() {
  const users = await prisma.user.findMany({
    include: {
      brandProfiles: true,
      memberships: { include: { organization: true } },
    },
  });

  let createdOrgs = 0;
  let skippedUsers = 0;
  let repointed = 0;

  for (const user of users) {
    // Idempotency: if the user already has any membership, reuse it (prefer personal).
    let personalOrg =
      user.memberships.find((m) => m.organization.personal)?.organization ??
      user.memberships[0]?.organization ??
      null;

    if (!personalOrg) {
      const brands = user.brandProfiles;
      if (brands.length > 0) {
        // One Organization per existing brand profile; default (or first) = personal.
        const defaultBrandId = (brands.find((b) => b.isDefault) ?? brands[0]).id;
        for (const b of brands) {
          const isPersonal = b.id === defaultBrandId;
          const slug = await uniqueSlug(slugify(b.name));
          const org = await prisma.organization.create({
            data: {
              slug,
              name: b.name,
              colors: b.colors ?? undefined,
              voice: b.voice ?? undefined,
              logoUrl: b.logoUrl ?? undefined,
              referenceImages: b.referenceImages ?? undefined,
              fonts: b.fonts ?? undefined,
              notes: b.notes ?? undefined,
              personal: isPersonal,
              members: { create: { userId: user.id, role: "OWNER" } },
            },
          });
          createdOrgs += 1;
          if (isPersonal) personalOrg = org;
        }
      } else {
        // No brands → one default personal org named after the user.
        const name = user.name?.trim() || user.email?.split("@")[0] || "My brand";
        const slug = await uniqueSlug(slugify(name));
        personalOrg = await prisma.organization.create({
          data: {
            slug,
            name,
            personal: true,
            members: { create: { userId: user.id, role: "OWNER" } },
          },
        });
        createdOrgs += 1;
      }
    } else {
      skippedUsers += 1;
    }

    // Re-point existing resources (only rows not yet scoped) to the personal org.
    const orgId = personalOrg.id;
    const where = { userId: user.id, organizationId: null };
    const data = { organizationId: orgId };
    const [g, p, sc, sp, cl] = await Promise.all([
      prisma.generation.updateMany({ where, data }),
      prisma.project.updateMany({ where, data }),
      prisma.socialConnection.updateMany({ where, data }),
      prisma.scheduledPost.updateMany({ where, data }),
      prisma.creditLedger.updateMany({ where, data }),
    ]);
    repointed += g.count + p.count + sc.count + sp.count + cl.count;
  }

  console.log(
    `Backfill done. users=${users.length} orgsCreated=${createdOrgs} usersSkipped(alreadyHadOrg)=${skippedUsers} resourcesRepointed=${repointed}`,
  );
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
